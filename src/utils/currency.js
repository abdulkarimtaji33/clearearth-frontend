// Shared currency helpers. Every commercial document (deal, quotation, purchase order, bill, invoice,
// outbound sale) carries its own currency code; AED is the default.

export const CURRENCIES = [
  ['AED', 'UAE Dirham'], ['USD', 'US Dollar'], ['EUR', 'Euro'], ['GBP', 'British Pound'], ['SAR', 'Saudi Riyal'],
  ['QAR', 'Qatari Riyal'], ['KWD', 'Kuwaiti Dinar'], ['OMR', 'Omani Rial'], ['BHD', 'Bahraini Dinar'], ['INR', 'Indian Rupee'],
  ['PKR', 'Pakistani Rupee'], ['CNY', 'Chinese Yuan'], ['JPY', 'Japanese Yen'], ['CHF', 'Swiss Franc'], ['CAD', 'Canadian Dollar'],
  ['AUD', 'Australian Dollar'], ['EGP', 'Egyptian Pound'], ['TRY', 'Turkish Lira'], ['ZAR', 'South African Rand'],
];

export const DEFAULT_CURRENCY = 'AED';

/** { AED: 100, USD: 50 } -> "AED 100.00 + USD 50.00" (only amounts above zero; "AED 0.00" when empty) */
export const formatByCurrency = (byCurrency, fallbackTotal = 0) => {
  const parts = Object.entries(byCurrency || {}).filter(([, v]) => Math.abs(Number(v)) > 0.005);
  if (!parts.length) return formatMoney(Number(fallbackTotal) || 0, DEFAULT_CURRENCY);
  return parts.map(([code, v]) => formatMoney(v, code)).join(' + ');
};

export const currencyOf = (doc) => String(doc?.currency || DEFAULT_CURRENCY).toUpperCase();

/** "AED 1,234.50" */
export const formatMoney = (amount, currency = DEFAULT_CURRENCY) => {
  const n = Number(amount);
  const num = (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${String(currency || DEFAULT_CURRENCY).toUpperCase()} ${num}`;
};
