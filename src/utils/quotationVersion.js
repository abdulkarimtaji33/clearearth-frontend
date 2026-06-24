/** Quotation revision number within a deal (1 = first quotation, no label). */
export const quotationVersion = (q) => {
  const v = parseInt(q?.version, 10);
  return Number.isFinite(v) && v > 0 ? v : 1;
};

export const quotationVersionLabel = (q) => {
  const v = quotationVersion(q);
  return v > 1 ? `v${v}` : null;
};

export const sortQuotationsByVersion = (list) =>
  [...(list || [])].sort((a, b) => quotationVersion(a) - quotationVersion(b) || (a.id || 0) - (b.id || 0));
