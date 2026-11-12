import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, TextField, MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReportMoney, IconPrinter } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import GlAmountLink from '../../../components/erp/GlAmountLink';
import apiService from '../../../services/api';
import { localToday, localYearStart, localDate } from '../../../utils/dateLocal';

const fmt = (n) => {
  const v = Number(n || 0);
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${s})` : s;
};
const mono = { fontFamily: 'monospace', width: 150 };

const parse = (s) => new Date(`${s}T12:00:00`);
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return localDate(d); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000) + 1;
const sameLastYear = (s) => { const d = parse(s); d.setFullYear(d.getFullYear() - 1); return localDate(d); };

const comparisonDates = (mode, from, to) => {
  if (mode === 'previous') { const len = daysBetween(from, to); return { from: addDays(from, -len), to: addDays(from, -1) }; }
  if (mode === 'year') return { from: sameLastYear(from), to: sameLastYear(to) };
  return null;
};

const pct = (cur, prev) => (Math.abs(prev) < 0.005 ? '' : `${(((cur - prev) / Math.abs(prev)) * 100).toFixed(1)}%`);

const IncomeStatementView = () => {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(localYearStart());
  const [dateTo, setDateTo] = useState(localToday());
  const [compare, setCompare] = useState('none');

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true); setError('');
      const c = comparisonDates(compare, dateFrom, dateTo);
      const res = await apiService.getIncomeStatement({
        dateFrom, dateTo, ...(c ? { comparativeDateFrom: c.from, comparativeDateTo: c.to } : {}),
      });
      if (res.success) setData(res.data); else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, compare]);

  const cmp = !!data?.comparative_from;
  const cols = cmp ? 3 : 2;

  const Amounts = ({ cur, prev, bold }) => (
    <>
      <TableCell align="right" sx={{ ...mono, fontWeight: bold ? 800 : 400 }}>{fmt(cur)}</TableCell>
      {cmp && <TableCell align="right" sx={{ ...mono, fontWeight: bold ? 800 : 400, color: 'text.secondary' }}>{fmt(prev)}</TableCell>}
      {cmp && <TableCell align="right" sx={{ width: 90, color: 'text.secondary', fontSize: '0.75rem' }}>{pct(cur, prev)}</TableCell>}
    </>
  );

  const Section = ({ sec }) => {
    if (!sec || sec.groups.length === 0) return null;
    return (
      <>
        <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
          <TableCell colSpan={cols + (cmp ? 1 : 0)} sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>{sec.title}</TableCell>
        </TableRow>
        {sec.groups.map((g) => (
          <React.Fragment key={g.key}>
            {g.head && (
              <TableRow>
                <TableCell sx={{ pl: 3, fontWeight: 700 }}>{g.head.code} {g.head.name}</TableCell>
                <TableCell /><TableCell />{cmp && <TableCell />}
              </TableRow>
            )}
            {g.items.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell sx={{ pl: g.head ? 7 : 3 }}>{i.code} {i.name}</TableCell>
                <TableCell align="right" sx={mono}>
                  <GlAmountLink accountId={i.id} dateFrom={data.date_from} dateTo={data.date_to} title="View the postings behind this amount">{fmt(i.amount)}</GlAmountLink>
                </TableCell>
                {cmp && <TableCell align="right" sx={{ ...mono, color: 'text.secondary' }}>{fmt(i.comparative)}</TableCell>}
                {cmp && <TableCell align="right" sx={{ width: 90, color: 'text.secondary', fontSize: '0.75rem' }}>{pct(i.amount, i.comparative)}</TableCell>}
              </TableRow>
            ))}
            {g.head && g.items.length > 1 && (
              <TableRow>
                <TableCell sx={{ pl: 3, fontStyle: 'italic' }}>Total {g.head.name}</TableCell>
                <Amounts cur={g.total} prev={g.comparativeTotal} />
              </TableRow>
            )}
          </React.Fragment>
        ))}
        <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
          <TableCell sx={{ fontWeight: 800 }}>Total {sec.title.toLowerCase()}</TableCell>
          <Amounts cur={sec.total} prev={sec.comparativeTotal} bold />
        </TableRow>
      </>
    );
  };

  const Result = ({ label, cur, prev, strong }) => (
    <TableRow sx={{ bgcolor: strong ? alpha((cur >= 0 ? theme.palette.success : theme.palette.error).main, 0.08) : alpha(theme.palette.primary.main, 0.05) }}>
      <TableCell sx={{ fontWeight: 900 }}>{label}</TableCell>
      <Amounts cur={cur} prev={prev} bold />
    </TableRow>
  );

  const tc = data?.totals?.current || {};
  const tp = data?.totals?.comparative || {};

  return (
    <PageContainer title="Income Statement" description="Profit & Loss for the selected period">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReportMoney size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ flex: 1 }}>Income Statement (P&L)</Typography>
        {data && <Button startIcon={<IconPrinter size={18} />} onClick={() => window.print()} sx={{ borderRadius: 2, '@media print': { display: 'none' } }}>Print</Button>}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, '@media print': { display: 'none' } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField select label="Compare with" size="small" value={compare} onChange={(e) => setCompare(e.target.value)} sx={{ width: 220 }}>
            <MenuItem value="none">No comparison</MenuItem>
            <MenuItem value="previous">Previous period (same length)</MenuItem>
            <MenuItem value="year">Same period last year</MenuItem>
          </TextField>
          <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2 }}>{loading ? 'Loading…' : 'Run Report'}</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800}>Income Statement</Typography>
            <Typography variant="caption" color="text.secondary">
              For the period {data.date_from} to {data.date_to}{cmp ? ` compared with ${data.comparative_from} to ${data.comparative_to}` : ''} | Amounts in AED | Lines with no activity are hidden
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{cmp ? `${data.date_from} – ${data.date_to}` : 'Amount'}</TableCell>
                  {cmp && <TableCell align="right" sx={{ fontWeight: 700 }}>{data.comparative_from} – {data.comparative_to}</TableCell>}
                  {cmp && <TableCell align="right" sx={{ fontWeight: 700 }}>Change</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <Section sec={data.sections.revenue} />
                <Section sec={data.sections.cogs} />
                <Result label="Gross profit" cur={tc.grossProfit} prev={tp.grossProfit} />
                <Section sec={data.sections.opex} />
                <Result label="Operating income" cur={tc.operatingIncome} prev={tp.operatingIncome} />
                <Section sec={data.sections.finance} />
                <Result label="NET INCOME" cur={tc.netIncome} prev={tp.netIncome} strong />
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
