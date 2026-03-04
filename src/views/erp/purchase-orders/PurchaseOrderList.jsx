import React, { useEffect, useState, useCallback } from 'react';
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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      const response = await apiService.getPurchaseOrders(params);
      if (response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleMenuOpen = (e, o) => {
    setAnchorEl(e.currentTarget);
    setSelectedOrder(o);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await apiService.deletePurchaseOrder(selectedOrder.id);
      setSuccess('Purchase order deleted');
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <PageContainer title="Purchase Orders" description="Manage purchase orders">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={600} mb={0.5}>
              Purchase Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage purchase orders from vendors
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/purchase-orders/create')} size="large">
            Add Purchase Order
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <TextField
                placeholder="Search by vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ maxWidth: 320 }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Vendor / Supplier</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Expected Delivery</strong></TableCell>
                    <TableCell><strong>Items</strong></TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }} color="text.secondary">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o) => (
                      <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/purchase-orders/edit/${o.id}`)}>
                        <TableCell>{o.supplier?.company_name || '-'}</TableCell>
                        <TableCell>{o.po_date || '-'}</TableCell>
                        <TableCell>{o.expected_delivery || '-'}</TableCell>
                        <TableCell>{o.items?.length || 0} item(s)</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, o)}>
                            <IconDotsVertical size={18} />
                          </IconButton>
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
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Purchase Order</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this purchase order?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { navigate(`/erp/purchase-orders/edit/${selectedOrder?.id}`); handleMenuClose(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <IconTrash size={18} style={{ marginRight: 8 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default PurchaseOrderList;
