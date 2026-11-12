import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, TextField, Chip, Collapse, IconButton, Link,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReceipt, IconChevronDown, IconChevronRight, IconDownload, IconPrinter } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { localToday, localDate } from '../../../utils/dateLocal';

const fmt = (n) => {
  const v = Number(n || 0);
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${s})` : s;
};

const quarterStart = () => {
  const qm = Math.floor(new Date().getMonth() / 3) * 3;
  return localDate(new Date(new Date().getFullYear(), qm, 1));
};

const DRILL = {
  sales: (t) => t.side === 'sales' && !t.adjustment,
  sales_adj: (t) => t.side === 'sales' && t.adjustment,
  purchases: (t) => t.side === 'purchases' && !t.adjustment,
  purchases_adj: (t) => t.side === 'purchases' && t.adjustment,
};

const VatReportView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(quarterStart());
  const [dateTo, setDateTo] = useState(localToday());
  const [open, setOpen] = useState({});

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true); setError('');
      const res = await apiService.getVatReport({ dateFrom, dateTo });
      if (res.success) { setData(res.data); setOpen({}); } else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const exportExcel = async () => {
    try {
      setExporting(true);
      await apiService.downloadVatReportExcel({ dateFrom, dateTo });
    } catch (e) {
      setError(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const d = data || {};
  const net = Number(d.net_vat_due || 0);

  return (
    <PageContainer title="VAT Report" description="UAE FTA VAT return — output tax, input tax and what is payable">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReceipt size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ flex: 1 }}>VAT Report (UAE)</Typography>
        <Chip label="FTA VAT 201 layout" size="small" color="warning" />
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, '@media print': { display: 'none' } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <Button variant="contained" onClick={load} disabled={loading} sx={{ borderRadius: 2 }}>{loading ? 'Loading…' : 'Run Report'}</Button>
          {data && <Button startIcon={<IconDownload size={18} />} onClick={exportExcel} disabled={exporting} sx={{ borderRadius: 2 }}>{exporting ? 'Preparing…' : 'Export to Excel'}</Button>}
          {data && <Button startIcon={<IconPrinter size={18} />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>Print</Button>}
          <Typography variant="caption" color="text.secondary">Default: current quarter (UAE VAT is filed quarterly)</Typography>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}

      {!loading && data && (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: alpha(theme.palette.error.main, 0.3) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>OUTPUT TAX (after credit notes)</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main">AED {fmt(d.output_vat?.net)}</Typography>
              <Typography variant="caption" color="text.secondary">on sales of AED {fmt(d.output_vat?.standard_rated_sales)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: alpha(theme.palette.success.main, 0.3) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>INPUT TAX (after debit notes)</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main">AED {fmt(d.input_vat?.net)}</Typography>
              <Typography variant="caption" color="text.secondary">on expenses of AED {fmt(d.input_vat?.standard_rated_purchases)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, borderColor: alpha(theme.palette[net >= 0 ? 'warning' : 'info'].main, 0.5) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{net >= 0 ? 'NET VAT PAYABLE TO FTA' : 'NET VAT REFUNDABLE FROM FTA'}</Typography>
              <Typography variant="h5" fontWeight={800} color={net >= 0 ? 'warning.main' : 'info.main'}>AED {fmt(Math.abs(net))}</Typography>
              <Typography variant="caption" color="text.secondary">Output tax − input tax</Typography>
            </Paper>
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>VAT return — {dateFrom} to {dateTo}</Typography>
              <Typography variant="caption" color="text.secondary">Click a line with an arrow to see the journal entries behind it.</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 70 }}>Box</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (AED)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>VAT (AED)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(d.boxes || []).map((b) => {
                    const rows = b.drill ? (d.transactions || []).filter(DRILL[b.drill]) : [];
                    const expandable = rows.length > 0;
                    const bg = b.total ? alpha(theme.palette.grey[500], 0.06) : b.side === 'summary' ? alpha(theme.palette.warning.main, 0.05) : undefined;
                    return (
                      <React.Fragment key={b.box}>
                        <TableRow hover={expandable} sx={{ bgcolor: bg, cursor: expandable ? 'pointer' : 'default' }} onClick={() => expandable && setOpen((o) => ({ ...o, [b.box]: !o[b.box] }))}>
                          <TableCell sx={{ fontWeight: 700 }}>{b.box}</TableCell>
                          <TableCell sx={{ fontWeight: b.total ? 800 : 400 }}>
                            {expandable && <IconButton size="small" sx={{ mr: 0.5 }}>{open[b.box] ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}</IconButton>}
                            {b.label}
                            {expandable && <Typography component="span" variant="caption" color="text.secondary"> ({rows.length})</Typography>}
                            {b.note && <Typography component="span" variant="caption" color="text.secondary"> — {b.note}</Typography>}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{b.amount === undefined ? '' : fmt(b.amount)}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: b.total ? 800 : 400 }}>{b.vat === undefined ? '' : fmt(b.vat)}</TableCell>
                        </TableRow>
                        {expandable && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ p: 0, border: open[b.box] ? undefined : 0 }}>
                              <Collapse in={!!open[b.box]} unmountOnExit>
                                <Box sx={{ px: 3, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        {['Date', 'Entry', 'Party', 'Description', 'Amount', 'VAT'].map((h, i) => <TableCell key={h} align={i >= 4 ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.7rem' }}>{h}</TableCell>)}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {rows.map((t) => (
                                        <TableRow key={`${t.entry_id}-${t.side}`}>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.date}</TableCell>
                                          <TableCell><Link component="button" onClick={(e) => { e.stopPropagation(); navigate(`/erp/journal/view/${t.entry_id}`); }}>{t.entry_number}</Link></TableCell>
                                          <TableCell>{t.party || '—'}</TableCell>
                                          <TableCell>{t.description}</TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(t.net)}</TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(t.vat)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Typography variant="body2">
              Output tax is VAT on sales (account 2100) and input tax is recoverable VAT on expenses (account 1200). Credit notes issued to customers and debit notes received from suppliers are shown on their own lines (1a and 9a) and reduce the totals.
              Supplies by emirate, zero-rated, exempt and reverse-charge amounts are not tracked separately yet, so boxes 3 and 4 show zero.
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
