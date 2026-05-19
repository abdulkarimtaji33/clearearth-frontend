import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableRow, CircularProgress, Alert, TextField, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCashBanknote } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeCashFlow } from '../../../utils/reportApi';

const fmt = (n) => {
  const v = Number(n || 0);
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${s})` : s;
};

const Row = ({ label, value, indent = 0, bold = false, total = false, sectionHeader = false }) => {
  const theme = useTheme();
  return (
    <TableRow sx={sectionHeader ? { bgcolor: alpha(theme.palette.grey[500], 0.06) } : total ? { bgcolor: alpha(theme.palette.grey[500], 0.04) } : {}}>
      <TableCell sx={{ pl: 2 + indent * 3, fontWeight: bold || total || sectionHeader ? 700 : 400, letterSpacing: sectionHeader ? 0.5 : 0 }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', width: 180, fontWeight: bold || total ? 700 : 400 }}>
        {!total && value !== null && value !== undefined ? fmt(value) : ''}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', width: 180, fontWeight: bold || total ? 800 : 400, borderTop: total ? '2px solid' : 'none', borderColor: 'divider' }}>
        {total && value !== null && value !== undefined ? fmt(value) : ''}
      </TableCell>
    </TableRow>
  );
};

const CashFlowView = () => {
  const theme = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfYear);
  const [dateTo, setDateTo] = useState(today);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getCashFlowStatement({ dateFrom, dateTo });
      if (res.success) setData(normalizeCashFlow(res.data));
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const d = data || {};
  const op = d.operating || {};
  const inv = d.investing || {};
  const fin = d.financing || {};

  return (
    <PageContainer title="Cash Flow Statement" description="Where cash came from and where it went">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCashBanknote size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Cash Flow Statement</Typography>
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
            <Typography variant="h6" fontWeight={800}>Cash Flow Statement (Indirect Method)</Typography>
            <Typography variant="caption" color="text.secondary">For the period {dateFrom} to {dateTo} | Amounts in AED</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {/* Operating */}
                <Row label="OPERATING ACTIVITIES" sectionHeader bold />
                <Row label="Net Income" value={op.net_income} indent={1} />
                {op.depreciation != null && op.depreciation !== 0 && (
                  <Row label="Add: Depreciation" value={op.depreciation} indent={1} />
                )}
                <Row label="Changes in Working Capital:" indent={1} bold />
                {op.ar_change != null && <Row label="(Increase)/Decrease in Accounts Receivable" value={-(op.ar_change)} indent={2} />}
                {op.ap_change != null && <Row label="Increase/(Decrease) in Accounts Payable" value={op.ap_change} indent={2} />}
                {op.accrued_change != null && <Row label="Increase/(Decrease) in Accrued Expenses" value={op.accrued_change} indent={2} />}
                {op.vat_change != null && <Row label="Increase/(Decrease) in VAT Payable" value={op.vat_change} indent={2} />}
                <Row label="Net Cash from Operating Activities" value={d.net_operating} total bold />

                <TableRow><TableCell colSpan={3} sx={{ py: 0.5 }} /></TableRow>

                {/* Investing */}
                <Row label="INVESTING ACTIVITIES" sectionHeader bold />
                {inv.equipment != null && <Row label="Purchase of Equipment" value={inv.equipment} indent={1} />}
                <Row label="Net Cash from Investing Activities" value={d.net_investing} total bold />

                <TableRow><TableCell colSpan={3} sx={{ py: 0.5 }} /></TableRow>

                {/* Financing */}
                <Row label="FINANCING ACTIVITIES" sectionHeader bold />
                {fin.capital != null && fin.capital !== 0 && <Row label="Capital Contributions" value={fin.capital} indent={1} />}
                {fin.drawings != null && fin.drawings !== 0 && <Row label="Drawings" value={-(fin.drawings)} indent={1} />}
                {fin.loan_proceeds != null && fin.loan_proceeds !== 0 && <Row label="Loan Proceeds" value={fin.loan_proceeds} indent={1} />}
                {fin.loan_repayments != null && fin.loan_repayments !== 0 && <Row label="Loan Repayments" value={-(fin.loan_repayments)} indent={1} />}
                <Row label="Net Cash from Financing Activities" value={d.net_financing} total bold />

                <TableRow><TableCell colSpan={3} sx={{ py: 0.5 }} /></TableRow>

                {/* Summary */}
                <Row label="Net Change in Cash" value={d.net_cash_change} indent={0} bold />
                <Row label="Opening Cash Balance" value={d.opening_cash} indent={0} />
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 900 }}>CLOSING CASH BALANCE</TableCell>
                  <TableCell />
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', borderTop: '3px double', borderColor: 'divider' }}>
                    {fmt(d.closing_cash)}
                  </TableCell>
                </TableRow>
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

export default CashFlowView;
