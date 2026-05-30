import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField,
  MenuItem, TablePagination, Chip, InputAdornment, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconBook, IconDownload, IconSearch, IconFilter } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray, normalizeGeneralLedger } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOURCE_LABELS = {
  tax_invoice: 'Invoice',
  payment_received: 'Receipt',
  expense: 'Expense',
  expense_payment: 'Expense pay',
  purchase_order_approved: 'PO approved',
  po_payment: 'PO payment',
  opening_balance: 'Opening',
  adjustment: 'Adjustment',
  manual: 'Manual',
};

const GeneralLedgerView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
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
  const [dateFrom, setDateFrom] = useState(firstOfYear);
  const [dateTo, setDateTo] = useState(today);
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

  useEffect(() => {
    load();
  }, [load]);

  const viewAll = data?.viewAll || accountId === 'all';
  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));

  const exportCsv = () => {
    if (!data) return;
    const headers = viewAll
      ? ['Date', 'Account', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit', 'Credit']
      : ['Date', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit', 'Credit', 'Balance'];
    const rows = [headers];
    if (!viewAll) rows.push(['', 'Opening Balance', '', '', '', '', '', '', data.openingBalance]);
    asArray(data.lines).forEach((l) => {
      rows.push(viewAll
        ? [l.entry_date, `${l.account_code} ${l.account_name}`, l.entry_number, l.description, l.paid_to, l.received_from, l.source_type, l.debit, l.credit]
        : [l.entry_date, l.entry_number, l.description, l.paid_to, l.received_from, l.source_type, l.debit, l.credit, l.running_balance]);
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

  const tableHeaders = viewAll
    ? ['Date', 'Account', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit (AED)', 'Credit (AED)']
    : ['Date', 'Entry #', 'Description', 'Paid to', 'Received from', 'Source', 'Debit (AED)', 'Credit (AED)', 'Balance (AED)'];

  const numericCols = ['Debit (AED)', 'Credit (AED)', 'Balance (AED)'];

  return (
    <PageContainer title="General Ledger" description="Running balance per account or consolidated view">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/reports/trial-balance')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBook size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>General Ledger</Typography>
            <Typography variant="body2" color="text.secondary">Track every posted line with payee and payer details</Typography>
          </Box>
        </Stack>
        {data && (
          <Button startIcon={<IconDownload size={18} />} variant="outlined" onClick={exportCsv} sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconFilter size={18} style={{ opacity: 0.6 }} />
            <Typography variant="subtitle2" fontWeight={800}>Filters</Typography>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={accountId === 'all' ? 'all' : 'single'}
            onChange={(_, v) => {
              if (!v) return;
              if (v === 'all') {
                setAccountId('all');
              } else if (!accountId || accountId === 'all') {
                setAccountId(accounts[0]?.id ? String(accounts[0].id) : '');
              }
              setPage(0);
            }}
            sx={{ '& .MuiToggleButton-root': { borderRadius: 2, px: 2, fontWeight: 600, textTransform: 'none' } }}
          >
            <ToggleButton value="all">All accounts</ToggleButton>
            <ToggleButton value="single">Single account</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
            {accountId !== 'all' && (
              <TextField select size="small" label="Account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setPage(0); }} sx={{ minWidth: 280, flex: 1 }}>
                {accounts.map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</MenuItem>)}
              </TextField>
            )}
            <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <TextField
              size="small"
              label="Search"
              placeholder="Description, entry #, account…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <TextField size="small" label="Paid to" value={paidToFilter} onChange={(e) => { setPaidToFilter(e.target.value); setPage(0); }} sx={{ minWidth: 160 }} />
            <TextField size="small" label="Received from" value={receivedFromFilter} onChange={(e) => { setReceivedFromFilter(e.target.value); setPage(0); }} sx={{ minWidth: 160 }} />
            <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2, px: 3, alignSelf: { xs: 'stretch', md: 'center' } }}>
              {loading ? 'Loading…' : 'Run'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <>
          {!viewAll && selectedAccount && (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)` }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>ACCOUNT</Typography>
                  <Typography fontWeight={800} fontSize="1.05rem">{selectedAccount.code} — {selectedAccount.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>OPENING</Typography>
                  <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>AED {fmt(data.openingBalance)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CLOSING</Typography>
                  <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>AED {fmt(data.closingBalance ?? data.lines?.at(-1)?.running_balance)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>LINES</Typography>
                  <Typography fontWeight={700}>{data.total || data.lines?.length}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {viewAll && (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2, bgcolor: alpha(theme.palette.info.main, 0.06) }}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <Chip label="All accounts" color="info" size="small" sx={{ fontWeight: 700 }} />
                <Typography variant="body2" color="text.secondary">
                  Showing {data.total} posted line{data.total !== 1 ? 's' : ''} across every account · newest first
                </Typography>
              </Stack>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((h) => (
                      <TableCell
                        key={h}
                        align={numericCols.includes(h) ? 'right' : 'left'}
                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.04), whiteSpace: 'nowrap' }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!viewAll && (
                    <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                      <TableCell>{dateFrom}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell sx={{ fontStyle: 'italic', fontWeight: 600 }}>Opening Balance</TableCell>
                      <TableCell colSpan={3} />
                      <TableCell colSpan={2} />
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(data.openingBalance)}</TableCell>
                    </TableRow>
                  )}
                  {asArray(data.lines).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No transactions match your filters</Typography>
                      </TableCell>
                    </TableRow>
                  ) : asArray(data.lines).map((l) => (
                    <TableRow key={l.line_id || `${l.journal_entry_id}-${l.account_code}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.entry_date}</TableCell>
                      {viewAll && (
                        <TableCell>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ p: 0, minWidth: 0, fontWeight: 600, textAlign: 'left', justifyContent: 'flex-start' }}
                            onClick={() => navigate(`/erp/reports/general-ledger?accountId=${l.account_id}`)}
                          >
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace' }}>{l.account_code}</Typography>
                            <Typography variant="body2" fontWeight={600}>{l.account_name}</Typography>
                          </Button>
                        </TableCell>
                      )}
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {l.journal_entry_id ? (
                          <Button size="small" variant="text" sx={{ p: 0, fontFamily: 'monospace', fontWeight: 600 }}
                            onClick={() => navigate(`/erp/journal/view/${l.journal_entry_id}`)}>
                            {l.entry_number}
                          </Button>
                        ) : l.entry_number}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.description}>{l.description}</TableCell>
                      <TableCell>
                        {l.paid_to ? <Chip size="small" label={l.paid_to} variant="outlined" sx={{ maxWidth: 140, fontWeight: 600 }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {l.received_from ? <Chip size="small" label={l.received_from} color="success" variant="outlined" sx={{ maxWidth: 140, fontWeight: 600 }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={SOURCE_LABELS[l.source_type] || l.source_type} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.debit) > 0 ? 'text.primary' : 'text.disabled' }}>
                        {parseFloat(l.debit) > 0 ? fmt(l.debit) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.credit) > 0 ? 'text.primary' : 'text.disabled' }}>
                        {parseFloat(l.credit) > 0 ? fmt(l.credit) : '—'}
                      </TableCell>
                      {!viewAll && (
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(l.running_balance)}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {data.total > rowsPerPage && (
              <TablePagination component="div" count={data.total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[rowsPerPage]} />
            )}
          </Paper>
        </>
      )}

      {!loading && !data && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: 'center' }}>
          <IconBook size={48} style={{ opacity: 0.15, marginBottom: 12 }} />
          <Typography color="text.secondary">Choose a view and date range, then run the report.</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default GeneralLedgerView;
