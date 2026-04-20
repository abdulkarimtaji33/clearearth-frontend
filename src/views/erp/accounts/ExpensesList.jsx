import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconWallet, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

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
  }, [page, rowsPerPage, search, category, dateFrom, dateTo]);

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
                    {['Date', 'Category', 'Amount (AED)', 'Paid to', 'Payment', 'Work order', 'Deal', 'Link', ''].map((h, i) => (
                      <TableCell
                        key={h}
                        align={i === 2 || i === 8 ? 'right' : 'left'}
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
                      <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
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
    </PageContainer>
  );
};

export default ExpensesList;
