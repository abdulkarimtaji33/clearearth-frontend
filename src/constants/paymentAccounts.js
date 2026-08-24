import { filterActiveByType, isPostable, accountLabel as _accountLabel } from '../utils/accountTree';

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

/**
 * Active asset accounts suitable for payment routing — includes group (header)
 * accounts, since the cascading picker needs them as parent-level menu entries.
 */
export function filterPaymentAccounts(accounts) {
  return filterActiveByType(accounts, 'asset');
}

/** Resolve the postable (non-group) default leaf account id for a payment method. */
export function resolveDefaultPaymentAccountId(accounts, paymentMethod) {
  const code = defaultAccountCodeForMethod(paymentMethod);
  const postable = filterPaymentAccounts(accounts).filter(isPostable);
  const match = postable.find((a) => String(a.code) === code);
  return match?.id ?? postable[0]?.id ?? '';
}

export const accountLabel = _accountLabel;
