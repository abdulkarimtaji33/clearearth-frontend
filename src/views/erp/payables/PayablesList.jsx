import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, CircularProgress, Alert, Stack, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconTruckDelivery, IconChartHistogram, IconHistory } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import PaymentHistoryDialog from '../../../components/erp/PaymentHistoryDialog';
import apiService from '../../../services/api';
import { extractListData } from '../../../utils/reportApi';
import { resolveDefaultPaymentAccountId } from '../../../constants/paymentAccounts';
import {
  PAID_TO_OPTIONS,
  PAID_TO_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../../constants/expenseFormOptions';

const PAYMENT_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PayablesList = () => {
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
  const [payDue, setPayDue] = useState('');
  const [payMethod, setPayMethod] = useState('Bank transfer');
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [customPaidTo, setCustomPaidTo] = useState(() => loadStoredOptions(PAID_TO_STORAGE_KEY));
  const [paySaving, setPaySaving] = useState(false);
  const [payDialogError, setPayDialogError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search: search || undefined };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const res = await apiService.getPayables(params);
      setRows(Array.isArray(res.data) ? res.data : extractListData(res));
      setTotalCount(res.pagination?.totalItems ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load payables');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo, paymentStatus]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setPaymentAccounts(list.filter((a) => !a.is_group && a.is_active));
      }
    });
  }, []);

  const paidToOptions = useMemo(
    () => mergeSelectOptions(PAID_TO_OPTIONS, customPaidTo, paidTo),
    [customPaidTo, paidTo]
  );

  const defaultPayAccountId = useMemo(
    () => resolveDefaultPaymentAccountId(paymentAccounts, payMethod),
    [paymentAccounts, payMethod]
  );

  const addCustomPaidTo = useCallback((v) => {
    setCustomPaidTo((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAID_TO_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const openPay = (r) => {
    setPayRow(r);
    const due = parseFloat(r.balance_due) || 0;
    setPayAmount(String(due > 0 ? due.toFixed(2) : ''));
    setPayDue(r.due_date || '');
    setPayMethod('Bank transfer');
    setPayAccountId(resolveDefaultPaymentAccountId(paymentAccounts, 'Bank transfer'));
    setPaidTo(r.party_name || 'Supplier');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayDialogError('');
    setPayOpen(true);
  };

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
      await apiService.postPayablePayment(payRow.id, {
        amount: amt,
        dueDate: payDue || undefined,
        paymentMethod: payMethod || undefined,
        paymentAccountId: payAccountId ? parseInt(payAccountId, 10) : undefined,
        paymentDate: payDate || undefined,
        paidTo: paidTo || undefined,
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
    <PageContainer title="Payables" description="Approved purchase orders — record payments to vendors or clients">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.15), color: 'secondary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTruckDelivery size={20} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>Payables</Typography>
              <Typography variant="body2" color="text.secondary">{totalCount} open</Typography>
            </Box>
          </Stack>
          <Button variant="outlined" startIcon={<IconChartHistogram size={18} />} onClick={() => navigate('/erp/payables/aging')} sx={{ borderRadius: 2 }}>Aging summary</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <TextField size="small" placeholder="Search vendor or client..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={(v) => { setDateFrom(v); setPage(0); }} onToChange={(v) => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="PO date" compact />
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.06) }}>
                  {['PO #', 'Party', 'PO date', 'Due', 'Total', 'Paid', 'Balance', 'Status', 'Days', ''].map((h) => (
                    <TableCell key={h} align={['Total', 'Paid', 'Balance', ''].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No open payables</Typography></TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={700} sx={{ cursor: 'pointer', color: 'primary.main' }} onClick={() => navigate(`/erp/purchase-orders/view/${r.id}`)}>#{r.id}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary" display="block">{r.party_label}</Typography><Typography variant="body2">{r.party_name}</Typography></TableCell>
                    <TableCell>{r.po_date || '—'}</TableCell>
                    <TableCell>{r.due_date || '—'}</TableCell>
                    <TableCell align="right">AED {fmt(r.po_total)}</TableCell>
                    <TableCell align="right">AED {fmt(r.paid_amount)}</TableCell>
                    <TableCell align="right"><Typography fontWeight={800} color="secondary.dark">AED {fmt(r.balance_due)}</Typography></TableCell>
                    <TableCell><Chip size="small" label={r.payment_status} color={PAYMENT_COLOR[r.payment_status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} /></TableCell>
                    <TableCell>{r.days_open ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {(parseFloat(r.paid_amount) || 0) > 0 && (
                          <Button size="small" variant="outlined" startIcon={<IconHistory size={14} />} onClick={() => { setHistoryRow(r); setHistoryOpen(true); }} sx={{ borderRadius: 2 }}>History</Button>
                        )}
                        <Button size="small" variant="contained" color="secondary" onClick={() => openPay(r)} sx={{ borderRadius: 2 }}>Pay</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
        </Card>
      </Box>
      <Dialog open={payOpen} onClose={() => !paySaving && (setPayOpen(false), setPayDialogError(''))} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>
          Record payment
          {payRow && (
            <Typography variant="body2" color="text.secondary" fontWeight={400}>
              PO #{payRow.id} · {payRow.party_name} — balance{' '}
              <strong>AED {fmt(parseFloat(payRow.balance_due) || 0)}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 320 }}>
            {payDialogError && <Alert severity="error" onClose={() => setPayDialogError('')}>{payDialogError}</Alert>}
            <TextField size="small" label="Amount (AED)" type="number" inputProps={{ min: 0.01, step: '0.01' }} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <PaymentRecordingFields
              paymentMethod={payMethod}
              onPaymentMethodChange={setPayMethod}
              paymentAccountId={payAccountId || defaultPayAccountId}
              onPaymentAccountChange={setPayAccountId}
              accounts={paymentAccounts}
              showPaidTo
              paidTo={paidTo}
              onPaidToChange={setPaidTo}
              paidToOptions={paidToOptions}
              onPaidToAdded={addCustomPaidTo}
            />
            <TextField size="small" label="Payment date" type="date" InputLabelProps={{ shrink: true }} value={payDate} onChange={(e) => setPayDate(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField size="small" label="Update due date (optional)" type="date" InputLabelProps={{ shrink: true }} helperText="Only fill to change the due date on the PO" value={payDue || ''} onChange={(e) => setPayDue(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setPayOpen(false); setPayDialogError(''); }} disabled={paySaving}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={submitPay} disabled={paySaving}>{paySaving ? 'Saving…' : 'Save payment'}</Button>
        </DialogActions>
      </Dialog>

      <PaymentHistoryDialog
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryRow(null); }}
        sourceType="payable"
        sourceId={historyRow?.id}
        title={historyRow ? `PO #${historyRow.id}` : ''}
      />
    </PageContainer>
  );
};

export default PayablesList;
