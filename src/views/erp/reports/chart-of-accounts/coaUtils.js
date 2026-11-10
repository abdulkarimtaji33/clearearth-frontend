export const TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export const TYPE_META = {
  asset: { label: 'Assets', one: 'Asset', color: 'info', normal: 'debit' },
  liability: { label: 'Liabilities', one: 'Liability', color: 'warning', normal: 'credit' },
  equity: { label: 'Equity', one: 'Equity', color: 'secondary', normal: 'credit' },
  revenue: { label: 'Revenue', one: 'Revenue', color: 'success', normal: 'credit' },
  expense: { label: 'Expenses', one: 'Expense', color: 'error', normal: 'debit' },
};

export const SUB_TYPES = {
  asset: ['current_asset', 'cash', 'bank', 'fixed_asset', 'other_asset'],
  liability: ['current_liability', 'long_term_liability'],
  equity: ['equity'],
  revenue: ['operating_revenue', 'other_income'],
  expense: ['cost_of_revenue', 'operating_expense', 'finance_cost'],
};

export const SUB_TYPE_LABEL = {
  current_asset: 'Current asset',
  cash: 'Cash',
  bank: 'Bank',
  fixed_asset: 'Fixed asset',
  other_asset: 'Other asset',
  current_liability: 'Current liability',
  long_term_liability: 'Long-term liability',
  equity: 'Equity',
  operating_revenue: 'Operating revenue',
  other_income: 'Other income',
  cost_of_revenue: 'Cost of revenue',
  operating_expense: 'Operating expense',
  finance_cost: 'Finance cost',
};

export const subTypeLabel = (s) => (s ? SUB_TYPE_LABEL[s] || s.replace(/_/g, ' ') : '—');

export const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const DEFAULT_FILTERS = { q: '', type: 'all', status: 'active', kind: 'all', balance: 'all' };

const byCode = (a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true });

/** Does this account pass the active filters? */
export function matchesFilters(a, f, byId) {
  if (f.type !== 'all' && a.type !== f.type) return false;
  if (f.status === 'active' && !a.is_active) return false;
  if (f.status === 'inactive' && a.is_active) return false;
  if (f.kind === 'group' && !a.is_group) return false;
  if (f.kind === 'posting' && a.is_group) return false;
  if (f.balance === 'with' && !(Math.abs(Number(a.is_group ? a.rollup_balance : a.balance) || 0) > 0.004)) return false;
  if (f.balance === 'zero' && Math.abs(Number(a.is_group ? a.rollup_balance : a.balance) || 0) > 0.004) return false;
  const q = f.q.trim().toLowerCase();
  if (q) {
    const parent = a.parent_id != null ? byId[a.parent_id] : null;
    const hay = `${a.code} ${a.name} ${a.description || ''} ${parent ? `${parent.code} ${parent.name}` : ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export const isFiltering = (f) =>
  f.q.trim() !== '' || f.type !== 'all' || f.kind !== 'all' || f.balance !== 'all' || f.status !== 'active';

/** Code-ordered forest of { account, children[] } from a flat list. */
export function buildForest(list) {
  const nodes = {};
  list.forEach((a) => { nodes[a.id] = { account: a, children: [] }; });
  const roots = [];
  list.forEach((a) => {
    const n = nodes[a.id];
    if (a.parent_id != null && nodes[a.parent_id]) nodes[a.parent_id].children.push(n);
    else roots.push(n);
  });
  const sort = (arr) => { arr.sort((x, y) => byCode(x.account, y.account)); arr.forEach((n) => sort(n.children)); };
  sort(roots);
  return roots;
}

/** Visible rows for a type: matches plus their ancestors (context), honouring expand/collapse. */
export function visibleRows({ accounts, byId, filters, expanded, type, forceExpand }) {
  const ofType = accounts.filter((a) => a.type === type);
  const matched = new Set(ofType.filter((a) => matchesFilters(a, filters, byId)).map((a) => a.id));
  const keep = new Set(matched);
  matched.forEach((id) => {
    let cur = byId[id];
    let guard = 0;
    while (cur && cur.parent_id != null && guard < 20) {
      keep.add(cur.parent_id);
      cur = byId[cur.parent_id];
      guard += 1;
    }
  });
  const forest = buildForest(ofType.filter((a) => keep.has(a.id)));
  const rows = [];
  const walk = (nodes, depth) => {
    nodes.forEach((n) => {
      const hasKids = n.children.length > 0;
      rows.push({ ...n.account, __depth: depth, __hasKids: hasKids, __context: !matched.has(n.account.id) });
      if (hasKids && (forceExpand || expanded.has(n.account.id))) walk(n.children, depth + 1);
    });
  };
  walk(forest, 0);
  return { rows, matchedCount: matched.size, totalOfType: ofType.length };
}

export function pathTo(account, byId) {
  const parts = [];
  let cur = account;
  let guard = 0;
  while (cur && guard < 20) {
    parts.unshift(cur);
    cur = cur.parent_id != null ? byId[cur.parent_id] : null;
    guard += 1;
  }
  return parts;
}

export function descendantIds(accounts, id) {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    accounts.forEach((a) => {
      if (a.parent_id != null && ids.has(a.parent_id) && !ids.has(a.id)) { ids.add(a.id); grew = true; }
    });
  }
  return ids;
}

export function toCsv(rows, byId) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Code', 'Name', 'Type', 'Kind', 'Sub-type', 'Parent', 'Balance (AED)', 'Status'];
  const lines = rows.map((a) => {
    const parent = a.parent_id != null ? byId[a.parent_id] : null;
    const bal = a.is_group ? a.rollup_balance : a.balance;
    return [
      a.code, a.name, TYPE_META[a.type]?.one || a.type, a.is_group ? 'Group' : 'Posting',
      subTypeLabel(a.sub_type), parent ? `${parent.code} ${parent.name}` : '',
      bal != null ? Number(bal).toFixed(2) : '', a.is_active ? 'Active' : 'Inactive',
    ].map(esc).join(',');
  });
  return [head.map(esc).join(','), ...lines].join('\r\n');
}
