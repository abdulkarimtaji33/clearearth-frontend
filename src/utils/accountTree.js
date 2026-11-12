/**
 * Shared parent → sub-account tree helpers for Chart of Accounts pickers
 * (payment/deposit account, expense account). An account with children is
 * picked in two steps: choose the parent, then (if it has sub-accounts)
 * choose the sub-account in a second dropdown.
 */

export function filterActiveByType(accounts, type) {
  return (accounts || []).filter((a) => a.type === type && a.is_active !== false);
}

export function getTopLevelAccounts(accounts) {
  return (accounts || []).filter((a) => a.parent_id == null);
}

export function getChildAccounts(accounts, parentId) {
  if (parentId == null || parentId === '') return [];
  return (accounts || []).filter((a) => String(a.parent_id) === String(parentId));
}

export function isPostable(account) {
  return !!account && !account.is_group;
}

/** Walk up the parent_id chain from a leaf account id to find its top-level ancestor id. */
export function findTopLevelId(accounts, leafId) {
  if (leafId == null || leafId === '') return '';
  const byId = {};
  (accounts || []).forEach((a) => { byId[a.id] = a; });
  let cur = byId[leafId];
  if (!cur) return String(leafId);
  let depth = 0;
  while (cur.parent_id != null && byId[cur.parent_id] && depth < 20) {
    cur = byId[cur.parent_id];
    depth += 1;
  }
  return String(cur.id);
}

export function accountLabel(a) {
  if (!a) return '—';
  return `${a.code} — ${a.name}`;
}

const CASH_BANK_SUB_TYPES = ['cash', 'bank'];
const CASH_ACCOUNT_CODE = '1000';

/**
 * True for accounts money can be received into / paid from: the default 1000 Cash account, any
 * account with sub_type 'cash' or 'bank', and anything nested under one (e.g. each bank account
 * under a "Bank" group). Pass the full list so ancestors can be resolved. AR, input VAT, prepaid
 * and fixed assets are never cash/bank.
 */
export function isCashOrBankAccount(account, accounts = []) {
  if (!account || account.type !== 'asset') return false;
  const byId = {};
  (accounts || []).forEach((a) => { byId[a.id] = a; });
  let cur = account;
  let depth = 0;
  while (cur && depth < 20) {
    if (CASH_BANK_SUB_TYPES.includes(cur.sub_type) || String(cur.code) === CASH_ACCOUNT_CODE) return true;
    cur = cur.parent_id != null ? byId[cur.parent_id] : null;
    depth += 1;
  }
  return false;
}

/**
 * Would paying `amount` out of `accountId` take it below zero? Needs accounts loaded with balances.
 * Returns { account, balance, after } or null.
 */
export function overdrawInfo(accounts, accountId, amount) {
  const amt = Number(amount) || 0;
  if (!accountId || !(amt > 0)) return null;
  const acc = (accounts || []).find((a) => String(a.id) === String(accountId));
  if (!acc || acc.balance == null) return null;
  const balance = Number(acc.balance) || 0;
  const after = Math.round((balance - amt) * 100) / 100;
  return after < -0.004 ? { account: acc, balance, after } : null;
}

/** Cash/bank accounts for payment pickers (groups included so the cascading picker can nest them). */
export function filterCashBankAccounts(accounts) {
  const active = filterActiveByType(accounts, 'asset');
  return active.filter((a) => isCashOrBankAccount(a, active));
}
