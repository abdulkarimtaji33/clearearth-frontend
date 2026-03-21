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
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical, IconFileDownload } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
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
  const [pdfLoading, setPdfLoading] = useState(null);
  const [dropdowns, setDropdowns] = useState({ purchaseOrderStatus: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await apiService.getAllDropdowns();
      if (res.success) setDropdowns({ purchaseOrderStatus: res.data.purchase_order_status || [] });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
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
  }, [page, rowsPerPage, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

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

  const handleDownloadPdf = async (o) => {
    if (!o?.id) return;
    try {
      setPdfLoading(o.id);
      await apiService.downloadPurchaseOrderPdf(o.id);
      setSuccess('PDF downloaded');
    } catch (err) {
      setError(err.message || 'PDF download failed');
    } finally {
      setPdfLoading(null);
    }
  };

  const statusLabel = (v) => dropdowns.purchaseOrderStatus.find((s) => s.value === v)?.display_name || v;

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await apiService.deletePurchaseOrder(selectedOrder.id);
      setSuccess('Purchase quotation deleted');
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <PageContainer title="Purchase Quotations" description="Quotations to vendors; approved records export as purchase order PDF">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={600} mb={0.5}>
              Purchase Quotations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status Approved → download is a purchase order PDF
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/purchase-orders/create')} size="large">
            Add Purchase Quotation
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 160 }}
                SelectProps={{ native: true }}
              >
                <option value="">All</option>
                {dropdowns.purchaseOrderStatus.map((s) => (
                  <option key={s.id} value={s.value}>{s.display_name}</option>
                ))}
              </TextField>
            </Box>

            <Box sx={{ mb: 2 }}>
              <ListDateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(v) => { setDateFrom(v); setPage(0); }}
                onToChange={(v) => { setDateTo(v); setPage(0); }}
                onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                helperText="PO date"
                compact
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Deal</strong></TableCell>
                    <TableCell><strong>Vendor / Supplier</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Expected Delivery</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Items</strong></TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }} color="text.secondary">
                        No purchase quotations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o) => (
                      <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/purchase-orders/edit/${o.id}`)}>
                        <TableCell>{o.deal ? (o.deal.title || o.deal.deal_number) : '-'}</TableCell>
                        <TableCell>{o.supplier?.company_name || '-'}</TableCell>
                        <TableCell>{o.po_date || '-'}</TableCell>
                        <TableCell>{o.expected_delivery || '-'}</TableCell>
                        <TableCell>{statusLabel(o.status)}</TableCell>
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
          <DialogTitle>Delete Purchase Quotation</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this purchase quotation?</DialogContentText>
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
          <MenuItem onClick={() => { handleDownloadPdf(selectedOrder); handleMenuClose(); }} disabled={pdfLoading === selectedOrder?.id}>
            {pdfLoading === selectedOrder?.id ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <IconFileDownload size={18} style={{ marginRight: 8 }} />}
            {String(selectedOrder?.status || '').toLowerCase() === 'approved' ? 'Download purchase order PDF' : 'Download purchase quotation PDF'}
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
