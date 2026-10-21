const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { readFileSync } = require('node:fs');
process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-32-characters';
const { sign, verify, cookie, requireUser } = require('../dashboard/lib/auth');
const owner = '0123456789abcdef01234567';
const other = '1123456789abcdef01234567';
const response = () => ({ code: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(c) { this.code=c; return this; }, json(data) { this.data=data; return this; } });
const request = (method='GET', user=owner, body={}) => ({ method, body, headers: { host: 'localhost:3001', cookie: cookie(sign({ sub:user }, 'session',60000)) } });
test('auth implementations stay identical across deployment roots', () => {
  assert.equal(readFileSync('frontend/lib/auth.js','utf8'), readFileSync('dashboard/lib/auth.js','utf8'));
});
test('reject missing, tampered, expired and wrong-purpose credentials', () => {
  const token=sign({sub:owner}, 'session',60000);
  assert.equal(verify(token,'session').sub,owner);
  for (const value of [undefined,token+'x',sign({sub:owner},'session',-1),sign({sub:owner},'handoff',60000),sign({sub:'bad'},'session',60000)]) assert.equal(verify(value,'session'),null);
  const res=response(); assert.equal(requireUser({method:'GET',headers:{}},res),null); assert.equal(res.code,401);
});
test('reject cross-origin cookie mutations', () => {
  const req=request('POST'); req.headers.origin='https://attacker.example';
  const res=response(); assert.equal(requireUser(req,res),null); assert.equal(res.code,403);
});
test('handoff creates an HttpOnly session; logout expires it', async () => {
  const session=require('../dashboard/api/session');
  const res=response();
  await session({method:'POST',headers:{},body:{handoff:sign({sub:owner,name:'Alice',email:'alice@example.com'},'handoff',60000)}},res);
  assert.match(res.headers['Set-Cookie'],/HttpOnly/);
  assert.equal(verify(res.headers['Set-Cookie'].split(';')[0].split('=')[1],'session').sub,owner);
  const out=response(); await session(request('DELETE'),out); assert.match(out.headers['Set-Cookie'],/Max-Age=0/);
});
const db=require('../dashboard/lib/database'); db.connectDatabase=async()=>{};
const mongoose=require('../dashboard/node_modules/mongoose');
const {FundAccount,PaymentOrder}=require('../dashboard/lib/funds');
const {validSignature,creditPayment}=require('../dashboard/lib/payments');
test('payment signatures reject malformed Unicode and changed raw bytes', () => {
 const secret='webhook-secret'; const body=Buffer.from('{"event":"payment.captured"}');
 const signature=crypto.createHmac('sha256',secret).update(body).digest('hex');
 assert.equal(validSignature(body,signature,secret),true);
 assert.equal(validSignature(Buffer.from(body+' '),signature,secret),false);
 assert.equal(validSignature(body,'é'.repeat(64),secret),false);
});
test('all protected handlers reject anonymous requests before accessing database', async () => {
 for (const file of ['profile','quotes','summary','orders','holdings','positions','funds','razorpay-order','razorpay-verify','razorpay-reconcile']) {
  const res=response(); await require(`../dashboard/api/${file}`)({method:'GET',headers:{}},res); assert.equal(res.code,401,file);
 }
});
test('orders and portfolio reads are scoped to signed user, never request body', async () => {
 for (const [route,model] of [['orders','Order'],['holdings','Holding'],['positions','Holding']]) {
  const handler=require(`../dashboard/api/${route}`); let query;
  const original=mongoose.models[model].find;
  mongoose.models[model].find=q=>{query=q; return {sort(){return this;},limit(){return this;},lean:async()=>[]};};
  try { const res=response(); await handler(request('GET',owner,{userId:other}),res); assert.deepEqual(query,{userId:owner}); assert.equal(res.code,200); }
  finally { mongoose.models[model].find=original; }
 }
});
test('webhook authenticates exact raw body without user cookies', async () => {
 const handler=require('../dashboard/api/razorpay-webhook'); process.env.RAZORPAY_WEBHOOK_SECRET='test-webhook-secret';
 const body=Buffer.from(JSON.stringify({event:'unrelated.event'}));
 const signature=crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
 const res=response(); await handler({method:'POST',body,headers:{'x-razorpay-signature':signature}},res); assert.deepEqual(res.data,{received:true});
 const bad=response(); await handler({method:'POST',body:Buffer.from(body+' '),headers:{'x-razorpay-signature':signature}},bad); assert.equal(bad.code,400);
});

test('Express serves canonical and legacy routes with the same authentication guard', async t => {
 const {app}=require('../backend/index');
 const server=app.listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(`${base}/health`)).status,200);
 for (const path of ['/api/orders','/api/holdings','/api/positions','/api/funds','/api/session','/allOrders','/allHoldings','/allPositions']) {
  const res=await fetch(base+path); assert.equal(res.status,401,path); assert.match(res.headers.get('content-type'),/application\/json/);
 }
 assert.equal((await fetch(`${base}/newOrder`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,401);
 const body=JSON.stringify({event:'unrelated.event'});
 const signature=crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
 const hook=await fetch(`${base}/api/razorpay-webhook`,{method:'POST',headers:{'content-type':'application/json','x-razorpay-signature':signature},body});
 assert.equal(hook.status,200); assert.deepEqual(await hook.json(),{received:true});
});

test('registration hashes passwords and returns a short-lived signed handoff', async () => {
 const db=require('../frontend/node_modules/mongoose');
 const auth=require('../frontend/api/auth');
 const User=db.models.User;
 const original={connect:db.connect,exists:User.exists,create:User.create,url:process.env.MONGO_URL};
 db.connect=async()=>{};process.env.MONGO_URL='mongodb://test.invalid/not-used';User.exists=async()=>false;
 let saved;User.create=async value=>{saved=value;return {_id:owner,...value};};
 try {
  const res=response(); await auth({method:'POST',body:{action:'REGISTER',name:'Alice',email:'ALICE@example.com',password:'long-password-123'}},res);
  assert.equal(res.code,201);assert.equal(saved.email,'alice@example.com');assert.notEqual(saved.passwordHash,'long-password-123');
  assert.equal(await require('../frontend/node_modules/bcryptjs').compare('long-password-123',saved.passwordHash),true);
  const claims=verify(res.data.handoff,'handoff');assert.equal(claims.sub,owner);assert.ok(claims.exp-Date.now()<=60000);
  assert.equal(res.data.user.passwordHash,undefined);
 } finally {db.connect=original.connect;User.exists=original.exists;User.create=original.create;if(original.url===undefined)delete process.env.MONGO_URL;else process.env.MONGO_URL=original.url;}
});

test('webhook reads raw stream without evaluating platform body parser', async () => {
 const {PassThrough}=require('node:stream');
 const req=new PassThrough();req.method='POST';
 const body=Buffer.from('{ "event": "unrelated.event" }');
 req.headers={'x-razorpay-signature':crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex')};
 Object.defineProperty(req,'body',{get(){throw new Error('Parsed body must not be accessed');}});
 const res=response();const pending=require('../dashboard/api/razorpay-webhook')(req,res);req.end(body);await pending;
 assert.equal(res.code,200);assert.deepEqual(res.data,{received:true});
});
