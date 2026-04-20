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
  Button,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconHammer, IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const WO_STATUS_COLORS = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const taskCount = (wo) => (Array.isArray(wo.tasks) ? wo.tasks.length : 0);

const AccountsWorkOrderList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await apiService.getAccountsWorkOrders(params);
      if (res.success) {
        setWorkOrders(Array.isArray(res.data) ? res.data : []);
        setTotalCount(res.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  return (
    <PageContainer title="Work orders (Accounts)" description="Review work orders and approve task expenses">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconHammer size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Work orders (Accounts)</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0
                ? `${totalCount} work order${totalCount !== 1 ? 's' : ''} — open one to review expense lines.`
                : 'Same data as Operations; approve or reject each structured expense line for the ledger.'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" gap={1}>
              <TextField
                size="small"
                placeholder="Search by work order title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value || 'all'} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                    {['Work order', 'Deal', 'Tasks', 'Status', ''].map((h, i) => (
                      <TableCell key={h} align={i === 4 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : workOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <IconHammer size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary" display="block" gutterBottom>
                          No work orders match your filters.
                        </Typography>
                        <Button size="small" variant="outlined" sx={{ borderRadius: 2, mt: 1 }} onClick={() => navigate('/erp/work-orders')}>
                          Open Operations work orders
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrders.map((wo) => (
                      <TableRow
                        key={wo.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.04) } }}
                        onClick={() => navigate(`/erp/accounts/work-orders/view/${wo.id}`)}
                      >
                        <TableCell><Typography fontWeight={600}>{wo.title || `WO #${wo.id}`}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{wo.deal?.title || wo.deal?.deal_number || '—'}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{taskCount(wo)}</Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Chip
                            size="small"
                            label={(wo.status || '—').replace(/_/g, ' ')}
                            color={WO_STATUS_COLORS[wo.status] || 'default'}
                            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Review expenses">
                            <IconButton size="small" sx={{ borderRadius: 1.5 }} onClick={() => navigate(`/erp/accounts/work-orders/view/${wo.id}`)}>
                              <IconChevronRight size={18} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
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
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default AccountsWorkOrderList;
