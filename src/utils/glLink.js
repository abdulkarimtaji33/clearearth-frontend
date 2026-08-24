/** Build a General Ledger URL filtered to one account and (optionally) a date range — the
 * "how is this calculated, and from where" drill-down used across the financial reports. */
export function glDrillDownUrl({ accountId, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();
  if (accountId != null && accountId !== '') params.set('accountId', accountId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const qs = params.toString();
  return `/erp/reports/general-ledger${qs ? `?${qs}` : ''}`;
}
