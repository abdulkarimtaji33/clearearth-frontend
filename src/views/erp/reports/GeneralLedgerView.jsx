import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField,
  MenuItem, TablePagination, Chip, InputAdornment, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconBook, IconDownload, IconSearch, IconScale } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray, normalizeGeneralLedger } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOURCE_LABELS = {
  tax_invoice: 'Invoice',
  payment_received: 'Receipt',
  expense: 'Expense',
  expense_payment: 'Exp. Payment',
  purchase_order_approved: 'PO Approved',
  po_payment: 'PO Payment',
  opening_balance: 'Opening',
  adjustment: 'Adjustment',
  manual: 'Manual',
};

const SOURCE_COLORS = {
  tax_invoice: 'primary',
  payment_received: 'success',
  expense: 'warning',
  expense_payment: 'warning',
  purchase_order_approved: 'secondary',
  po_payment: 'secondary',
  manual: 'info',
};

const StatBox = ({ label, value, sub, color = 'text.primary' }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.7} sx={{ textTransform: 'uppercase', fontSize: '0.67rem' }}>
      {label}
    </Typography>
    <Typography fontWeight={800} color={color} sx={{ fontFamily: 'monospace', fontSize: '1.05rem', lineHeight: 1.3 }}>
      {value}
    </Typography>
    {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
  </Box>
);

