import { filterCashBankAccounts, isPostable, accountLabel as _accountLabel } from '../utils/accountTree';

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
 * Active cash/bank accounts suitable for payment routing (never AR, VAT, prepaid or fixed assets) —
 * includes group (header) accounts, since the cascading picker needs them as parent-level entries.
 */
export function filterPaymentAccounts(accounts) {
  return filterCashBankAccounts(accounts);
}

/**
 * Postable default account id for a payment method — only when it is unambiguous: with several
 * cash/bank accounts to choose from nothing is pre-selected, so the user picks the specific bank.
 */
export function resolveDefaultPaymentAccountId(accounts, paymentMethod) {
  const postable = filterPaymentAccounts(accounts).filter(isPostable);
  if (postable.length === 1) return postable[0].id;
  return '';
}

export const accountLabel = _accountLabel;
