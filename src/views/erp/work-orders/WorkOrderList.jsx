import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconPlus, IconHammer } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { WorkOrderRow } from './WorkOrderExpandableRows';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const WorkOrderList = () => {
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
      const res = await apiService.getWorkOrders(params);
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

  useEffect(() => { fetchWorkOrders(); }, [fetchWorkOrders]);

  const handleDelete = async (wo) => {
    try {
      await apiService.deleteWorkOrder(wo.id);
      fetchWorkOrders();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleStatusUpdated = (woId, newStatus) => {
    setWorkOrders(prev => prev.map(w => w.id === woId ? { ...w, status: newStatus } : w));
  };

  return (
    <PageContainer title="Work Orders" description="Manage work orders">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconHammer size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Work Orders</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} work order${totalCount !== 1 ? 's' : ''}` : 'Manage operations work orders across deals'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/work-orders/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            New Work Order
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search work orders..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Status" sx={{ borderRadius: 2 }}>
                  {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                    <TableCell sx={{ width: 40 }} />
                    {['Title / Deal', 'Status', 'Tasks', 'Created By', 'Date', ''].map((h, i) => (
                      <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : workOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <IconHammer size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary">No work orders found</Typography>
                        <Button size="small" variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={() => navigate('/erp/work-orders/create')}>Create first work order</Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrders.map(wo => (
                      <WorkOrderRow
                        key={wo.id}
                        wo={wo}
                        onDelete={handleDelete}
                        onStatusUpdated={handleStatusUpdated}
                        onError={(msg) => setError(msg)}
                      />
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
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default WorkOrderList;
