import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, IconButton, Menu, MenuItem, CircularProgress,
  Alert, Stack, Chip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconDotsVertical, IconFileDownload, IconReceipt, IconFileInvoice, IconEye } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLOR = {
  new: 'default', sent: 'info', under_review: 'warning',
  revised: 'primary', approved: 'success', rejected: 'error',
  pending: 'warning', cancelled: 'error',
};

const AccountsPurchaseOrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const canCreatePurchaseBill = hasPermission('accounting.read') && hasPermission('accounting.update');
  const listReturnEnc = encodeURIComponent(`${location.pathname}${location.search || ''}`);
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('approved');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (status !== 'all') params.status = status;
      if (kind === 'client') params.side = 'client';
      if (kind === 'vendor') params.side = 'supplier';
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
  }, [page, rowsPerPage, search, kind, status, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const isApproved = (o) => String(o?.status || '').toLowerCase() === 'approved';
  const isVendor = (o) => Boolean(o?.supplier_id || o?.supplier) && !o?.company_id;
  const partyName = (o) => o.supplier?.company_name || o.company?.company_name || '—';

  const handleDownloadPdf = async (o, documentType) => {
    if (!o?.id) return;
    try {
      setPdfLoading(`${documentType}-${o.id}`);
      await apiService.downloadPurchaseOrderPdf(o.id, { documentType });
      setSuccess('PDF downloaded');
    } catch (err) {
      setError(err.message || 'PDF download failed');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <PageContainer title="Purchase Orders" description="Client and vendor purchase orders">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconFileInvoice size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>Purchase Orders</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" ml={6.5} mb={3}>
          {totalCount > 0 ? `${totalCount} order${totalCount !== 1 ? 's' : ''} (client and vendor)` : 'Client and vendor purchase orders'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search client, vendor or deal..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              <TextField select size="small" label="Status" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="all">All statuses</MenuItem>
              </TextField>
              <ToggleButtonGroup size="small" exclusive value={kind} onChange={(_, v) => { if (v) { setKind(v); setPage(0); } }}>
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="client">Client</ToggleButton>
                <ToggleButton value="vendor">Vendor</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="PO date" compact />
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Type', 'Deal', 'Client / Vendor', 'PO Date', 'Delivery', 'Status', 'Items', ''].map((h, i) => (
                    <TableCell key={i} align={i === 7 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell></TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">No purchase orders found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(o => (
                    <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/purchase-orders/view/${o.id}?return=${listReturnEnc}`)}>
                      <TableCell><Chip label={isVendor(o) ? 'Vendor' : 'Client'} size="small" color={isVendor(o) ? 'secondary' : 'primary'} variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.deal ? (o.deal.title || o.deal.deal_number) : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{partyName(o)}</Typography></TableCell>
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

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedOrder(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 210 } }}>
          <MenuItem onClick={() => { navigate(`/erp/purchase-orders/view/${selectedOrder?.id}?return=${listReturnEnc}`); setAnchorEl(null); }}>
            <IconEye size={16} style={{ marginRight: 10 }} /> View
          </MenuItem>
          {isApproved(selectedOrder) && (
            <MenuItem onClick={() => { handleDownloadPdf(selectedOrder, 'order'); setAnchorEl(null); }} disabled={pdfLoading === `order-${selectedOrder?.id}`}>
              {pdfLoading === `order-${selectedOrder?.id}` ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
              Download purchase order PDF
            </MenuItem>
          )}
          {isApproved(selectedOrder) && canCreatePurchaseBill && (
            <MenuItem onClick={() => { navigate(`/erp/vendor-bills?poId=${selectedOrder?.id}`); setAnchorEl(null); }}>
              <IconReceipt size={16} style={{ marginRight: 10 }} /> Create purchase bill
            </MenuItem>
          )}
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default AccountsPurchaseOrderList;
