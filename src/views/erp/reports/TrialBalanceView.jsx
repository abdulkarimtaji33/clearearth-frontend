import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconScale, IconDownload } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeTrialBalance, asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPE_COLOR = {
  asset: 'info', liability: 'warning', equity: 'secondary', revenue: 'success', expense: 'error',
};

const TrialBalanceView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    if (!asOfDate) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getTrialBalance({ asOfDate });
      if (res.success) setData(normalizeTrialBalance(res.data));
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  const exportCsv = () => {
    if (!data?.accounts) return;
    const accounts = asArray(data.accounts);
    const rows = [
      ['Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Balance'],
      ...accounts.map((a) => [a.code, a.name, a.type, a.total_debit, a.total_credit, a.balance]),
      [],
      ['', 'TOTAL', '', data.totals?.total_debit || 0, data.totals?.total_credit || 0, ''],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `trial-balance-${asOfDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Trial Balance" description="Verify all debits equal all credits">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconScale size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Trial Balance</Typography>
        </Stack>
        {data && (
          <Button startIcon={<IconDownload size={18} />} variant="outlined" onClick={exportCsv} sx={{ borderRadius: 2 }}>Export CSV</Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="As of Date" type="date" size="small" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
          <Button variant="contained" onClick={load} disabled={loading || !asOfDate} sx={{ borderRadius: 2 }}>
            {loading ? 'Loading…' : 'Run Report'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <>
          <Box mb={2}>
            {data.is_balanced
              ? <Alert severity="success" icon={false} sx={{ fontWeight: 700 }}>✓ Trial Balance is IN BALANCE — Total Debits = Total Credits = AED {fmt(data.totals?.total_debit)}</Alert>
              : <Alert severity="error" icon={false} sx={{ fontWeight: 700 }}>✗ OUT OF BALANCE — Difference: AED {fmt(Math.abs((data.totals?.total_debit || 0) - (data.totals?.total_credit || 0)))}</Alert>}
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>As at {asOfDate}</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }} align="right">Debit (AED)</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }} align="right">Credit (AED)</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }} align="right">Balance (AED)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {asArray(data.accounts).map((acc) => (
                    <TableRow key={acc.account_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        <Button size="small" variant="text" sx={{ p: 0, fontFamily: 'monospace', fontWeight: 600 }}
                          onClick={() => navigate(`/erp/reports/general-ledger?accountId=${acc.account_id}`)}>
                          {acc.code}
                        </Button>
                      </TableCell>
                      <TableCell>{acc.name}</TableCell>
                      <TableCell><Chip label={acc.type} size="small" color={TYPE_COLOR[acc.type] || 'default'} /></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{parseFloat(acc.total_debit) > 0 ? fmt(acc.total_debit) : '—'}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{parseFloat(acc.total_credit) > 0 ? fmt(acc.total_credit) : '—'}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(acc.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
                    <TableCell colSpan={3} sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{fmt(data.totals?.total_debit)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{fmt(data.totals?.total_credit)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!loading && !data && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select a date and click "Run Report" to generate the trial balance.</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default TrialBalanceView;
