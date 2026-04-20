/** Values stored in tax_invoice.payment_method and expenses.payment_method */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'Bank transfer', label: 'Bank transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Credit card', label: 'Credit card' },
  { value: 'Online / portal', label: 'Online / portal' },
  { value: 'Other', label: 'Other' },
];

export function paymentMethodSelectOptions(currentValue) {
  const vals = new Set(PAYMENT_METHOD_OPTIONS.map((o) => o.value));
  const opts = [...PAYMENT_METHOD_OPTIONS];
  if (currentValue && String(currentValue).trim() !== '' && !vals.has(currentValue)) {
    opts.unshift({ value: currentValue, label: currentValue });
  }
  return opts;
}
