// Shared helpers for all Module 2 features.
const round = (v, d = 2) =>
  v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(Number(v).toFixed(d));
const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
// p is 0..1; arr must be sorted ascending
const percentile = (arr, p) => {
  if (!arr.length) return null;
  const idx = (arr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
};
module.exports = { round, clamp, toId, percentile };
