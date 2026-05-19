import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableRow, CircularProgress, Alert, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBuildingBank } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeBalanceSheet, asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Row = ({ label, value, indent = 0, bold = false, total = false, sectionHeader = false }) => {
  const theme = useTheme();
  return (
    <TableRow sx={sectionHeader ? { bgcolor: alpha(theme.palette.grey[500], 0.06) } : total ? { bgcolor: alpha(theme.palette.grey[500], 0.04) } : {}}>
      <TableCell sx={{ pl: 2 + indent * 3, fontWeight: bold || total ? 700 : 400, letterSpacing: sectionHeader ? 0.5 : 0 }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: bold || total ? 700 : 400, width: 180 }}>
        {!total && value !== null && value !== undefined ? fmt(value) : ''}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: bold || total ? 800 : 400, width: 180, borderTop: total ? '2px solid' : 'none', borderColor: 'divider' }}>
        {total && value !== null && value !== undefined ? fmt(value) : ''}
      </TableCell>
    </TableRow>
  );
};

const BalanceSheetView = () => {
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
      const res = await apiService.getBalanceSheet({ asOfDate });
      if (res.success) setData(normalizeBalanceSheet(res.data));
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  const d = data || {};
  const assets = d.assets || {};
  const liabilities = d.liabilities || {};
  const equity = d.equity || {};

  return (
    <PageContainer title="Balance Sheet" description="Financial position at a point in time">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBuildingBank size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Balance Sheet</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="As of Date" type="date" size="small" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
          <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? 'Loading…' : 'Run Report'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <>
          <Box mb={2}>
            {d.is_balanced
              ? <Alert severity="success" icon={false} sx={{ fontWeight: 700 }}>✓ Balance Sheet is IN BALANCE — Assets = Liabilities + Equity = AED {fmt(d.total_assets)}</Alert>
              : <Alert severity="error" icon={false} sx={{ fontWeight: 700 }}>✗ OUT OF BALANCE — Assets: AED {fmt(d.total_assets)} vs L+E: AED {fmt((d.total_liabilities || 0) + (d.total_equity || 0))} | Difference: AED {fmt(Math.abs((d.total_assets || 0) - (d.total_liabilities || 0) - (d.total_equity || 0)))}</Alert>}
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={800}>Balance Sheet</Typography>
              <Typography variant="caption" color="text.secondary">As at {asOfDate} | Amounts in AED</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {/* ASSETS */}
                  <Row label="ASSETS" sectionHeader bold />

                  <Row label="Current Assets" indent={0} bold />
                  {asArray(assets.current_asset).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={2} />)}
                  <Row label="Total Current Assets" value={assets.total_current} total indent={1} bold />

                  {asArray(assets.fixed_asset).length > 0 && (
                    <>
                      <Row label="Fixed Assets" indent={0} bold />
                      {asArray(assets.fixed_asset).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={2} />)}
                      <Row label="Total Fixed Assets" value={assets.total_fixed} total indent={1} bold />
                    </>
                  )}

                  {asArray(assets.other_asset).length > 0 && (
                    <>
                      <Row label="Other Assets" indent={0} bold />
                      {asArray(assets.other_asset).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={2} />)}
                    </>
                  )}

                  <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.06) }}>
                    <TableCell sx={{ fontWeight: 900 }}>TOTAL ASSETS</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', borderTop: '3px double', borderColor: 'divider' }}>{fmt(d.total_assets)}</TableCell>
                  </TableRow>

                  <TableRow><TableCell colSpan={3} sx={{ py: 1 }} /></TableRow>

                  {/* LIABILITIES */}
                  <Row label="LIABILITIES" sectionHeader bold />

                  <Row label="Current Liabilities" indent={0} bold />
                  {asArray(liabilities.current_liability).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={2} />)}
                  <Row label="Total Current Liabilities" value={liabilities.total_current} total indent={1} bold />

                  {asArray(liabilities.long_term_liability).length > 0 && (
                    <>
                      <Row label="Long-term Liabilities" indent={0} bold />
                      {asArray(liabilities.long_term_liability).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={2} />)}
                      <Row label="Total Long-term Liabilities" value={liabilities.total_long_term} total indent={1} bold />
                    </>
                  )}

                  <Row label="Total Liabilities" value={d.total_liabilities} total bold />

                  <TableRow><TableCell colSpan={3} sx={{ py: 1 }} /></TableRow>

                  {/* EQUITY */}
                  <Row label="EQUITY" sectionHeader bold />
                  {asArray(equity.accounts).map((a) => <Row key={a.account_id} label={a.name} value={a.balance} indent={1} />)}
                  {equity.net_income != null && (
                    <Row label="Add: Net Income (current period)" value={equity.net_income} indent={1} />
                  )}
                  <Row label="Total Equity" value={d.total_equity} total bold />

                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                    <TableCell sx={{ fontWeight: 900 }}>TOTAL LIABILITIES AND EQUITY</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', borderTop: '3px double', borderColor: 'divider' }}>
                      {fmt((d.total_liabilities || 0) + (d.total_equity || 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!loading && !data && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select a date and click "Run Report".</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default BalanceSheetView;
