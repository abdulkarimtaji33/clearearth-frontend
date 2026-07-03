import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Autocomplete,
  Menu,
  MenuItem as MenuItemMui,
  Tooltip,
  Popover,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconEye, IconFilterOff, IconFilter, IconChevronDown, IconChevronUp, IconDotsVertical, IconBriefcase, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canDirectManagerApprove } from '../../../utils/recordStatus';
import { shouldHideDealFinancials, canViewDealDetails } from '../../../utils/authHelpers';

const STATUS_CONFIG = {
  new:            { label: 'New',            color: 'default' },
  pending_approval: { label: 'Pending Approval', color: 'warning' },
  approved:       { label: 'Approved',       color: 'info' },
  quotation_sent: { label: 'Quotation Sent', color: 'primary' },
  negotiation:    { label: 'Negotiation',    color: 'warning' },
  won:            { label: 'Won',            color: 'success' },
  lost:           { label: 'Lost',           color: 'error' },
  // legacy
  pending:        { label: 'Pending',        color: 'warning' },
  in_progress:    { label: 'In Progress',    color: 'primary' },
  completed:      { label: 'Completed',      color: 'success' },
  cancelled:      { label: 'Cancelled',      color: 'error' },
};

const DEAL_STATUSES = ['new', 'pending_approval', 'approved', 'quotation_sent', 'negotiation', 'won', 'lost'];
const DEAL_APPROVABLE_STATUSES = ['new', 'pending_approval'];
const DEAL_PICKER_STATUSES = ['new', 'quotation_sent', 'negotiation', 'won', 'lost'];

const PAYMENT_CONFIG = {
  unpaid:  { label: 'Unpaid',   color: 'error' },
  partial: { label: 'Partial',  color: 'warning' },
  paid:    { label: 'Paid',     color: 'success' },
};

const INSPECTION_STATUS_CONFIG = {
  request_submitted:    { label: 'Request Submitted',    color: 'default' },
  team_assigned:        { label: 'Team Assigned',        color: 'info' },
  inspection_completed: { label: 'Inspection Completed', color: 'warning' },
  report_submitted:     { label: 'Report Submitted',     color: 'success' },
};

const getInspectionBadge = (deal) => {
  if (!deal.inspection_required) return null;
  const req = deal.inspectionRequest || deal.inspection_request;
  const report = deal.inspectionReport || deal.inspection_report;

  if (report?.id) {
    return INSPECTION_STATUS_CONFIG.report_submitted;
  }

  if (!req) return { label: 'Pending Inspection', color: 'warning' };

  const responseStatus = req.response_status || 'pending';

  if (responseStatus === 'rejected') {
    return { label: 'Rejected', color: 'error' };
  }

  if (req.status === 'report_submitted' || req.status === 'inspection_completed') {
    return INSPECTION_STATUS_CONFIG[req.status];
  }

  if (responseStatus === 'accepted') {
    if (req.status === 'team_assigned') return INSPECTION_STATUS_CONFIG.team_assigned;
    return { label: 'Accepted', color: 'success' };
  }

  if (req.status && INSPECTION_STATUS_CONFIG[req.status]) {
    return INSPECTION_STATUS_CONFIG[req.status];
  }

  return { label: 'Pending Review', color: 'warning' };
};

const StatusChip = ({ value, config }) => {
  const cfg = config[value] || { label: value || '—', color: 'default' };
  return <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />;
};

