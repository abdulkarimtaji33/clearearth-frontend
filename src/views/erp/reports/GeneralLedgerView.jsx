import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField,
  MenuItem, TablePagination,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconBook, IconDownload } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray, normalizeGeneralLedger } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [dateFrom, setDateFrom] = useState(firstOfYear);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) setAccounts(asArray(res.data).filter((a) => !a.is_group && a.is_active));
    });
  }, []);

  const load = useCallback(async () => {
    if (!accountId || !dateFrom || !dateTo) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getGeneralLedger({ accountId, dateFrom, dateTo, page: page + 1, pageSize: rowsPerPage });
      if (res.success) setData(normalizeGeneralLedger(res.data));
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, dateFrom, dateTo, page, rowsPerPage]);

  useEffect(() => {
    if (accountId) load();
  }, [load, accountId]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Entry #', 'Description', 'Source', 'Debit', 'Credit', 'Balance'],
      ['', 'Opening Balance', '', '', '', '', data.openingBalance],
      ...asArray(data.lines).map((l) => [l.entry_date, l.entry_number, l.description, l.source_type, l.debit, l.credit, l.running_balance]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `general-ledger-${accountId}-${dateFrom}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));

  return (
    <PageContainer title="General Ledger" description="Running balance per account">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/reports/trial-balance')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBook size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>General Ledger</Typography>
        </Stack>
        {data && <Button startIcon={<IconDownload size={18} />} variant="outlined" onClick={exportCsv} sx={{ borderRadius: 2 }}>Export CSV</Button>}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
          <TextField select size="small" label="Account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setPage(0); }} sx={{ minWidth: 300 }}>
            <MenuItem value="">— Select account —</MenuItem>
            {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.code} — {a.name}</MenuItem>)}
          </TextField>
          <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <Button variant="contained" onClick={load} disabled={loading || !accountId} sx={{ borderRadius: 2 }}>
            {loading ? 'Loading…' : 'Run'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <>
          {selectedAccount && (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Account</Typography>
                  <Typography fontWeight={700}>{selectedAccount.code} — {selectedAccount.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Opening Balance</Typography>
                  <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>AED {fmt(data.openingBalance)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Closing Balance</Typography>
                  <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>AED {fmt(data.closingBalance ?? (data.lines?.at(-1)?.running_balance))}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Transactions</Typography>
                  <Typography fontWeight={700}>{data.total || data.lines?.length}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Date', 'Entry #', 'Description', 'Source', 'Debit (AED)', 'Credit (AED)', 'Balance (AED)'].map((h) => (
                      <TableCell key={h} align={['Debit (AED)', 'Credit (AED)', 'Balance (AED)'].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                    <TableCell>{dateFrom}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell sx={{ fontStyle: 'italic' }}>Opening Balance</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(data.openingBalance)}</TableCell>
                  </TableRow>
                  {asArray(data.lines).length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions in this period</Typography></TableCell></TableRow>
                  ) : asArray(data.lines).map((l) => (
                    <TableRow key={l.line_id || l.entry_id} hover>
                      <TableCell>{l.entry_date}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        <Button size="small" variant="text" sx={{ p: 0, fontFamily: 'monospace', fontWeight: 600 }}
                          onClick={() => navigate(`/erp/journal/view/${l.journal_entry_id}`)}>
                          {l.entry_number}
                        </Button>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{l.source_type}</Typography></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.debit) > 0 ? 'text.primary' : 'text.disabled' }}>
                        {parseFloat(l.debit) > 0 ? fmt(l.debit) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.credit) > 0 ? 'text.primary' : 'text.disabled' }}>
                        {parseFloat(l.credit) > 0 ? fmt(l.credit) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(l.running_balance)}</TableCell>
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
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select an account and date range to view its ledger.</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default GeneralLedgerView;
