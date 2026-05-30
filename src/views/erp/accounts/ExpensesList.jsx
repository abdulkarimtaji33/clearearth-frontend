import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconWallet, IconPlus, IconHistory } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import PaymentHistoryDialog from '../../../components/erp/PaymentHistoryDialog';
import apiService from '../../../services/api';
import { resolveDefaultPaymentAccountId } from '../../../constants/paymentAccounts';

const CATEGORY_FILTER = [
  { value: '', label: 'All categories' },
  { value: 'work_orders', label: 'Work orders' },
  { value: 'travel', label: 'Travel' },
  { value: 'utility', label: 'Utility' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'professional', label: 'Professional services' },
  { value: 'other', label: 'Other' },
];

const linkLabel = (ex) => {
  if (ex.reference === 'manual') return 'Manual';
  if (ex.reference === 'work_order' && ex.reference_id) {
    return `Work order #${ex.reference_id}`;
  }
  return '—';
};

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAY_STATUS_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };

const ExpensesList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payRow, setPayRow] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payPaidAt, setPayPaidAt] = useState('');
  const [payMethod, setPayMethod] = useState('Bank transfer');
  const [payAccountId, setPayAccountId] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [paySaving, setPaySaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        search: search || undefined,
        category: category || undefined,
      };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const res = await apiService.getAccountsExpenses(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      if (res.success !== false) {
        setRows(list);
        setTotalCount(res.pagination?.totalItems ?? 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, category, dateFrom, dateTo, paymentStatus]);

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setPaymentAccounts(list.filter((a) => !a.is_group && a.is_active));
      }
    });
  }, []);

  const defaultPayAccountId = useMemo(
    () => resolveDefaultPaymentAccountId(paymentAccounts, payMethod),
    [paymentAccounts, payMethod]
  );

  const [payDialogError, setPayDialogError] = useState('');

  const openPayDialog = (ex) => {
    const total = parseFloat(ex.amount) || 0;
    const paid = parseFloat(ex.paid_amount) || 0;
    const due = Math.max(0, total - paid);
    setPayRow(ex);
    setPayAmount(due > 0 ? due.toFixed(2) : '');
    setPayPaidAt(new Date().toISOString().slice(0, 10));
    setPayMethod(ex.payment_method || 'Bank transfer');
    setPayAccountId(resolveDefaultPaymentAccountId(paymentAccounts, ex.payment_method || 'Bank transfer'));
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
      await apiService.patchAccountsExpensePayment(payRow.id, {
        amount: amt,
        paidAt: payPaidAt || undefined,
        paymentMethod: payMethod.trim() || undefined,
        paymentAccountId: payAccountId ? parseInt(payAccountId, 10) : undefined,
      });
      setPayOpen(false);
      setPayRow(null);
      setError('');
      fetchRows();
    } catch (err) {
      setPayDialogError(err.message || 'Payment update failed');
    } finally {
      setPaySaving(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <PageContainer title="Posted expenses" description="Ledger: work order approvals and manual entries">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                  color: 'success.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconWallet size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>
                Posted expenses
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0
                ? `${totalCount} ledger entr${totalCount !== 1 ? 'ies' : 'y'}`
                : 'From work order approvals or Add expense.'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => navigate('/erp/accounts/expenses/create')}
            sx={{ borderRadius: 2 }}
          >
            Add expense
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.default, 0.6),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search category, paid to, reference, notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={16} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(0);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {CATEGORY_FILTER.map((o) => (
                    <MenuItem key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Pay status</InputLabel>
                <Select
                  value={paymentStatus}
                  label="Pay status"
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPage(0);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(v) => {
                  setDateFrom(v);
                  setPage(0);
                }}
                onToChange={(v) => {
                  setDateTo(v);
                  setPage(0);
                }}
                onClear={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(0);
                }}
                helperText="Expense date"
                compact
              />
            </Box>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                    {['Date', 'Category', 'Amount (AED)', 'Settlement', 'Paid to', 'Method', 'Work order', 'Deal', 'Link', ''].map((h, i) => (
                      <TableCell
                        key={h || 'actions'}
                        align={i === 2 || i === 9 ? 'right' : 'left'}
                        sx={{
                          fontWeight: 700,
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <IconWallet size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary" display="block" gutterBottom>
                          No posted expenses yet.
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1 }}>
                          Add a manual entry or approve lines under Accounts → Work orders.
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => navigate('/erp/accounts/expenses/create')}
                          >
                            Add expense
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => navigate('/erp/accounts/work-orders')}
                          >
                            Work orders (Accounts)
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((ex) => {
                      const wo = ex.taskExpense?.workOrderTask?.workOrder;
                      const deal = wo?.deal;
                      const woTitle = wo?.title || (wo?.id ? `WO #${wo.id}` : null);
                      const displayWo = woTitle || (ex.reference === 'manual' ? 'Manual' : '—');
                      const canOpenWo = Boolean(wo?.id);
                      const ps = ex.payment_status || 'unpaid';
                      const totalAmt = parseFloat(ex.amount) || 0;
                      const paidAmt = parseFloat(ex.paid_amount) || 0;
                      const canPay = ps === 'unpaid' || ps === 'partial';
                      return (
                        <TableRow
                          key={ex.id}
                          hover
                          sx={{
                            cursor: canOpenWo ? 'pointer' : 'default',
                            '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.04) },
                          }}
                          onClick={() => canOpenWo && navigate(`/erp/accounts/work-orders/view/${wo.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2">{ex.expense_date || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={String(ex.category || '').replace(/_/g, ' ')}
                              variant="outlined"
                              sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {fmtMoney(ex.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                              <Chip
                                size="small"
                                label={ps}
                                color={PAY_STATUS_COLOR[ps] || 'default'}
                                sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                              />
                              {ps === 'partial' && (
                                <Typography variant="caption" color="text.secondary">
                                  {fmtMoney(paidAmt)} / {fmtMoney(totalAmt)}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {ex.paid_to || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {ex.payment_method || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {displayWo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {deal ? `${deal.deal_number || ''} ${deal.title || ''}`.trim() : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {linkLabel(ex)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" alignItems="center">
                              {(parseFloat(paidAmt) || 0) > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<IconHistory size={14} />}
                                  onClick={() => { setHistoryRow(ex); setHistoryOpen(true); }}
                                  sx={{ borderRadius: 1.5 }}
                                >
                                  History
                                </Button>
                              )}
                              {canPay && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => openPayDialog(ex)}
                                  sx={{ borderRadius: 1.5 }}
                                >
                                  Pay
                                </Button>
                              )}
                              {canOpenWo ? (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  fontWeight={700}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/erp/accounts/work-orders/view/${wo.id}`)}
                                >
                                  Open
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.disabled">
                                  —
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </CardContent>
        </Card>
      </Box>
      <Dialog open={payOpen} onClose={() => !paySaving && (setPayOpen(false), setPayDialogError(''))} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>
          Record payment
          {payRow && (
            <Typography variant="body2" color="text.secondary" fontWeight={400}>
              Expense #{payRow.id} — balance{' '}
              <strong>AED {fmtMoney(Math.max(0, (parseFloat(payRow.amount) || 0) - (parseFloat(payRow.paid_amount) || 0)))}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 320 }}>
            {payDialogError && <Alert severity="error" onClose={() => setPayDialogError('')}>{payDialogError}</Alert>}
            <TextField
              size="small"
              label="Amount (AED)"
              type="number"
              inputProps={{ min: 0.01, step: '0.01' }}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <PaymentRecordingFields
              paymentMethod={payMethod}
              onPaymentMethodChange={setPayMethod}
              paymentAccountId={payAccountId || defaultPayAccountId}
              onPaymentAccountChange={setPayAccountId}
              accounts={paymentAccounts}
              showPaidOn
              paidOn={payPaidAt}
              onPaidOnChange={setPayPaidAt}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setPayOpen(false); setPayDialogError(''); }} disabled={paySaving}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={submitPay} disabled={paySaving}>
            {paySaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentHistoryDialog
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryRow(null); }}
        sourceType="expense"
        sourceId={historyRow?.id}
        title={historyRow ? `${historyRow.category} — ${fmtMoney(historyRow.amount)}` : ''}
      />
    </PageContainer>
  );
};

export default ExpensesList;