const InlineStatusPicker = ({ deal, onUpdated, onError, readOnly = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const pendingStatus = useRef(null);

  const cfg = STATUS_CONFIG[deal.status] || { label: deal.status || '—', color: 'default' };

  const handleChipClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleSelect = async (status) => {
    setAnchorEl(null);
    if (status === deal.status) return;
    if (status === 'lost') {
      pendingStatus.current = status;
      setLossReason('');
      setLossDialogOpen(true);
      return;
    }
    await doUpdate(status, null);
  };

  const doUpdate = async (status, lossReasonVal) => {
    setSaving(true);
    try {
      const payload = { status };
      if (lossReasonVal !== null) payload.lossReason = lossReasonVal;
      await apiService.updateDeal(deal.id, payload);
      onUpdated(deal.id, status, lossReasonVal);
    } catch (err) {
      onError(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleLossConfirm = async () => {
    setLossDialogOpen(false);
    await doUpdate('lost', lossReason);
  };

  if (readOnly) {
    return <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600 }} />;
  }

  return (
    <>
      <Chip
        label={saving ? <CircularProgress size={12} color="inherit" /> : cfg.label}
        size="small"
        color={cfg.color}
        onClick={handleChipClick}
        sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
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
        {(deal.status === 'pending_approval' ? ['pending_approval', 'lost'] : DEAL_PICKER_STATUSES).map(s => {
          const c = STATUS_CONFIG[s] || { label: s, color: 'default' };
          const isCurrent = s === deal.status;
          return (
            <MenuItemMui
              key={s}
              onClick={() => !isCurrent && handleSelect(s)}
              selected={isCurrent}
              disabled={isCurrent}
              sx={{ fontSize: '0.85rem', py: 0.75, gap: 1 }}
            >
              <Chip label={c.label} size="small" color={c.color} sx={{ fontWeight: 600, pointerEvents: 'none', minWidth: 100 }} />
              {isCurrent && <IconCheck size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </MenuItemMui>
          );
        })}
      </Popover>

      <Dialog open={lossDialogOpen} onClose={() => setLossDialogOpen(false)} onClick={e => e.stopPropagation()} PaperProps={{ sx: { borderRadius: 3 } }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Mark as Lost</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Optionally provide a reason for losing this deal.</DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason for loss"
            value={lossReason}
            onChange={e => setLossReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setLossDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleLossConfirm} color="error" variant="contained" sx={{ borderRadius: 2 }}>Confirm Lost</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const DealList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, hasPermission } = useAuth();
  const hideDealAmounts = shouldHideDealFinancials(user, hasPermission);
  const allowDealDetails = canViewDealDetails(user, hasPermission);
  const canEditDeals = hasPermission('deals.update.own') || hasPermission('deals.update.all');
  const canDirectApprove = canDirectManagerApprove(user);
  const tableColSpan = hideDealAmounts ? 6 : 7;
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState(null);
  const [contactFilter, setContactFilter] = useState(null);
  const [assignedToFilter, setAssignedToFilter] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalTargetId, setApprovalTargetId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [approvingDealId, setApprovingDealId] = useState(null);

  const pageSize = 10;

  useEffect(() => { fetchDeals(); }, [page, search, statusFilter, paymentStatusFilter, companyFilter, contactFilter, assignedToFilter, productFilter, minAmountFilter, maxAmountFilter, dateFrom, dateTo]);
  useEffect(() => { fetchRelatedData(); }, []);
  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, []);

  const fetchRelatedData = async () => {
    const results = await Promise.allSettled([
      apiService.getCompanies({ pageSize: 500 }),
      apiService.getContacts({ pageSize: 500 }),
      apiService.getAssignees(),
      apiService.getProducts({ pageSize: 500 }),
    ]);
    const [companiesRes, contactsRes, usersRes, productsRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);
    if (companiesRes?.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.items || []);
    if (contactsRes?.success) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : contactsRes.data?.items || []);
    if (usersRes?.success) setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
    if (productsRes?.success) setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || []);
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, pageSize, search };
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (companyFilter) params.companyId = companyFilter.id;
      if (contactFilter) params.contactId = contactFilter.id;
      if (assignedToFilter) params.assignedTo = assignedToFilter.id;
      if (productFilter) params.productServiceId = productFilter.id;
      if (minAmountFilter) params.minAmount = minAmountFilter;
      if (maxAmountFilter) params.maxAmount = maxAmountFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getDeals(params);
      if (response.success) {
        setDeals(response.data || []);
        const total = response.pagination?.totalItems || 0;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch(''); setStatusFilter(''); setPaymentStatusFilter('');
    setCompanyFilter(null); setContactFilter(null); setAssignedToFilter(null);
    setProductFilter(null); setMinAmountFilter(''); setMaxAmountFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const handleDelete = async () => {
    if (!dealToDelete) return;
    try {
      await apiService.deleteDeal(dealToDelete.id);
      setSuccess('Deal deleted');
      setDeleteDialogOpen(false);
      setDealToDelete(null);
      fetchDeals();
    } catch (err) {
      setError(err.message || 'Failed to delete deal');
    }
  };

  const hasFilters = search || statusFilter || paymentStatusFilter || companyFilter || contactFilter || assignedToFilter || productFilter || minAmountFilter || maxAmountFilter || dateFrom || dateTo;

  const handleStatusUpdated = (dealId, newStatus, lossReason) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus, loss_reason: lossReason ?? d.loss_reason } : d));
    setSuccess('Status updated');
  };

  const closeApprovalDialog = () => {
    setApprovalDialogOpen(false);
    setApprovalTargetId(null);
    setApprovalError('');
  };

  const handleApproveDeal = async (dealId) => {
    if (!dealId) return;
    setError('');
    if (canDirectApprove) {
      try {
        setApprovingDealId(dealId);
        await apiService.approveDeal(dealId);
        setSuccess('Deal approved');
        fetchDeals();
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('approval PIN') || msg.includes('manager can approve')) {
          setApprovalTargetId(dealId);
          setApprovalError('');
          setApprovalDialogOpen(true);
        } else {
          setError(msg || 'Failed to approve deal');
        }
      } finally {
        setApprovingDealId(null);
      }
      return;
    }
    setApprovalTargetId(dealId);
    setApprovalError('');
    setApprovalDialogOpen(true);
  };

  const handleRequestDealApproval = async () => {
    if (!approvalTargetId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestDealApproval(approvalTargetId);
      setSuccess('Approval requested. Your manager has been notified.');
      closeApprovalDialog();
      fetchDeals();
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveDealWithPin = async (pin) => {
    if (!approvalTargetId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveDealWithPin(approvalTargetId, pin);
      setSuccess('Deal approved');
      closeApprovalDialog();
      fetchDeals();
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <PageContainer title="Deals" description="Manage all deals">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBriefcase size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Deals</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalItems > 0 ? `${totalItems} deal${totalItems !== 1 ? 's' : ''} total` : 'Manage all business deals'}
            </Typography>
          </Box>
          {canEditDeals && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/deals/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
              New Deal
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Filter bar */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search deals..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
                  sx: { borderRadius: 2 },
                }}
                sx={{ minWidth: 260, flex: 1 }}
              />
              <Button
                variant={filtersExpanded ? 'contained' : 'outlined'}
                color={hasFilters ? 'primary' : 'inherit'}
                startIcon={<IconFilter size={16} />}
                endIcon={filtersExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                onClick={() => setFiltersExpanded(v => !v)}
                size="small"
                sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Filters{hasFilters ? ' •' : ''}
              </Button>
              {hasFilters && (
                <Tooltip title="Clear all filters">
                  <IconButton size="small" onClick={handleClearFilters} sx={{ color: 'error.main' }}>
                    <IconFilterOff size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Collapse in={filtersExpanded}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} label="Status" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {Object.entries(STATUS_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment</InputLabel>
                      <Select value={paymentStatusFilter} onChange={e => { setPaymentStatusFilter(e.target.value); setPage(1); }} label="Payment" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {Object.entries(PAYMENT_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <Autocomplete size="small" options={companies} getOptionLabel={o => o.company_name || ''} value={companyFilter} onChange={(_, v) => { setCompanyFilter(v); setPage(1); }} renderInput={p => <TextField {...p} label="Company" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />} isOptionEqualToValue={(o, v) => o.id === v?.id} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <Autocomplete size="small" options={users} getOptionLabel={o => `${o.first_name || ''} ${o.last_name || ''}`.trim() || '-'} value={assignedToFilter} onChange={(_, v) => { setAssignedToFilter(v); setPage(1); }} renderInput={p => <TextField {...p} label="Assigned To" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />} isOptionEqualToValue={(o, v) => o.id === v?.id} />
                  </Grid>
                  {!hideDealAmounts && (
                  <>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" label="Min Amount" type="number" value={minAmountFilter} onChange={e => { setMinAmountFilter(e.target.value); setPage(1); }} inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" label="Max Amount" type="number" value={maxAmountFilter} onChange={e => { setMaxAmountFilter(e.target.value); setPage(1); }} inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  </>
                  )}
                  <Grid size={12}>
                    <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(1); }} onToChange={v => { setDateTo(v); setPage(1); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }} helperText="Created date" compact />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deal</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Company</TableCell>
                  {!hideDealAmounts && (
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }} align="right">Total (AED)</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Inspection</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={tableColSpan} sx={{ py: 2 }}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center" sx={{ py: 8 }}>
                      <Box sx={{ color: 'text.disabled' }}>
                        <IconBriefcase size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">No deals found</Typography>
                        {hasFilters && <Typography variant="caption" color="text.disabled">Try clearing your filters</Typography>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map(deal => (
                    <TableRow
                      key={deal.id}
                      hover={allowDealDetails}
                      sx={{ cursor: allowDealDetails ? 'pointer' : 'default', '&:hover': allowDealDetails ? { bgcolor: alpha(theme.palette.primary.main, 0.02) } : undefined }}
                      onClick={() => { if (allowDealDetails) navigate(`/erp/deals/view/${deal.id}`); }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main">{deal.deal_number || `#${deal.id}`}</Typography>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 220 }}>{deal.title}</Typography>
                        {deal.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                            {deal.description.substring(0, 60)}{deal.description.length > 60 ? '…' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{deal.company?.company_name || <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}</Typography>
                      </TableCell>
                      {!hideDealAmounts && (
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>{Number(deal.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                        <Typography variant="caption" color="text.secondary">+VAT {Number(deal.vat_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                      </TableCell>
                      )}
                      <TableCell onClick={e => e.stopPropagation()}>
                        <InlineStatusPicker deal={deal} onUpdated={handleStatusUpdated} onError={setError} readOnly={!canEditDeals} />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const badge = getInspectionBadge(deal);
                          return badge
                            ? <Chip label={badge.label} size="small" color={badge.color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={deal.payment_status} config={PAYMENT_CONFIG} />
                        {!hideDealAmounts && deal.payment_status === 'partial' && (
                          <Typography variant="caption" display="block" color="text.secondary" mt={0.25}>
                            {Number(deal.paid_amount || 0).toFixed(0)} / {Number(deal.total || 0).toFixed(0)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedDeal(deal); }} sx={{ borderRadius: 1.5 }}>
                          <IconDotsVertical size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
            </Box>
          )}
        </Card>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedDeal(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}>
        {allowDealDetails && (
        <MenuItemMui onClick={() => { navigate(`/erp/deals/view/${selectedDeal?.id}`); setAnchorEl(null); }}>
          <IconEye size={16} style={{ marginRight: 10 }} /> View
        </MenuItemMui>
        )}
        {canEditDeals && (
          <>
            <MenuItemMui onClick={() => { navigate(`/erp/deals/edit/${selectedDeal?.id}`); setAnchorEl(null); }}>
              <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
            </MenuItemMui>
            {DEAL_APPROVABLE_STATUSES.includes(String(selectedDeal?.status || '').toLowerCase()) && (
              <MenuItemMui
                onClick={() => {
                  handleApproveDeal(selectedDeal.id);
                  setAnchorEl(null);
                }}
                disabled={approvingDealId === selectedDeal?.id}
              >
                <IconCheck size={16} style={{ marginRight: 10 }} />
                {approvingDealId === selectedDeal?.id ? 'Approving…' : 'Approve'}
              </MenuItemMui>
            )}
            <MenuItemMui onClick={() => { setDealToDelete(selectedDeal); setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
              <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
            </MenuItemMui>
          </>
        )}
      </Menu>

      <ApprovalWorkflowDialogs
        open={approvalDialogOpen}
        entityLabel="deal"
        pinConfigured={pinConfigured}
        loading={approvalLoading}
        error={approvalError}
        onClose={closeApprovalDialog}
        onDecideLater={closeApprovalDialog}
        onRequestApproval={handleRequestDealApproval}
        onApproveWithPin={handleApproveDealWithPin}
        approveButtonLabel="Approve deal"
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Delete Deal</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete <strong>"{dealToDelete?.title}"</strong>? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DealList;
