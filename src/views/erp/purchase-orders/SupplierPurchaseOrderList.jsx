import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, CircularProgress,
  Alert, Stack, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical,
  IconFileDownload, IconHammer, IconTruck,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';
import { buildBillCreateUrl, getPoSourceWorkOrderBills } from '../../../utils/purchaseBills';

const STATUS_COLOR = {
  new: 'default', sent: 'info', under_review: 'warning',
  revised: 'primary', approved: 'success', rejected: 'error',
  new: 'default', pending: 'warning', cancelled: 'error',
};

const SupplierPurchaseOrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listReturnEnc = encodeURIComponent(`${location.pathname}${location.search || ''}`);
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search, status: 'approved', side: 'supplier' };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getPurchaseOrders(params);
      if (response.success) {
        const rows = Array.isArray(response.data) ? response.data : [];
        setOrders(rows);
        setTotalCount(response.pagination?.totalItems ?? rows.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  const isApproved = (o) => String(o?.status || '').toLowerCase() === 'approved';

  return (
    <PageContainer title="Vendor Purchase Orders" description="Approved vendor POs (moved from Purchase Quotations)">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTruck size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Vendor Purchase Orders</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} order${totalCount !== 1 ? 's' : ''}` : 'Approved POs to vendors'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/purchase-orders/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Order
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search supplier or deal..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="PO date" compact />
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
                  {['Deal', 'Supplier', 'PO Date', 'Delivery', 'Status', 'Items', ''].map((h, i) => (
                    <TableCell key={i} align={i === 6 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} /></TableCell></TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <IconTruck size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No supplier purchase orders found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(o => (
                    <TableRow key={o.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.02) } }} onClick={() => navigate(`/erp/purchase-orders/view/${o.id}?return=${listReturnEnc}`)}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.deal ? (o.deal.title || o.deal.deal_number) : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{o.supplier?.company_name || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{o.po_date || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{o.expected_delivery || '—'}</Typography></TableCell>
                      <TableCell><Chip label={o.status || '—'} size="small" color={STATUS_COLOR[o.status] || 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{o.items?.length || 0}</Typography></TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedOrder(o); }} sx={{ borderRadius: 1.5 }}>
                          <IconDotsVertical size={15} />
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
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Card>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete Purchase Order</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete this purchase order?</DialogContentText></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedOrder(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 210 } }}>
          <MenuItem onClick={() => { navigate(`/erp/purchase-orders/edit/${selectedOrder?.id}`); setAnchorEl(null); }}>
            <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { handleDownloadPdf(selectedOrder); setAnchorEl(null); }} disabled={pdfLoading === selectedOrder?.id}>
            {pdfLoading === selectedOrder?.id ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
            {isApproved(selectedOrder) ? 'Download purchase order PDF' : 'Download quotation PDF'}
          </MenuItem>
          {isApproved(selectedOrder) && (
            (selectedOrder?.sourceWorkOrder || selectedOrder?.source_work_order)?.id ? (
              <MenuItem onClick={() => { navigate(`/erp/work-orders/view/${(selectedOrder.sourceWorkOrder || selectedOrder.source_work_order).id}`); setAnchorEl(null); }}>
                <IconHammer size={16} style={{ marginRight: 10 }} /> Open Work Order
              </MenuItem>
            ) : (
              <MenuItem onClick={() => { navigate(`/erp/work-orders/create?purchaseOrderId=${selectedOrder?.id}${selectedOrder?.deal?.id ? `&dealId=${selectedOrder.deal.id}` : ''}`); setAnchorEl(null); }}>
                <IconHammer size={16} style={{ marginRight: 10 }} /> Create Work Order
              </MenuItem>
            )
          )}
          {(() => {
            const wo = selectedOrder?.sourceWorkOrder || selectedOrder?.source_work_order;
            const supplierId = selectedOrder?.supplier_id || selectedOrder?.deal?.supplier_id;
            const { vendorBill } = getPoSourceWorkOrderBills(selectedOrder);
            if (!wo || wo.status !== 'completed' || !supplierId) return null;
            if (vendorBill?.id) {
              return (
                <>
                  <MenuItem onClick={() => { navigate(`/erp/purchase-orders/edit/${vendorBill.id}?bill=1`); setAnchorEl(null); }}>
                    <IconShoppingCart size={16} style={{ marginRight: 10 }} /> Open Vendor Purchase Bill
                  </MenuItem>
                  <MenuItem onClick={() => { handleDownloadPdf(vendorBill); setAnchorEl(null); }} disabled={pdfLoading === vendorBill.id}>
                    {pdfLoading === vendorBill.id ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
                    Download vendor purchase bill PDF
                  </MenuItem>
                </>
              );
            }
            return (
              <MenuItem onClick={() => {
                navigate(buildBillCreateUrl({
                  dealId: selectedOrder?.deal?.id || selectedOrder?.deal_id,
                  workOrderId: wo.id,
                  supplierId,
                }));
                setAnchorEl(null);
              }}>
                <IconShoppingCart size={16} style={{ marginRight: 10 }} /> Create Vendor Purchase Bill
              </MenuItem>
            );
          })()}
          <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default SupplierPurchaseOrderList;