const GeneralLedgerView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [accounts, setAccounts] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(50);

  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

  const initialAccount = searchParams.get('accountId') || 'all';
  const [accountId, setAccountId] = useState(initialAccount);
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || firstOfYear);
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || today);
  const [search, setSearch] = useState('');
  const [paidToFilter, setPaidToFilter] = useState('');
  const [receivedFromFilter, setReceivedFromFilter] = useState('');

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) setAccounts(asArray(res.data).filter((a) => !a.is_group && a.is_active));
    });
  }, []);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getGeneralLedger({
        accountId: accountId || 'all',
        dateFrom,
        dateTo,
        page: page + 1,
        pageSize: rowsPerPage,
        search: search || undefined,
        paidTo: paidToFilter || undefined,
        receivedFrom: receivedFromFilter || undefined,
      });
      if (res.success) setData(normalizeGeneralLedger(res.data));
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, dateFrom, dateTo, page, rowsPerPage, search, paidToFilter, receivedFromFilter]);

  useEffect(() => { load(); }, [load]);

  const viewAll = data?.viewAll || accountId === 'all';
  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));
  const hasFilters = search || paidToFilter || receivedFromFilter;

  const clearFilters = () => {
    setSearch(''); setPaidToFilter(''); setReceivedFromFilter(''); setPage(0);
  };

  const exportCsv = () => {
    if (!data) return;
    const headers = viewAll
      ? ['Date', 'Account Code', 'Account Name', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit', 'Credit']
      : ['Date', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit', 'Credit', 'Balance'];
    const rows = [headers];
    if (!viewAll) rows.push(['', 'Opening Balance', '', '', '', '', '', '', fmt(data.openingBalance)]);
    asArray(data.lines).forEach((l) => {
      rows.push(viewAll
        ? [l.entry_date, l.account_code, l.account_name, l.entry_number, l.description, l.paid_to ?? '', l.received_from ?? '', SOURCE_LABELS[l.source_type] || l.source_type, fmt(l.debit), fmt(l.credit)]
        : [l.entry_date, l.entry_number, l.description, l.paid_to ?? '', l.received_from ?? '', SOURCE_LABELS[l.source_type] || l.source_type, fmt(l.debit), fmt(l.credit), fmt(l.running_balance)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${accountId}-${dateFrom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colHeaders = viewAll
    ? ['Date', 'Account', 'Entry #', 'Description', 'Paid to', 'Received from', 'Type', 'Debit (AED)', 'Credit (AED)']
    : ['Date', 'Entry #', 'Description', 'Paid to', 'Received from', 'Type', 'Debit (AED)', 'Credit (AED)', 'Balance (AED)'];
  const rightCols = new Set(['Debit (AED)', 'Credit (AED)', 'Balance (AED)']);

  return (
    <PageContainer title="General Ledger" description="Running balance per account">

      {/* ── Header ── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            startIcon={<IconArrowLeft size={16} />}
            onClick={() => navigate('/erp/reports/trial-balance')}
            variant="outlined"
            sx={{ borderRadius: 2.5, fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
          >
            Back
          </Button>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <IconBook size={24} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} lineHeight={1.2}>General Ledger</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              Track every posted transaction with payee and account details
            </Typography>
          </Box>
        </Stack>

        {data && (
          <Button
            startIcon={<IconDownload size={16} />}
            variant="outlined"
            onClick={exportCsv}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      {/* ── Filter panel ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3, mb: 2.5,
          border: '1px solid', borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[50], 0.8),
        }}
      >
        {/* Toggle + date row */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={accountId === 'all' ? 'all' : 'single'}
              onChange={(_, v) => {
                if (!v) return;
                if (v === 'all') { setAccountId('all'); }
                else if (!accountId || accountId === 'all') { setAccountId(accounts[0]?.id ? String(accounts[0].id) : ''); }
                setPage(0);
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '8px !important',
                  px: 2.5, py: 0.75,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    borderColor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                  },
                },
                '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': { ml: 0.75 },
              }}
            >
              <ToggleButton value="all">All accounts</ToggleButton>
              <ToggleButton value="single">Single account</ToggleButton>
            </ToggleButtonGroup>

            {accountId !== 'all' && (
              <TextField
                select size="small" label="Account"
                value={accountId}
                onChange={(e) => { setAccountId(e.target.value); setPage(0); }}
                sx={{ minWidth: 260, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {accounts.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    <Box>
                      <Typography component="span" variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', mr: 1 }}>
                        {a.code}
                      </Typography>
                      <Typography component="span" variant="body2">{a.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              size="small" label="From" type="date"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small" label="To" type="date"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </Box>

        {/* Search + counterparty row */}
        <Box sx={{ px: 2.5, py: 1.75 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search description, entry #, account…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={15} style={{ opacity: 0.45 }} /></InputAdornment>,
                sx: { borderRadius: 2 },
              }}
              sx={{ flex: 1, minWidth: 210 }}
            />
            <TextField
              size="small" label="Paid to"
              value={paidToFilter}
              onChange={(e) => { setPaidToFilter(e.target.value); setPage(0); }}
              sx={{ width: 175, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small" label="Received from"
              value={receivedFromFilter}
              onChange={(e) => { setReceivedFromFilter(e.target.value); setPage(0); }}
              sx={{ width: 175, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Stack direction="row" spacing={1}>
              {hasFilters && (
                <Button size="small" onClick={clearFilters} color="inherit" sx={{ borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}>
                  Clear
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => { setPage(0); load(); }}
                disabled={loading}
                sx={{
                  borderRadius: 2.5, px: 3, fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                {loading ? 'Running…' : 'Run'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

      {loading && (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" mt={2}>Loading ledger…</Typography>
        </Box>
      )}

      {/* ── Results ── */}
      {!loading && data && (
        <>
          {/* Summary card */}
          {!viewAll && selectedAccount ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3, p: 2.5, mb: 2.5,
                border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 1)} 70%)`,
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap" divider={<Divider orientation="vertical" flexItem />}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.7} sx={{ textTransform: 'uppercase', fontSize: '0.67rem' }}>Account</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1} mt={0.25}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main', fontSize: '0.9rem' }}>
                      {selectedAccount.code}
                    </Typography>
                    <Typography fontWeight={700} fontSize="1rem">{selectedAccount.name}</Typography>
                  </Stack>
                  <Chip size="small" label={selectedAccount.type} sx={{ mt: 0.5, height: 18, fontSize: '0.66rem', fontWeight: 700, textTransform: 'capitalize' }} />
                </Box>
                <StatBox
                  label="Opening Balance"
                  value={`AED ${fmt(data.openingBalance)}`}
                  sub={dateFrom}
                />
                <StatBox
                  label="Closing Balance"
                  value={`AED ${fmt(data.closingBalance ?? data.lines?.at(-1)?.running_balance)}`}
                  sub={dateTo}
                  color={
                    (data.closingBalance ?? 0) >= (data.openingBalance ?? 0) ? 'success.main' : 'error.main'
                  }
                />
                <StatBox
                  label="Net Movement"
                  value={`AED ${fmt(Math.abs((data.closingBalance ?? 0) - (data.openingBalance ?? 0)))}`}
                  sub={(data.closingBalance ?? 0) >= (data.openingBalance ?? 0) ? '▲ increase' : '▼ decrease'}
                />
                <StatBox
                  label="Transactions"
                  value={String(data.total || data.lines?.length || 0)}
                />
              </Stack>
            </Paper>
          ) : viewAll ? (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                icon={<IconScale size={13} />}
                label="All accounts"
                color="primary"
                size="small"
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
              <Typography variant="body2" color="text.secondary">
                {data.total?.toLocaleString()} posted line{data.total !== 1 ? 's' : ''} · newest first
              </Typography>
            </Box>
          ) : null}

          {/* Table */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {colHeaders.map((h) => (
                      <TableCell
                        key={h}
                        align={rightCols.has(h) ? 'right' : 'left'}
                        sx={{
                          position: 'sticky', top: 0, zIndex: 2,
                          fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.6,
                          color: 'text.secondary', whiteSpace: 'nowrap', py: 1.5,
                          // Solid (non-alpha) background so the sticky header opaquely covers rows scrolling beneath it
                          bgcolor: theme.palette.background.paper,
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {/* Opening balance row (single-account) */}
                  {!viewAll && (
                    <TableRow sx={{ bgcolor: isDark ? alpha(theme.palette.grey[800], 0.5) : alpha(theme.palette.grey[100], 0.7) }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{dateFrom}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled', fontSize: '0.78rem' }}>—</TableCell>
                      <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 600 }}>Opening Balance</TableCell>
                      <TableCell colSpan={2} />
                      <TableCell />
                      <TableCell colSpan={2} />
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem' }}>
                        {fmt(data.openingBalance)}
                      </TableCell>
                    </TableRow>
                  )}

                  {asArray(data.lines).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colHeaders.length} align="center" sx={{ py: 8, border: 0 }}>
                        <IconBook size={36} style={{ opacity: 0.12, marginBottom: 10 }} />
                        <Typography variant="body2" color="text.secondary">No transactions match your filters</Typography>
                      </TableCell>
                    </TableRow>
                  ) : asArray(data.lines).map((l, idx) => {
                    const debitAmt  = parseFloat(l.debit)  || 0;
                    const creditAmt = parseFloat(l.credit) || 0;
                    const srcColor  = SOURCE_COLORS[l.source_type] || 'default';

                    return (
                      <TableRow
                        key={l.line_id || `${l.journal_entry_id}-${idx}`}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td': { border: 0 },
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                        }}
                        onClick={() => l.journal_entry_id && navigate(`/erp/journal/view/${l.journal_entry_id}`)}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.8rem' }}>
                          {l.entry_date}
                        </TableCell>

                        {viewAll && (
                          <TableCell
                            onClick={(e) => { e.stopPropagation(); navigate(`/erp/reports/general-ledger?accountId=${l.account_id}`); }}
                          >
                            <Stack spacing={0}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
                                {l.account_code}
                              </Typography>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                                {l.account_name}
                              </Typography>
                            </Stack>
                          </TableCell>
                        )}

                        <TableCell>
                          {l.journal_entry_id ? (
                            <Typography
                              component="span"
                              sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: 'primary.main', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/erp/journal/view/${l.journal_entry_id}`); }}
                            >
                              {l.entry_number}
                            </Typography>
                          ) : (
                            <Typography component="span" sx={{ fontFamily: 'monospace', color: 'text.disabled', fontSize: '0.78rem' }}>
                              {l.entry_number || '—'}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 230 }}>
                          <Typography variant="body2" noWrap title={l.description}>{l.description}</Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 110 }}>
                          {l.paid_to ? (
                            <Box
                              sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1, py: 0.25, borderRadius: 1,
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: 'warning.dark', maxWidth: 140,
                              }}
                            >
                              <Typography variant="caption" fontWeight={700} noWrap>→ {l.paid_to}</Typography>
                            </Box>
                          ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ minWidth: 120 }}>
                          {l.received_from ? (
                            <Box
                              sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1, py: 0.25, borderRadius: 1,
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.dark', maxWidth: 140,
                              }}
                            >
                              <Typography variant="caption" fontWeight={700} noWrap>← {l.received_from}</Typography>
                            </Box>
                          ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={SOURCE_LABELS[l.source_type] || l.source_type}
                            size="small"
                            color={srcColor}
                            variant="soft"
                            sx={{ fontWeight: 700, fontSize: '0.67rem', height: 20, borderRadius: 1 }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: debitAmt > 0 ? 'text.primary' : 'text.disabled' }}>
                          {debitAmt > 0 ? fmt(debitAmt) : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: creditAmt > 0 ? 'text.primary' : 'text.disabled' }}>
                          {creditAmt > 0 ? fmt(creditAmt) : '—'}
                        </TableCell>

                        {!viewAll && (
                          <TableCell
                            align="right"
                            sx={{
                              fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem',
                              color: l.running_balance >= 0 ? 'text.primary' : 'error.main',
                            }}
                          >
                            {fmt(l.running_balance)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {data.total > rowsPerPage && (
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                <TablePagination
                  component="div"
                  count={data.total}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[rowsPerPage]}
                  sx={{ border: 0 }}
                />
              </Box>
            )}
          </Paper>
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3, border: '1px solid', borderColor: 'divider',
            p: 8, textAlign: 'center',
            bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.grey[50], 0.8),
          }}
        >
          <Box
            sx={{
              width: 72, height: 72, borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}
          >
            <IconBook size={36} color={theme.palette.primary.main} style={{ opacity: 0.5 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} mb={0.75}>Pick a view &amp; date range</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose <strong>All accounts</strong> for a full ledger or pick a single account, then press <strong>Run</strong>.
          </Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default GeneralLedgerView;
