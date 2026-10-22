const test = require('node:test');
const assert = require('node:assert/strict');
const { simulatedLiquidity } = require('../dashboard/lib/market');

test('demo counterparties are limited and not automatically available every tick', () => {
  const windows = [0, 1, 2, 3].map(tick => simulatedLiquidity('INFY', 'SELL', tick * 15000));
  assert.equal(windows.filter(item => item.availableQty > 0).length, 1);
  assert.ok(windows.every(item => Number.isSafeInteger(item.availableQty) && item.availableQty >= 0 && item.availableQty <= 3));
  assert.deepEqual(simulatedLiquidity('INFY', 'SELL', 0), simulatedLiquidity('INFY', 'SELL', 14999));
  assert.equal(simulatedLiquidity('UNKNOWN', 'SELL'), null);
});
