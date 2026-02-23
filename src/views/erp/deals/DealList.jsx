import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconCurrencyDollar, IconEye } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    pending: 'warning',
    approved: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

const getPaymentStatusColor = (status) => {
  const colors = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
  return colors[status] || 'default';
};

const DealList = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    fetchDeals();
  }, [page, search]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getDeals({ page, pageSize, search });
      if (response.success) {
        setDeals(response.data || []);
        setTotalPages(Math.ceil((response.pagination?.totalItems || 0) / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!dealToDelete) return;
    try {
      await apiService.deleteDeal(dealToDelete.id);
      setSuccess('Deal deleted successfully');
      setDeleteDialogOpen(false);
      setDealToDelete(null);
      fetchDeals();
    } catch (err) {
      setError(err.message || 'Failed to delete deal');
    }
  };

  const openDeleteDialog = (deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  return (
    <PageContainer title="Deals" description="Manage all deals">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" fontWeight={700}>Deals</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage all business deals and transactions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => navigate('/erp/deals/create')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Create Deal
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              placeholder="Search deals by title, number, or description..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Deal #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" color="text.secondary">
                        No deals found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map((deal) => (
                    <TableRow key={deal.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {deal.deal_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{deal.title}</Typography>
                        {deal.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {deal.description.substring(0, 50)}{deal.description.length > 50 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{deal.company?.company_name || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {deal.currency} {Number(deal.total).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Subtotal: {Number(deal.subtotal).toFixed(2)} + VAT: {Number(deal.vat_amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={deal.status?.replace('_', ' ')} 
                          size="small" 
                          color={getStatusColor(deal.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={deal.payment_status?.replace('_', ' ')} 
                          size="small" 
                          color={getPaymentStatusColor(deal.payment_status)}
                        />
                        {deal.payment_status === 'partial' && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Paid: {Number(deal.paid_amount).toFixed(2)} / {Number(deal.total).toFixed(2)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                          title="View"
                        >
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/erp/deals/edit/${deal.id}`)}
                          title="Edit"
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(deal)}
                          title="Delete"
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Card>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete deal "{dealToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DealList;
