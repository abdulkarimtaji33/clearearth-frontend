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
