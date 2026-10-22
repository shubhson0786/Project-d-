const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('../dashboard/node_modules/mongodb-memory-server-core');
const mongoose = require('../dashboard/node_modules/mongoose');
const { randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { existsSync } = require('node:fs');
process.env.MONGOMS_DOWNLOAD_DIR = join(__dirname, '..', '.cache', 'mongodb');
process.env.SESSION_SECRET = 'integration-secret-with-at-least-32-characters';
process.env.PAYMENT_MODE = 'paper';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';
const alice = '0123456789abcdef01234567';
const bob = '1123456789abcdef01234567';
const { sign, cookie } = require('../dashboard/lib/auth');
test('multi-user trading with a real MongoDB replica set', { timeout: 240000 }, async t => {
  const binaryPath = join(__dirname, '..', '.cache', 'mongodb', 'mongod.exe');
  const repl = await MongoMemoryReplSet.create({ binary: { version: '7.0.24', ...(existsSync(binaryPath) ? { systemBinary: binaryPath } : {}) }, replSet: { count: 1, storageEngine: 'wiredTiger' } });
  t.after(async () => { await mongoose.disconnect(); await require('../frontend/node_modules/mongoose').disconnect(); await repl.stop(); });
  process.env.MONGO_URL = repl.getUri('trading');
  const { connectDatabase } = require('../dashboard/lib/database'); await connectDatabase();
  const { Holding, Order, Transfer, Trade } = require('../dashboard/lib/trading-models');
  const { quote } = require('../dashboard/lib/market');
  const { FundAccount, PaymentOrder } = require('../dashboard/lib/funds');
  await Promise.all([Holding.init(), Order.init(), Transfer.init(), Trade.init(), FundAccount.init(), PaymentOrder.init()]);
  const maker = '3123456789abcdef01234567';
  await FundAccount.create({ accountKey: maker, balance: 1000000000, balancePaise: 100000000000 });
  for (const name of ['INFY', 'WIPRO']) await Holding.create({ userId: maker, name, qty: 100000, costBasisPaise: 1000000 });
  const { app } = require('../backend/index');
  const server = app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function api(path, user = alice, body) {
    const res = await fetch(base + '/api/' + path, { method: body ? 'POST' : 'GET', headers: { cookie: cookie(sign({sub:user,name:user === alice ? 'Alice' : 'Bob'},'session',60000)), 'content-type':'application/json' }, ...(body ? {body:JSON.stringify(body)} : {}) });
    return { status:res.status, data:await res.json() };
  }
  const transfer = (user,type,amount,requestId=randomUUID()) => api('funds',user,{type,amount,requestId});
  const placeTrade = (user,name,qty,mode,requestId=randomUUID(),extra={}) => api('orders',user,{name,qty,mode,requestId,...extra});
  async function giveLiquidity(name, mode, quantity = 100000) {
    const market = quote(name);
    await Order.create({ userId: maker, requestId: randomUUID(), name, qty: quantity, price: market.price, orderPricePaise: market.pricePaise, totalPaise: 0, estimatedTotalPaise: market.pricePaise * quantity, mode: mode === 'BUY' ? 'SELL' : 'BUY', status: 'OPEN', filledQty: 0 });
  }
  async function fill(user, placed) {
    if (placed.status !== 201) return placed;
    if (placed.data.status !== 'FILLED') await giveLiquidity(placed.data.name, placed.data.mode);
    const orders = (await api('orders', user)).data;
    return { ...placed, data: orders.find(order => order._id === placed.data._id) };
  }
  const trade = async (...args) => fill(args[0], await placeTrade(...args));
  await t.test('real registration, login and dashboard sessions keep two users separate', async () => {
    async function authenticate(name, action = 'REGISTER') {
      const response = await fetch(base + '/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, name, email: `${name.toLowerCase()}@example.com`, password: 'integration-password-123' }) });
      assert.equal(response.status, action === 'REGISTER' ? 201 : 200);
      const auth = await response.json();
      const session = await fetch(base + '/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ handoff: auth.handoff }) });
      assert.equal(session.status, 200);
      return session.headers.get('set-cookie').split(';')[0];
    }
    const first = await authenticate('Diana');
    const second = await authenticate('Elena');
    const deposit = await fetch(base + '/api/funds', { method: 'POST', headers: { cookie: first, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'ADD', amount: 5000, requestId: randomUUID() }) });
    assert.equal(deposit.status, 200);
    const buy = await fetch(base + '/api/orders', { method: 'POST', headers: { cookie: first, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'WIPRO', qty: 1, mode: 'BUY', requestId: randomUUID() }) });
    assert.equal(buy.status, 201);
    const login = await authenticate('Diana', 'LOGIN');
    const owned = await (await fetch(base + '/api/holdings', { headers: { cookie: login } })).json();
    assert.equal(owned[0].qty, 1);
    const separate = await (await fetch(base + '/api/holdings', { headers: { cookie: second } })).json();
    assert.deepEqual(separate, []);
    assert.equal((await (await fetch(base + '/api/funds', { headers: { cookie: second } })).json()).balance, 0);
    const logout = await fetch(base + '/api/session', { method: 'DELETE', headers: { cookie: first } });
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  });
  await t.test('profiles persist by authenticated user ID and reject identity changes', async () => {
    const collection = mongoose.connection.collection('users');
    await collection.insertMany([
      { _id: new mongoose.Types.ObjectId(alice), name: 'Alice', email: 'alice@example.com', passwordHash: 'private-secret-hash', createdAt: new Date() },
      { _id: new mongoose.Types.ObjectId(bob), name: 'Bob', email: 'bob@example.com', passwordHash: 'another-private-hash', createdAt: new Date() },
    ]);
    const headers = { cookie: cookie(sign({sub:alice,name:'Old Alice'},'session',60000)), 'content-type':'application/json' };
    const original = (await api('profile')).data;
    assert.equal(original.id, alice); assert.equal(original.email, 'alice@example.com'); assert.equal(original.passwordHash, undefined);
    const details = { name: 'Alice Investor', phone: '+91 98765 43210', city: 'Mumbai', occupation: 'Engineer', bio: 'Long-term investing' };
    const saved = await fetch(base + '/api/profile', { method: 'PATCH', headers, body: JSON.stringify(details) });
    assert.equal(saved.status, 200); const profile = await saved.json(); assert.equal(profile.id, alice); assert.equal(profile.city, 'Mumbai');
    const fresh = (await api('profile')).data;
    for (const [key, value] of Object.entries(details)) assert.equal(fresh[key], value);
    const other = (await api('profile', bob)).data; assert.equal(other.name, 'Bob'); assert.equal(other.city, '');
    const spoof = await fetch(base + '/api/profile', { method: 'PATCH', headers, body: JSON.stringify({name:'Hijacked',userId:bob}) }); assert.equal(spoof.status,400);
    const email = await fetch(base + '/api/profile', { method: 'PATCH', headers, body: JSON.stringify({email:'hijacked@example.com'}) }); assert.equal(email.status,400);
    const invalid = await fetch(base + '/api/profile', { method: 'PATCH', headers, body: JSON.stringify({bio:'x'.repeat(241)}) }); assert.equal(invalid.status,400);
    const invalidPhone = await fetch(base + '/api/profile', { method: 'PATCH', headers, body: JSON.stringify({phone:'123'}) }); assert.equal(invalidPhone.status,400);
    const query = await fetch(base + '/api/profile?userId=' + bob, {headers}); assert.equal((await query.json()).id,alice);
    assert.equal((await api('profile',bob)).data.name,'Bob');
    assert.equal((await collection.findOne({_id:new mongoose.Types.ObjectId(alice)})).passwordHash,'private-secret-hash');
    const auth = await fetch(base + '/api/auth', { method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'LOGIN',email:'diana@example.com',password:'integration-password-123'}) });
    const account = await auth.json();
    const session = await fetch(base + '/api/session', { method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({handoff:account.handoff}) });
    const loginCookie = session.headers.get('set-cookie').split(';')[0];
    const patch = await fetch(base + '/api/profile', { method:'PATCH',headers:{cookie:loginCookie,'content-type':'application/json'},body:JSON.stringify({city:'Delhi'}) });assert.equal(patch.status,200);
    const loginAgain = await fetch(base + '/api/auth', { method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'LOGIN',email:'diana@example.com',password:'integration-password-123'}) });
    const again = await loginAgain.json();
    const exchanged = await fetch(base + '/api/session', { method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({handoff:again.handoff}) });
    const againCookie = exchanged.headers.get('set-cookie').split(';')[0];
    const persisted = await fetch(base + '/api/profile',{headers:{cookie:againCookie}});assert.equal((await persisted.json()).city,'Delhi');
  });
  await t.test('new users have independent empty accounts', async () => {
    assert.equal((await api('funds')).data.balance,0);
    assert.equal((await api('funds',bob)).data.balance,0);
    assert.deepEqual((await api('holdings')).data,[]);
  });
  await t.test('deposits are idempotent and user-scoped', async () => {
    const key=randomUUID(); const results=await Promise.all([transfer(alice,'ADD',10000,key),transfer(alice,'ADD',10000,key)]);
    assert.ok(results.every(item=>item.status===200),JSON.stringify(results));
    assert.equal((await api('funds')).data.balance,10000);
    assert.equal((await api('funds',bob)).data.balance,0);
    assert.equal((await transfer(alice,'ADD',1,key)).status,409);
    assert.equal((await transfer(alice,'ADD',0.001)).status,400);
  });
  await t.test('buy without a user seller fills immediately from demo inventory', async () => {
    const demoBuyer = '6123456789abcdef01234567';
    await transfer(demoBuyer, 'ADD', 5000);
    const placed = await placeTrade(demoBuyer, 'TCS', 1, 'BUY');
    assert.equal(placed.status, 201);
    assert.equal(placed.data.status, 'FILLED');
    assert.equal(placed.data.fillSource, 'DEMO');
    assert.equal((await api('holdings', demoBuyer)).data[0].qty, 1);
    assert.equal(Math.round((await api('funds', demoBuyer)).data.balance * 100), 500000 - placed.data.totalPaise);
    assert.equal((await Trade.findOne({ buyOrderId: placed.data._id })).source, 'DEMO');
  });
  await t.test('one user sell listing transfers only matched shares and cash to another user', async () => {
    const seller = '4123456789abcdef01234567';
    const buyer = '5123456789abcdef01234567';
    await Holding.create({ userId: seller, name: 'ONGC', qty: 2, costBasisPaise: 10000 });
    await transfer(buyer, 'ADD', 500);
    const offered = await placeTrade(seller, 'ONGC', 2, 'SELL');
    assert.equal(offered.data.status, 'OPEN');
    assert.equal((await api('quotes',buyer)).data.quotes.find(item=>item.name==='ONGC').availableToBuy,2);
    const purchase = await placeTrade(buyer, 'ONGC', 1, 'BUY');
    assert.equal(purchase.status,201);
    assert.equal(purchase.data.fillSource,'USER');
    assert.equal((await api('holdings',seller)).data[0].qty,1);
    assert.equal((await api('holdings',buyer)).data[0].qty,1);
    const saleOrder=(await api('orders',seller)).data.find(item=>item._id===offered.data._id);
    assert.equal(saleOrder.status,'PARTIALLY_FILLED');
    assert.equal(saleOrder.filledQty,1);
    assert.equal((await api('quotes',buyer)).data.quotes.find(item=>item.name==='ONGC').availableToBuy,1);
    const trade=await Trade.findOne({sellOrderId:offered.data._id,buyOrderId:purchase.data._id});
    assert.equal(trade.qty,1);
    assert.equal(Math.round((await api('funds',seller)).data.balance*100),trade.pricePaise);
    assert.equal(Math.round((await api('funds',buyer)).data.balance*100),50000-trade.pricePaise);
  });
  await t.test('buy fills listed shares first and remaining shares from demo inventory', async () => {
    const buyer = '7123456789abcdef01234567';
    await transfer(buyer, 'ADD', 5000);
    const purchase = await placeTrade(buyer, 'ONGC', 2, 'BUY');
    assert.equal(purchase.status, 201);
    assert.equal(purchase.data.status, 'FILLED');
    assert.equal(purchase.data.fillSource, 'MIXED');
    const fills = await Trade.find({ buyOrderId: purchase.data._id }).lean();
    assert.equal(fills.length, 2);
    assert.deepEqual(fills.map(fill => fill.source).sort(), ['DEMO', 'USER']);
    assert.equal((await api('holdings', buyer)).data[0].qty, 2);
  });
  let first;
  await t.test('buy uses server price, debits cash and creates owned shares exactly once', async () => {
    const key=randomUUID();const placed=await Promise.all([placeTrade(alice,'INFY',2,'BUY',key,{price:0.01,userId:bob}),placeTrade(alice,'INFY',2,'BUY',key,{price:0.01,userId:bob})]);
    const results=await Promise.all(placed.map(item=>fill(alice,item)));
    assert.ok(results.every(item=>item.status===201),JSON.stringify(results));first=results[0].data;
    assert.ok(first.price>1000);assert.equal(first.userId,alice);assert.equal(first.status,'FILLED');
    assert.equal(results[0].data._id,results[1].data._id);
    assert.equal((await api('funds')).data.balance,(1000000-first.totalPaise)/100);
    const holdings=(await api('holdings')).data;assert.equal(holdings[0].qty,2);assert.equal(holdings[0].costBasis,first.totalPaise/100);
    assert.deepEqual((await api('holdings',bob)).data,[]);assert.deepEqual((await api('orders',bob)).data,[]);
    assert.equal((await trade(alice,'INFY',3,'BUY',key)).status,409);
  });
  await t.test('weighted cost basis and partial/full sales conserve money', async () => {
    const next=await trade(alice,'INFY',1,'BUY');assert.equal(next.status,201);
    let holding=(await api('holdings')).data[0];assert.equal(holding.qty,3);
    const cost=first.totalPaise+next.data.totalPaise;assert.equal(Math.round(holding.costBasis*100),cost);
    const sale=await trade(alice,'INFY',1,'SELL');assert.equal(sale.status,201);
    holding=(await api('holdings')).data[0];assert.equal(holding.qty,2);
    assert.equal(Math.round(holding.costBasis*100),cost-Math.round(cost/3));
    const final=await trade(alice,'INFY',2,'SELL');assert.equal(final.status,201);
    assert.deepEqual((await api('holdings')).data,[]);
    const funds=(await api('funds')).data;
    assert.equal(Math.round(funds.balance*100),1000000-first.totalPaise-next.data.totalPaise+sale.data.totalPaise+final.data.totalPaise);
    assert.equal(Math.round(funds.realizedProfit*100),sale.data.totalPaise+final.data.totalPaise-cost);
  });
  await t.test('overselling and insufficient funds leave the database unchanged', async () => {
    const before=await Order.countDocuments({userId:bob});
    assert.equal((await trade(bob,'INFY',1,'SELL')).status,409);
    assert.equal((await trade(bob,'INFY',1,'BUY')).status,409);
    assert.equal(await Order.countDocuments({userId:bob}),before);
    assert.equal((await api('funds',bob)).data.balance,0);
    assert.equal((await trade(bob,'FAKE',1,'BUY')).status,400);
    assert.equal((await trade(bob,'INFY',1.5,'BUY')).status,400);
  });
  await t.test('concurrent buys cannot spend the same cash twice', async () => {
    await transfer(bob,'ADD',2000);
    const results=await Promise.all([placeTrade(bob,'INFY',1,'BUY'),placeTrade(bob,'INFY',1,'BUY')]);
    assert.ok(results.some(item=>item.status===201));
    await api('orders',bob);
    assert.equal((await api('holdings',bob)).data[0].qty,1);
    assert.ok((await api('funds',bob)).data.balance>=0);
  });
  await t.test('concurrent sells cannot sell the same share twice', async () => {
    const results=await Promise.all([placeTrade(bob,'INFY',1,'SELL'),placeTrade(bob,'INFY',1,'SELL')]);
    assert.ok(results.some(item=>item.status===201));
    await api('orders',bob);
    assert.deepEqual((await api('holdings',bob)).data,[]);
  });
  await t.test('withdrawals reject overdrafts, round precisely, and do not repeat on retry', async () => {
    const before=(await api('funds',bob)).data.balance;
    assert.equal((await transfer(bob,'WITHDRAW',before+1)).status,409);
    const key=randomUUID();const results=await Promise.all([transfer(bob,'WITHDRAW',10.25,key),transfer(bob,'WITHDRAW',10.25,key)]);
    assert.ok(results.every(item=>item.status===200),JSON.stringify(results));
    assert.equal(Math.round((await api('funds',bob)).data.balance*100),Math.round(before*100)-1025);
  });
  await t.test('a buy racing a withdrawal cannot overdraw the account', async () => {
    const charlie='2123456789abcdef01234567';await transfer(charlie,'ADD',1600);
    const results=await Promise.all([trade(charlie,'INFY',1,'BUY'),transfer(charlie,'WITHDRAW',100)]);
    assert.ok(results.some(item=>item.status===201 || item.status===200));assert.ok((await api('funds',charlie)).data.balance>=0);
  });
  await t.test('failed trade rolls back cash, holding and ledger changes', async () => {
    const before=await FundAccount.findOne({accountKey:alice}).lean();
    const original=Order.create;Order.create=async()=>{throw new Error('forced write failure');};
    try { assert.equal((await trade(alice,'INFY',1,'BUY')).status,500); } finally {Order.create=original;}
    const after=await FundAccount.findOne({accountKey:alice}).lean();
    assert.equal(after.balancePaise,before.balancePaise);assert.equal(after.transactions.length,before.transactions.length);assert.deepEqual((await api('holdings')).data,[]);
  });
  await t.test('summary and positions reflect actual account state', async () => {
    await trade(alice,'WIPRO',1,'BUY');
    const summary=(await api('summary')).data;const funds=(await api('funds')).data;const holdings=(await api('holdings')).data;
    assert.equal(summary.balance,funds.balance);assert.equal(summary.holdingsCount,holdings.length);assert.equal(summary.currentValue,holdings[0].currentValue);
    assert.equal((await api('positions')).data[0].qty,1);
  });
  await t.test('captured payment credits original owner once across simultaneous retries', async () => {
    await PaymentOrder.create({userId:alice,razorpayOrderId:'order_test',amount:100,currency:'INR'});
    const {creditPayment}=require('../dashboard/lib/payments');
    const payment={id:'pay_test',order_id:'order_test',amount:10000,currency:'INR',status:'captured'};
    const before=(await api('funds')).data.balance;
    await assert.rejects(creditPayment(payment,bob),/not found/);
    await assert.rejects(creditPayment({...payment,amount:1},alice),/not captured/);
    await Promise.all([creditPayment(payment,alice),creditPayment(payment),creditPayment(payment,alice)]);
    assert.equal(Math.round((await api('funds')).data.balance*100),Math.round(before*100)+10000);
    assert.equal(await PaymentOrder.countDocuments({status:'PAID'}),1);
  });
  await t.test('Razorpay test mode rejects unauthenticated paper credit', async () => {
    process.env.PAYMENT_MODE='razorpay_test';
    try { assert.equal((await transfer(alice,'ADD',100)).status,400); }
    finally {process.env.PAYMENT_MODE='paper';}
  });
});
