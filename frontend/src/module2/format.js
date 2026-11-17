// Shared formatting helpers for all Module 2 pages.
export const money = (n) => `৳ ${Number(n).toLocaleString("en-US")}`;
export const signed = (n, suffix = "") => `${n > 0 ? "+" : ""}${n}${suffix}`;
