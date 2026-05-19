import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReceipt } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeVatReport } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const VatReportView = () => {
  const theme = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getQtrStart = () => {
    const m = new Date().getMonth();
    const qm = Math.floor(m / 3) * 3;
    return new Date(new Date().getFullYear(), qm, 1).toISOString().slice(0, 10);
  };

  const [dateFrom, setDateFrom] = useState(getQtrStart());
  const [dateTo, setDateTo] = useState(today);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getVatReport({ dateFrom, dateTo });
      if (res.success) setData(normalizeVatReport(res.data));
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const d = data || {};

  return (
    <PageContainer title="VAT Report" description="UAE FTA VAT summary — Output vs Input tax">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReceipt size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>VAT Report (UAE)</Typography>
        <Chip label="FTA Filing" size="small" color="warning" />
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? 'Loading…' : 'Run Report'}
          </Button>
          <Typography variant="caption" color="text.secondary">Default: current quarter (UAE VAT is filed quarterly)</Typography>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <Stack spacing={2}>
          {/* Summary cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: alpha(theme.palette.error.main, 0.3) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>OUTPUT VAT (Tax Collected from Customers)</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>AED {fmt(d.output_vat)}</Typography>
              <Typography variant="caption" color="text.secondary">on taxable sales of AED {fmt(d.taxable_sales)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: alpha(theme.palette.success.main, 0.3) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>INPUT VAT (Tax Paid to Suppliers)</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>AED {fmt(d.input_vat)}</Typography>
              <Typography variant="caption" color="text.secondary">on taxable purchases of AED {fmt(d.taxable_purchases)}</Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: Number(d.net_vat_due) >= 0 ? alpha(theme.palette.warning.main, 0.5) : alpha(theme.palette.info.main, 0.3) }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {Number(d.net_vat_due) >= 0 ? 'NET VAT PAYABLE TO FTA' : 'NET VAT REFUNDABLE FROM FTA'}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
                color={Number(d.net_vat_due) >= 0 ? 'warning.main' : 'info.main'}
                sx={{ mt: 0.5 }}
              >
                AED {fmt(Math.abs(d.net_vat_due))}
              </Typography>
              <Typography variant="caption" color="text.secondary">Output VAT − Input VAT</Typography>
            </Paper>
          </Stack>

          {/* Detail table */}
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>VAT Summary — {dateFrom} to {dateTo}</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Net Amount (AED)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>VAT Amount (AED)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Sales (Output VAT)</TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Standard Rated Sales (5%)</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(d.taxable_sales)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(d.output_vat)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Output Tax</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(d.taxable_sales)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(d.output_vat)}</TableCell>
                  </TableRow>

                  <TableRow><TableCell colSpan={3} sx={{ py: 0.5 }} /></TableRow>

                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Purchases (Input VAT)</TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Standard Rated Purchases (5%)</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(d.taxable_purchases)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(d.input_vat)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Input Tax</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(d.taxable_purchases)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(d.input_vat)}</TableCell>
                  </TableRow>

                  <TableRow><TableCell colSpan={3} sx={{ py: 0.5 }} /></TableRow>

                  <TableRow sx={{ bgcolor: Number(d.net_vat_due) >= 0 ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.info.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 900 }}>
                      {Number(d.net_vat_due) >= 0 ? 'NET VAT PAYABLE TO FTA' : 'NET VAT REFUNDABLE FROM FTA'}
                    </TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', borderTop: '3px double', borderColor: 'divider' }}>
                      AED {fmt(Math.abs(d.net_vat_due))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Typography variant="body2">
              This report covers account 2100 (VAT Payable / Output Tax) and account 1200 (VAT Receivable / Input Tax).
              File your VAT return on the FTA portal using these figures. UAE VAT rate is 5%.
            </Typography>
          </Alert>
        </Stack>
      )}

      {!loading && !data && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select a date range (typically a quarter) and click "Run Report".</Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default VatReportView;
