// Equal-width bins; each owned stock contributes one observation.
export function priceHistogram(prices) {
  const values = prices.filter(value => Number.isFinite(value) && value > 0).map(value => Math.round(value * 100));
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const count = min === max ? 1 : Math.min(10, Math.ceil(Math.log2(values.length)) + 1);
  const width = Math.max(1, Math.ceil((max - min + 1) / count));
  const bins = Array.from({ length: count }, (_, index) => ({ lower: (min + index * width) / 100, upper: (min + (index + 1) * width) / 100, count: 0 }));
  for (const value of values) bins[Math.min(count - 1, Math.floor((value - min) / width))].count++;
  return bins;
}
