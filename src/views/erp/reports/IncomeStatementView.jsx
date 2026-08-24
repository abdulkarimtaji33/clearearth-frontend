import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReportMoney } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import GlAmountLink from '../../../components/erp/GlAmountLink';
import apiService from '../../../services/api';
import { normalizeIncomeStatement, asArray } from '../../../utils/reportApi';

const fmt = (n, parens = false) => {
  const v = Number(n || 0);
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (parens && v < 0) return `(${s})`;
  return v < 0 ? `(${s})` : s;
};

const SectionRow = ({ label, value, accountId, dateFrom, dateTo, indent = 0, bold = false, color }) => {
  return (
    <TableRow>
      <TableCell sx={{ pl: 2 + indent * 3, fontWeight: bold ? 700 : 400, color: color || 'inherit' }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 400, color: color || 'inherit', width: 180 }}>
        {value !== null && value !== undefined ? (
          accountId != null ? (
            <GlAmountLink accountId={accountId} dateFrom={dateFrom} dateTo={dateTo} title="View postings that make up this balance">{fmt(value)}</GlAmountLink>
          ) : fmt(value)
        ) : ''}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 400, color: color || 'inherit', width: 180 }} />
    </TableRow>
  );
};

const TotalRow = ({ label, value, highlight = false }) => {
  const theme = useTheme();
  return (
    <TableRow sx={{ bgcolor: highlight ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.grey[500], 0.04) }}>
      <TableCell sx={{ fontWeight: 800 }}>{label}</TableCell>
      <TableCell />
      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800, borderTop: '2px solid', borderColor: 'divider', width: 180 }}>
        {value !== null && value !== undefined ? fmt(value) : ''}
      </TableCell>
    </TableRow>
  );
};

const IncomeStatementView = () => {
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
      const res = await apiService.getIncomeStatement({ dateFrom, dateTo });
      if (res.success) setData(normalizeIncomeStatement(res.data));
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const d = data || {};
  const revenue = d.revenue || {};
  const cogs = d.cogs || {};
  const opex = d.operating_expenses || {};
  const finance = d.finance_costs || {};

  return (
    <PageContainer title="Income Statement" description="Profit & Loss for the selected period">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReportMoney size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Income Statement (P&L)</Typography>
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
            <Typography variant="h6" fontWeight={800}>Income Statement</Typography>
            <Typography variant="caption" color="text.secondary">For the period {dateFrom} to {dateTo} | Amounts in AED</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {/* Revenue */}
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 800, letterSpacing: 0.5 }}>REVENUE</TableCell>
                </TableRow>
                {asArray(revenue.accounts).map((a) => (
                  <SectionRow key={a.account_id} label={a.name} value={a.balance} accountId={a.account_id} dateFrom={dateFrom} dateTo={dateTo} indent={1} />
                ))}
                <TotalRow label="Total Revenue" value={revenue.total} />

                {/* COGS */}
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 800, letterSpacing: 0.5, pt: 1.5 }}>COST OF REVENUE</TableCell>
                </TableRow>
                {asArray(cogs.accounts).map((a) => (
                  <SectionRow key={a.account_id} label={a.name} value={a.balance} accountId={a.account_id} dateFrom={dateFrom} dateTo={dateTo} indent={1} />
                ))}
                <TotalRow label="Total Cost of Revenue" value={cogs.total} />
                <TotalRow label="Gross Profit" value={d.gross_profit} highlight />

                {/* OpEx */}
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 800, letterSpacing: 0.5, pt: 1.5 }}>OPERATING EXPENSES</TableCell>
                </TableRow>
                {asArray(opex.accounts).map((a) => (
                  <SectionRow key={a.account_id} label={a.name} value={a.balance} accountId={a.account_id} dateFrom={dateFrom} dateTo={dateTo} indent={1} />
                ))}
                <TotalRow label="Total Operating Expenses" value={opex.total} />
                <TotalRow label="Operating Income (EBIT)" value={d.operating_income} highlight />

                {/* Finance */}
                {asArray(finance.accounts).length > 0 && (
                  <>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 800, letterSpacing: 0.5, pt: 1.5 }}>FINANCE COSTS</TableCell>
                    </TableRow>
                    {asArray(finance.accounts).map((a) => (
                      <SectionRow key={a.account_id} label={a.name} value={a.balance} accountId={a.account_id} dateFrom={dateFrom} dateTo={dateTo} indent={1} />
                    ))}
                    <TotalRow label="Total Finance Costs" value={finance.total} />
                  </>
                )}

                {/* Net Income */}
                <TableRow sx={{ bgcolor: Number(d.net_income) >= 0 ? alpha(theme.palette.success.main, 0.06) : alpha(theme.palette.error.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 900, fontSize: '1rem', pt: 1.5 }}>NET INCOME</TableCell>
                  <TableCell />
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', borderTop: '3px double', borderColor: 'divider', color: Number(d.net_income) >= 0 ? 'success.main' : 'error.main' }}>
                    {fmt(d.net_income)}
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

export default IncomeStatementView;
