/** Normalize list payloads from API (array, paginated, or { entries|items|rows|accounts }). */
export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'object') {
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.entries)) return value.entries;
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.accounts)) return value.accounts;
    if (Array.isArray(value.lines)) return value.lines;
    if (Array.isArray(value.byClient)) return value.byClient;
    const values = Object.values(value);
    const looksLikeRowList = values.length > 0
      && values.every((v) => v != null && typeof v === 'object' && !Array.isArray(v))
      && values.some((v) => v.account_id != null || v.id != null || v.code != null || v.label != null || v.entry_number != null);
    if (looksLikeRowList) return values;
  }
  return [];
}

/** Paginated / wrapped list from API responses (receivables, invoices, etc.). */
export function extractListData(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.entries)) return d.entries;
  return asArray(d);
}

export function paginatedTotal(res, fallback = 0) {
  return res?.pagination?.totalItems ?? res?.data?.total ?? res?.total ?? fallback;
}

export function normalizeJournalListResponse(res) {
  return {
    entries: extractListData(res),
    total: paginatedTotal(res, 0),
  };
}

export function normalizeTrialBalance(raw) {
  if (!raw) return null;
  return {
    as_of_date: raw.as_of_date,
    accounts: asArray(raw.accounts).map((a) => ({
      ...a,
      account_id: a.account_id ?? a.id,
    })),
    totals: {
      total_debit: raw.totals?.total_debit ?? raw.grand_total_debit ?? 0,
      total_credit: raw.totals?.total_credit ?? raw.grand_total_credit ?? 0,
    },
    is_balanced: raw.is_balanced,
  };
}

export function normalizeGeneralLedger(raw) {
  if (!raw) return null;
  const lines = asArray(raw.entries ?? raw.lines);
  return {
    viewAll: raw.view_all ?? raw.viewAll ?? false,
    account: raw.account,
    openingBalance: raw.opening_balance ?? raw.openingBalance ?? 0,
    closingBalance: raw.closing_balance ?? raw.closingBalance,
    lines: lines.map((l) => ({
      ...l,
      line_id: l.line_id ?? l.id,
      journal_entry_id: l.journal_entry_id ?? l.entry_id,
      description: l.description ?? l.line_desc ?? l.entry_desc,
      account_name: l.account_name ?? l.account?.name,
      account_code: l.account_code ?? l.account?.code,
      paid_to: l.paid_to ?? null,
      received_from: l.received_from ?? null,
    })),
    total: raw.total ?? lines.length,
    date_from: raw.date_from,
    date_to: raw.date_to,
  };
}

function mapIncomeSection(section) {
  if (!section) return { accounts: [], total: 0 };
  const list = asArray(section.items ?? section.accounts ?? section);
  return {
    accounts: list.map((a) => ({
      account_id: a.id ?? a.account_id,
      code: a.code,
      name: a.name,
      balance: a.amount ?? a.balance ?? 0,
    })),
    total: section.total ?? 0,
  };
}

export function normalizeIncomeStatement(raw) {
  if (!raw) return null;
  const c = raw.current ?? raw;
  return {
    revenue: mapIncomeSection(c.revenue),
    cogs: mapIncomeSection(c.cogs),
    operating_expenses: mapIncomeSection(c.opex ?? c.operating_expenses),
    finance_costs: mapIncomeSection(c.finance ?? c.finance_costs),
    gross_profit: c.grossProfit ?? c.gross_profit ?? 0,
    operating_income: c.operatingIncome ?? c.operating_income ?? 0,
    net_income: c.netIncome ?? c.net_income ?? 0,
  };
}

function mapAccountRow(a) {
  return {
    account_id: a.id ?? a.account_id,
    code: a.code,
    name: a.name,
    balance: a.balance ?? 0,
    sub_type: a.sub_type,
  };
}

function sumBalance(xs) {
  return xs.reduce((s, a) => s + Number(a.balance || 0), 0);
}

function groupAssets(list) {
  const arr = asArray(list);
  const current = arr.filter((a) => a.sub_type === 'current_asset');
  const fixed = arr.filter((a) => a.sub_type === 'fixed_asset');
  const other = arr.filter((a) => !['current_asset', 'fixed_asset'].includes(a.sub_type));
  return { current, fixed, other };
}

function groupLiabilities(list) {
  const arr = asArray(list);
  const current = arr.filter((a) => a.sub_type === 'current_liability');
  const longTerm = arr.filter((a) => a.sub_type === 'long_term_liability');
  const other = arr.filter((a) => !['current_liability', 'long_term_liability'].includes(a.sub_type));
  return { current, longTerm, other };
}

