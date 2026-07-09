import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Popover,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconPlus, IconTrash, IconDotsVertical, IconFileDownload, IconHammer, IconReceipt, IconCheck, IconFileInvoice, IconEye } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import QuotationVersionBadge from '../../../components/erp/QuotationVersionBadge';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { shouldHideDealFinancials, canCreateWorkOrder, canGenerateInvoice } from '../../../utils/authHelpers';
import { quotationVersionLabel } from '../../../utils/quotationVersion';

const STATUS_COLOR = {
  new: 'default',
  sent: 'info',
  under_review: 'warning',
  revised: 'primary',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
  cancelled: 'error',
};

const QUOTATION_STATUSES = [
  { value: 'new', label: 'New', color: 'default' },
  { value: 'sent', label: 'Sent', color: 'info' },
  { value: 'under_review', label: 'Under Review', color: 'warning' },
  { value: 'revised', label: 'Revised', color: 'primary' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
];

const QUOTATION_PICKER_STATUSES = ['new', 'sent', 'under_review', 'revised', 'rejected'];

const InlineStatusPicker = ({ quotation, statusLabel: statusLabelFn, onUpdated, onError, readOnly = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [saving, setSaving] = useState(false);

  const current = QUOTATION_STATUSES.find(s => s.value === quotation.status);
  const label = current?.label || statusLabelFn(quotation.status) || quotation.status || '—';
  const color = STATUS_COLOR[quotation.status] || 'default';

  const handleChipClick = (e) => {
    if (readOnly) return;
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleSelect = async (status) => {
    setAnchorEl(null);
    if (status === quotation.status) return;
    setSaving(true);
    try {
      await apiService.updateQuotation(quotation.id, { status });
      onUpdated(quotation.id, status);
    } catch (err) {
      onError(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Chip
        label={saving ? <CircularProgress size={12} color="inherit" /> : label}
        size="small"
        color={color}
        onClick={readOnly ? undefined : handleChipClick}
        sx={{ fontWeight: 600, cursor: readOnly ? 'default' : 'pointer', '&:hover': readOnly ? {} : { opacity: 0.85 } }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onClick={e => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, py: 0.5, boxShadow: theme.shadows[8] } }}
      >
        {(quotation.status === 'pending_approval'
          ? [{ value: 'pending_approval', label: 'Pending Approval', color: 'warning' }, { value: 'rejected', label: 'Rejected', color: 'error' }]
          : QUOTATION_PICKER_STATUSES.map((v) => QUOTATION_STATUSES.find((s) => s.value === v)).filter(Boolean)
        ).map((s) => {
          const isCurrent = s.value === quotation.status;
          return (
            <MenuItem
              key={s.value}
              onClick={() => !isCurrent && handleSelect(s.value)}
              selected={isCurrent}
              disabled={isCurrent}
              sx={{ fontSize: '0.85rem', py: 0.75, gap: 1 }}
            >
              <Chip label={s.label} size="small" color={s.color} sx={{ fontWeight: 600, pointerEvents: 'none', minWidth: 100 }} />
              {isCurrent && <IconCheck size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </MenuItem>
          );
        })}
      </Popover>
    </>
  );
};

const QuotationList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const viewOnly = shouldHideDealFinancials(user);
  const canGenerateInvoiceFlag = canGenerateInvoice(user);
  const canCreateWorkOrderFlag = canCreateWorkOrder(user, hasPermission);
  const isOrdersView = location.pathname.includes('/service-orders');
  const tableHeaders = ['Deal', 'Ver.', 'Prepared By', 'Date', 'Items', ...(viewOnly ? [] : ['Amount (AED)']), 'Status', ''];
  const listReturnEnc = encodeURIComponent(`${location.pathname}${location.search || ''}`);
  const theme = useTheme();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({ quotationStatus: [] });
  const [pdfLoading, setPdfLoading] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await apiService.getAllDropdowns();
      if (res.success) setDropdowns({ quotationStatus: res.data.quotation_status || [] });
    } catch (err) { console.error(err); }
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (isOrdersView) {
        params.status = 'approved';
      } else if (statusFilter) {
        params.status = statusFilter;
      } else {
        params.statusNot = 'approved';
      }
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getQuotations(params);
      if (response.success) {
        setQuotations(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, dateFrom, dateTo, isOrdersView]);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);
  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const handleDownloadPdf = async (q, documentType) => {
    if (!q?.id) return;
    const loadKey = documentType ? `${documentType}-${q.id}` : String(q.id);
    try {
      setPdfLoading(loadKey);
      await apiService.downloadQuotationPdf(q.id, documentType ? { documentType } : {});
      setSuccess('PDF downloaded');
    } catch (err) {
      setError(err.message || 'PDF download failed');
    } finally {
      setPdfLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuotation) return;
    try {
      await apiService.deleteQuotation(selectedQuotation.id);
      setSuccess('Quotation deleted');
      setDeleteDialogOpen(false);
      setSelectedQuotation(null);
      fetchQuotations();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const statusLabel = (v) => dropdowns.quotationStatus.find(s => s.value === v)?.display_name || v;

  const handleStatusUpdated = (quotationId, newStatus) => {
    setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: newStatus } : q));
    setSuccess('Status updated');
  };
  const isApproved = (q) => String(q?.status || '').toLowerCase() === 'approved';

  const pageTitle = isOrdersView ? 'Clients Service Orders' : 'Service Quotations';
  const pageDesc = isOrdersView
    ? 'Approved quotations; export as service order PDF'
    : 'Drafts and pending quotations; approve to move to Clients Service Orders';

  return (
    <PageContainer title={pageTitle} description={pageDesc}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconReceipt size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>{pageTitle}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} record${totalCount !== 1 ? 's' : ''}` : pageDesc}
            </Typography>
          </Box>
          {!isOrdersView && !viewOnly && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/quotations/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
              Add Quotation
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search by deal title..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              {!isOrdersView && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Status" sx={{ borderRadius: 2 }}>
                    <MenuItem value="">All (excl. approved)</MenuItem>
                    {dropdowns.quotationStatus.filter(s => s.value !== 'approved').map(s => <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Quotation date" compact />
            </Box>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {tableHeaders.map((h, i) => (
                      <TableCell key={i} align={h === 'Amount (AED)' ? 'right' : i === tableHeaders.length - 1 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : quotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 8 }}>
                        <IconReceipt size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary">{isOrdersView ? 'No approved service orders yet' : 'No quotations found'}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotations.map(q => (
                      <TableRow key={q.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }} onClick={() => navigate(`/erp/quotations/view/${q.id}?return=${listReturnEnc}`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{q.deal?.title || q.deal?.deal_number || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          {quotationVersionLabel(q) ? (
                            <QuotationVersionBadge quotation={q} variant="pill" />
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{q.preparedByUser ? `${q.preparedByUser.first_name || ''} ${q.preparedByUser.last_name || ''}`.trim() : '—'}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{q.quotation_date || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{q.deal?.items?.length ?? 0}</Typography></TableCell>
                        {!viewOnly && (
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{parseFloat(q.quotation_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                          </TableCell>
                        )}
                        <TableCell onClick={e => e.stopPropagation()}>
                          <InlineStatusPicker quotation={q} statusLabel={statusLabel} onUpdated={handleStatusUpdated} onError={setError} readOnly />
                        </TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedQuotation(q); }} sx={{ borderRadius: 1.5 }}>
                            <IconDotsVertical size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete Quotation</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete this quotation?</DialogContentText></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedQuotation(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}>
          <MenuItem onClick={() => { navigate(`/erp/quotations/view/${selectedQuotation?.id}?return=${listReturnEnc}`); setAnchorEl(null); }}>
            <IconEye size={16} style={{ marginRight: 10 }} /> View
          </MenuItem>
          {!viewOnly && canGenerateInvoiceFlag && selectedQuotation?.deal?.deal_type !== 'free_of_charge' && (
            <MenuItem onClick={() => { navigate(`/erp/proforma-invoices/create/${selectedQuotation?.id}?return=${listReturnEnc}`); setAnchorEl(null); }}>
              <IconFileInvoice size={16} style={{ marginRight: 10 }} /> Create proforma invoice
            </MenuItem>
          )}
          {!viewOnly && isApproved(selectedQuotation) && (
            <>
              <MenuItem onClick={() => { handleDownloadPdf(selectedQuotation, 'order'); setAnchorEl(null); }} disabled={pdfLoading === `order-${selectedQuotation?.id}`}>
                {pdfLoading === `order-${selectedQuotation?.id}` ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
                Download service order PDF
              </MenuItem>
              <MenuItem onClick={() => { handleDownloadPdf(selectedQuotation, 'quotation'); setAnchorEl(null); }} disabled={pdfLoading === `quotation-${selectedQuotation?.id}`}>
                {pdfLoading === `quotation-${selectedQuotation?.id}` ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
                Download quotation PDF
              </MenuItem>
            </>
          )}
          {!viewOnly && !isApproved(selectedQuotation) && (
            <MenuItem onClick={() => { handleDownloadPdf(selectedQuotation); setAnchorEl(null); }} disabled={pdfLoading === String(selectedQuotation?.id)}>
              {pdfLoading === String(selectedQuotation?.id) ? <CircularProgress size={16} sx={{ mr: 1.25 }} /> : <IconFileDownload size={16} style={{ marginRight: 10 }} />}
              Download quotation PDF
            </MenuItem>
          )}
          {isApproved(selectedQuotation) && (selectedQuotation?.workOrder || selectedQuotation?.work_order)?.id && (
            <MenuItem onClick={() => { navigate(`/erp/work-orders/view/${(selectedQuotation.workOrder || selectedQuotation.work_order).id}`); setAnchorEl(null); }}>
              <IconHammer size={16} style={{ marginRight: 10 }} /> Open Work Order
            </MenuItem>
          )}
          {isApproved(selectedQuotation) && canCreateWorkOrderFlag && !(selectedQuotation?.workOrder || selectedQuotation?.work_order)?.id && (
            <MenuItem onClick={() => { navigate(`/erp/work-orders/create?quotationId=${selectedQuotation?.id}${selectedQuotation?.deal?.id ? `&dealId=${selectedQuotation.deal.id}` : ''}`); setAnchorEl(null); }}>
              <IconHammer size={16} style={{ marginRight: 10 }} /> Create Work Order
            </MenuItem>
          )}
          {!viewOnly && (
            <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
              <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
            </MenuItem>
          )}
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default QuotationList;
