import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconChartBar } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import GlAmountLink from '../../../components/erp/GlAmountLink';
import apiService from '../../../services/api';
import { normalizeChangesInEquity, buildChangesInEquityRows, asArray } from '../../../utils/reportApi';

const fmt = (n) => {
  const v = Number(n || 0);
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${s})` : s;
};

const COLS = ['Share Capital', 'Retained Earnings', 'Drawings', 'Total Equity'];

const ChangesInEquityView = () => {
  const theme = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfYear);
  const [dateTo, setDateTo] = useState(today);
  const [accountIds, setAccountIds] = useState({ capital: null, retained: null, drawings: null });

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = asArray(res.data);
        setAccountIds({
          capital: list.find((a) => String(a.code) === '3000')?.id ?? null,
          retained: list.find((a) => String(a.code) === '3100')?.id ?? null,
          drawings: list.find((a) => String(a.code) === '3200')?.id ?? null,
        });
      }
    });
  }, []);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getChangesInEquity({ dateFrom, dateTo });
      if (res.success) setData(normalizeChangesInEquity(res.data));
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const equityTableRows = useMemo(() => buildChangesInEquityRows(data), [data]);

  return (
    <PageContainer title="Changes in Equity" description="How the owner's stake changed this period">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconChartBar size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Statement of Changes in Equity</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? 'Loading…' : 'Run Report'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800}>Statement of Changes in Equity</Typography>
            <Typography variant="caption" color="text.secondary">For the period {dateFrom} to {dateTo} | Amounts in AED</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Item</TableCell>
                  {COLS.map((c) => <TableCell key={c} align="right" sx={{ fontWeight: 700, width: 160 }}>{c}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {equityTableRows.map((row) => (
                  <TableRow key={row.label} sx={row.isTotal ? { bgcolor: alpha(theme.palette.primary.main, 0.06) } : {}}>
                    <TableCell sx={{ fontWeight: row.isTotal ? 800 : 400 }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: row.isTotal ? 800 : 400, borderTop: row.isTotal ? '2px solid' : 'none', borderColor: 'divider' }}>
                      {row.capital != null ? <GlAmountLink accountId={accountIds.capital} dateTo={dateTo} fontWeight={row.isTotal ? 800 : 400}>{fmt(row.capital)}</GlAmountLink> : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: row.isTotal ? 800 : 400, borderTop: row.isTotal ? '2px solid' : 'none', borderColor: 'divider' }}>
                      {row.retained != null ? <GlAmountLink accountId={accountIds.retained} dateTo={dateTo} fontWeight={row.isTotal ? 800 : 400}>{fmt(row.retained)}</GlAmountLink> : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: row.isTotal ? 800 : 400, borderTop: row.isTotal ? '2px solid' : 'none', borderColor: 'divider' }}>
                      {row.drawings != null ? <GlAmountLink accountId={accountIds.drawings} dateTo={dateTo} fontWeight={row.isTotal ? 800 : 400}>{fmt(row.drawings)}</GlAmountLink> : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: row.isTotal ? 800 : 400, borderTop: row.isTotal ? '2px solid' : 'none', borderColor: 'divider' }}>
                      {row.total != null ? fmt(row.total) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!loading && !data && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select a date range and click "Run Report".</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default ChangesInEquityView;