export function normalizeBalanceSheet(raw) {
  if (!raw) return null;

  const assetGroups = groupAssets(raw.assets);
  const liabGroups = groupLiabilities(raw.liabilities);
  const equityList = asArray(raw.equity).map(mapAccountRow);

  return {
    as_of_date: raw.as_of_date,
    assets: {
      current_asset: assetGroups.current.map(mapAccountRow),
      fixed_asset: assetGroups.fixed.map(mapAccountRow),
      other_asset: assetGroups.other.map(mapAccountRow),
      total_current: sumBalance(assetGroups.current),
      total_fixed: sumBalance(assetGroups.fixed),
    },
    liabilities: {
      current_liability: liabGroups.current.map(mapAccountRow),
      long_term_liability: liabGroups.longTerm.map(mapAccountRow),
      total_current: sumBalance(liabGroups.current),
      total_long_term: sumBalance(liabGroups.longTerm),
    },
    equity: {
      accounts: equityList,
      net_income: raw.cumulative_net_income,
    },
    total_assets: raw.total_assets ?? 0,
    total_liabilities: raw.total_liabilities ?? 0,
    total_equity: raw.total_equity ?? 0,
    is_balanced: raw.is_balanced,
  };
}

export function normalizeCashFlow(raw) {
  if (!raw) return null;
  const wc = raw.operating?.working_capital_changes || {};
  const op = raw.operating || {};
  const fin = raw.financing || {};
  return {
    operating: {
      net_income: op.net_income,
      depreciation: op.depreciation,
      ar_change: wc.change_in_ar ?? op.ar_change,
      ap_change: wc.change_in_ap ?? op.ap_change,
      accrued_change: wc.change_in_accrued ?? op.accrued_change,
      vat_change: wc.change_in_vat ?? op.vat_change,
    },
    net_operating: op.net ?? raw.net_operating,
    investing: {
      equipment: raw.investing?.fixed_asset_purchases ?? raw.investing?.equipment,
    },
    net_investing: raw.investing?.net ?? raw.net_investing,
    financing: {
      capital: fin.capital_contributions ?? fin.capital,
      drawings: fin.drawings != null ? Math.abs(fin.drawings) : fin.period_drawings,
      loan_proceeds: fin.loan_net ?? fin.loan_proceeds,
    },
    net_financing: fin.net ?? raw.net_financing,
    opening_cash: raw.opening_cash,
    net_cash_change: raw.net_change ?? raw.net_cash_change,
    closing_cash: raw.closing_cash,
  };
}

export function buildChangesInEquityRows(data) {
  if (!data) return [];
  const apiRows = asArray(data.rows);
  if (apiRows.length) return apiRows;
  const ob = data.opening || {};
  const cl = data.closing || {};
  return [
    {
      label: 'Opening Balance',
      capital: ob.capital,
      retained: ob.retained_earnings,
      drawings: ob.drawings,
      total: ob.total,
    },
    {
      label: 'Net Income for Period',
      capital: null,
      retained: data.net_income,
      drawings: null,
      total: data.net_income,
    },
    {
      label: 'Capital Introduced',
      capital: data.capital_introduced,
      retained: null,
      drawings: null,
      total: data.capital_introduced,
    },
    {
      label: 'Drawings',
      capital: null,
      retained: null,
      drawings: data.drawings_made,
      total: data.drawings_made != null ? -Math.abs(data.drawings_made) : null,
    },
    {
      label: 'Closing Balance',
      capital: cl.capital,
      retained: cl.retained_earnings,
      drawings: cl.drawings,
      total: cl.total,
      isTotal: true,
    },
  ];
}

export function normalizeChangesInEquity(raw) {
  if (!raw) return null;

  const sc = raw.share_capital || {};
  const re = raw.retained_earnings || {};
  const dr = raw.drawings || {};
  const te = raw.total_equity || {};

  return {
    opening: {
      capital: sc.opening,
      retained_earnings: re.opening,
      drawings: dr.opening,
      total: te.opening,
    },
    net_income: re.net_income,
    capital_introduced: sc.contributions,
    drawings_made: dr.period_drawings,
    closing: {
      capital: sc.closing,
      retained_earnings: re.closing,
      drawings: dr.closing,
      total: te.closing,
    },
  };
}

export function normalizeVatReport(raw) {
  if (!raw) return null;
  const out = raw.output_vat || {};
  const inp = raw.input_vat || {};
  return {
    taxable_sales: out.standard_rated_sales ?? raw.taxable_sales ?? 0,
    output_vat: out.vat_collected ?? (typeof raw.output_vat === 'number' ? raw.output_vat : 0),
    taxable_purchases: inp.standard_rated_purchases ?? raw.taxable_purchases ?? 0,
    input_vat: inp.vat_reclaimable ?? (typeof raw.input_vat === 'number' ? raw.input_vat : 0),
    net_vat_due: raw.net_vat_due ?? 0,
  };
}
