import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, CircularProgress, Alert, Stack, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconCoin, IconChartHistogram } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const PAYMENT_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReceivablesList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payRow, setPayRow] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paySaving, setPaySaving] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search: search || undefined };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const res = await apiService.getReceivables(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setRows(list);
      setTotalCount(res.pagination?.totalItems ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load receivables');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo, paymentStatus]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openPay = (r) => {
    setPayRow(r);
    const due = parseFloat(r.balance_due) || 0;
    setPayAmount(String(due > 0 ? due.toFixed(2) : ''));
    setPayMethod(r.payment_method || '');
    setPayRef(r.reference_no || '');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayOpen(true);
  };

  const [payDialogError, setPayDialogError] = useState('');

  const submitPay = async () => {
    if (!payRow) return;
    const amt = parseFloat(String(payAmount).replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      setPayDialogError('Enter a valid amount greater than zero.');
      return;
    }
    try {
      setPaySaving(true);
      setPayDialogError('');
      await apiService.postReceivablePayment(payRow.id, {
        amount: amt,
        paymentMethod: payMethod || undefined,
        referenceNo: payRef || undefined,
        paymentDate: payDate || undefined,
      });
      setPayOpen(false);
      setPayRow(null);
      setError('');
      fetchRows();
    } catch (err) {
      setPayDialogError(err.message || 'Payment failed');
    } finally {
      setPaySaving(false);
    }
  };

  return (
    <PageContainer title="Receivables" description="Outstanding tax invoices — record partial or full receipts">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.15), color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCoin size={20} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>Receivables</Typography>
              <Typography variant="body2" color="text.secondary">{totalCount} open invoice{totalCount !== 1 ? 's' : ''}</Typography>
            </Box>
          </Stack>
          <Button variant="outlined" startIcon={<IconChartHistogram size={18} />} onClick={() => navigate('/erp/receivables/aging')} sx={{ borderRadius: 2 }}>
            Aging summary
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <TextField size="small" placeholder="Search client, deal, invoice #..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }} sx={{ minWidth: 240, flex: 1 }} />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Payment</InputLabel>
                <Select label="Payment" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={(v) => { setDateFrom(v); setPage(0); }} onToChange={(v) => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Invoice date" compact />
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.06) }}>
                  {['Invoice #', 'Client', 'Invoice date', 'Due', 'Total', 'Paid', 'Balance', 'Status', 'Days open', ''].map((h, i) => (
                    <TableCell key={h} align={['Total', 'Paid', 'Balance', ''].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No open receivables</Typography></TableCell></TableRow>
                ) : rows.map((r) => {
                  const cur = r.currency || 'AED';
                  const client = r.proformaInvoice?.deal?.company?.company_name || r.proformaInvoice?.deal?.title || '—';
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={700} sx={{ cursor: 'pointer', color: 'primary.main' }} onClick={() => navigate(`/erp/tax-invoices/view/${r.id}`)}>{r.tax_invoice_number}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{client}</Typography></TableCell>
                      <TableCell>{r.invoice_date || '—'}</TableCell>
                      <TableCell>{r.due_date || '—'}</TableCell>
                      <TableCell align="right">{cur} {fmt(r.total)}</TableCell>
                      <TableCell align="right">{cur} {fmt(r.paid_amount)}</TableCell>
                      <TableCell align="right"><Typography fontWeight={800} color="warning.dark">{cur} {fmt(r.balance_due)}</Typography></TableCell>
                      <TableCell><Chip size="small" label={r.payment_status} color={PAYMENT_COLOR[r.payment_status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell>{r.days_open ?? '—'}</TableCell>
                      <TableCell align="right">
                        {parseFloat(r.balance_due) > 0.005 && (
                          <Button size="small" variant="contained" color="warning" onClick={() => openPay(r)} sx={{ borderRadius: 2 }}>Record payment</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
        </Card>
      </Box>

      <Dialog open={payOpen} onClose={() => !paySaving && (setPayOpen(false), setPayDialogError(''))} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>
          Record receipt
          {payRow && (
            <Typography variant="body2" color="text.secondary" fontWeight={400}>
              {payRow.tax_invoice_number} — balance{' '}
              <strong>{payRow.currency || 'AED'} {fmt(parseFloat(payRow.balance_due) || 0)}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 320 }}>
            {payDialogError && <Alert severity="error" onClose={() => setPayDialogError('')}>{payDialogError}</Alert>}
            <TextField size="small" label={`Amount (${payRow?.currency || 'AED'})`} type="number" inputProps={{ min: 0.01, step: '0.01' }} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} fullWidth />
            <TextField size="small" label="Payment method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} fullWidth />
            <TextField size="small" label="Reference / cheque no." value={payRef} onChange={(e) => setPayRef(e.target.value)} fullWidth />
            <TextField size="small" label="Payment date" type="date" InputLabelProps={{ shrink: true }} value={payDate} onChange={(e) => setPayDate(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setPayOpen(false); setPayDialogError(''); }} disabled={paySaving}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={submitPay} disabled={paySaving}>{paySaving ? 'Saving…' : 'Save receipt'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ReceivablesList;
