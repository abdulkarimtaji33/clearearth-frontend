/**
 * Local-calendar date helpers. `new Date(...).toISOString().slice(0, 10)` converts to UTC first, so in a
 * timezone ahead of UTC (e.g. UAE, UTC+4) local midnight becomes the PREVIOUS day: a year start of
 * 2026-01-01 turned into 2025-12-31. These helpers format the local date parts instead.
 */
const pad = (n) => String(n).padStart(2, '0');

export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const localToday = () => localDate(new Date());
export const localYearStart = () => localDate(new Date(new Date().getFullYear(), 0, 1));
export const localMonthStart = () => localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
