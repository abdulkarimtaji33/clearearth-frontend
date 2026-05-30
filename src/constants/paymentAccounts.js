/** Default chart-of-accounts code per payment method (matches backend) */
export const PAYMENT_METHOD_DEFAULT_ACCOUNT_CODE = {
  Cash: '1000',
  'Bank transfer': '1000',
  Cheque: '1000',
  'Credit card': '1000',
  'Online / portal': '1000',
  Other: '1000',
};

export function defaultAccountCodeForMethod(paymentMethod) {
  const key = paymentMethod != null ? String(paymentMethod).trim() : '';
  return PAYMENT_METHOD_DEFAULT_ACCOUNT_CODE[key] || '1000';
}

/** Asset accounts suitable for payment routing */
export function filterPaymentAccounts(accounts) {
  return (accounts || []).filter((a) => a.type === 'asset' && !a.is_group && a.is_active !== false);
}

export function resolveDefaultPaymentAccountId(accounts, paymentMethod) {
  const code = defaultAccountCodeForMethod(paymentMethod);
  const match = filterPaymentAccounts(accounts).find((a) => String(a.code) === code);
  return match?.id ?? filterPaymentAccounts(accounts)[0]?.id ?? '';
}

export function accountLabel(a) {
  if (!a) return '—';
  return `${a.code} — ${a.name}`;
}
