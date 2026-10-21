import { priceHistogram } from "./priceHistogram";
test("bins prices at equal widths and counts every holding once", () => {
  const prices = [100, 101, 200, 300, 400, 500, 600, 600];
  const bins = priceHistogram(prices);
  expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(prices.length);
  const widths = bins.map(bin => Math.round((bin.upper - bin.lower) * 100));
  expect(new Set(widths).size).toBe(1);
  expect(bins[0].lower).toBe(100);
  expect(bins[bins.length - 1].upper).toBeGreaterThan(600);
  expect(bins[bins.length - 1].count).toBe(3);
});
test("handles one holding, repeated prices, and invalid data", () => {
  expect(priceHistogram([117.21])).toEqual([{lower:117.21, upper:117.22, count:1}]);
  expect(priceHistogram([100,100,100]).reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
  expect(priceHistogram([null,undefined,NaN,Infinity,-1,0])).toEqual([]);
  expect(priceHistogram([])).toEqual([]);
});
