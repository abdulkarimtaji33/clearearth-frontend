import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
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
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCheck,
  IconRefresh,
  IconFilterOff,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconCircleOff,
  IconEye,
  IconMail,
  IconPhone,
  IconBuilding,
  IconUser,
  IconBriefcase,
  IconCurrencyDollar,
  IconUserCheck,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import RecordDetailDrawer from '../../../components/erp/RecordDetailDrawer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canDirectManagerApprove } from '../../../utils/recordStatus';

const leadStatusChipColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'new': return 'info';
    case 'contacted': return 'primary';
    case 'pending_approval': return 'warning';
    case 'qualified':
    case 'converted':
      return 'success';
    case 'disqualified': return 'error';
    default: return 'default';
  }
};

const LEAD_APPROVABLE_STATUSES = ['new', 'contacted', 'pending_approval'];

const LeadDrawerContent = ({ lead, onEdit, onNavigateCompany, onApprove, approving, canAttemptApproval }) => {
  const theme = useTheme();
  const companyName = lead.company?.company_name || '';
  const initial = (companyName.trim().charAt(0) || lead.lead_number?.charAt(0) || '?').toUpperCase();
  const contactName = lead.contact
    ? [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ')
    : '';

  return (
    <Stack spacing={0}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 3,
          px: 2,
          mb: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.12),
        }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: theme.palette.primary.main,
            color: 'primary.contrastText',
            fontSize: '1.6rem',
            fontWeight: 800,
            mb: 1.5,
            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          {initial}
        </Avatar>
        <Typography variant="caption" color="primary.main" fontWeight={700} letterSpacing={0.5}>
          {lead.lead_number || 'Lead'}
        </Typography>
        <Typography variant="h6" fontWeight={800} textAlign="center" mt={0.5} mb={0.5}>
          {companyName || contactName || lead.email || 'Lead'}
        </Typography>
        {companyName && contactName ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={1}>
            {contactName}
          </Typography>
        ) : null}
        <Stack direction="row" gap={0.75} flexWrap="wrap" justifyContent="center">
          <Chip
            label={(lead.status || '—').toUpperCase()}
            size="small"
            color={leadStatusChipColor(lead.status)}
            sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5 }}
          />
          {lead.source ? (
            <Chip label={lead.source} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.68rem' }} />
          ) : null}
        </Stack>
      </Box>

      <Stack spacing={0} divider={<Divider />}>
        {lead.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconMail size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Email</Typography>
              <Typography
                variant="body2"
                component="a"
                href={`mailto:${lead.email}`}
                sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                noWrap
              >
                {lead.email}
              </Typography>
            </Box>
          </Box>
        )}
        {lead.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconPhone size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Phone</Typography>
              <Typography variant="body2" fontWeight={500}>{lead.phone}</Typography>
            </Box>
          </Box>
        )}
        {(lead.company || companyName) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBuilding size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Company</Typography>
              {lead.company?.id ? (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => onNavigateCompany(lead.company.id)}
                  noWrap
                >
                  {lead.company.company_name}
                </Typography>
              ) : (
                <Typography variant="body2" fontWeight={500}>—</Typography>
              )}
            </Box>
          </Box>
        )}
        {contactName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconUser size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Contact person</Typography>
              <Typography variant="body2" fontWeight={500}>{contactName}</Typography>
            </Box>
          </Box>
        )}
        {lead.productService && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBriefcase size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Product / service</Typography>
              <Typography variant="body2" fontWeight={500}>
                {lead.productService.name} ({lead.productService.category})
              </Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCurrencyDollar size={15} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Estimated value</Typography>
            <Typography variant="body2" fontWeight={500}>
              {lead.estimated_value != null ? String(lead.estimated_value) : '—'}
            </Typography>
          </Box>
        </Box>
        {lead.assignedUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconUserCheck size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Assigned to</Typography>
              <Typography variant="body2" fontWeight={500}>
                {[lead.assignedUser.first_name, lead.assignedUser.last_name].filter(Boolean).join(' ') || '—'}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>

      {lead.notes ? (
        <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>Notes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {lead.notes}
          </Typography>
        </Box>
      ) : null}

      {canAttemptApproval && LEAD_APPROVABLE_STATUSES.includes(String(lead.status || '').toLowerCase()) && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={16} />}
          onClick={() => onApprove?.(lead.id)}
          disabled={approving}
          sx={{ mt: 3, borderRadius: 2.5, fontWeight: 700, py: 1.25 }}
        >
          {approving ? 'Approving…' : 'Approve'}
        </Button>
      )}
      <Button
        variant="contained"
        fullWidth
        startIcon={<IconEdit size={16} />}
        onClick={onEdit}
        sx={{ mt: LEAD_APPROVABLE_STATUSES.includes(String(lead.status || '').toLowerCase()) ? 1.5 : 3, borderRadius: 2.5, fontWeight: 700, py: 1.25 }}
      >
        Edit Lead
      </Button>
    </Stack>
  );
};

const LeadList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, hasPermission } = useAuth();
  const canAttemptApproval = hasPermission('leads.update');
  const canDirectApprove = canDirectManagerApprove(user);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState(null);
  const [companyFilter, setCompanyFilter] = useState(null);
  const [contactFilter, setContactFilter] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [dropdowns, setDropdowns] = useState({ leadSources: [] });
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [disqualifyDialogOpen, setDisqualifyDialogOpen] = useState(false);
  const [leadToDisqualify, setLeadToDisqualify] = useState(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [disqualifying, setDisqualifying] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [approvingLeadId, setApprovingLeadId] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalTargetId, setApprovalTargetId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);

  const fetchDropdowns = useCallback(async () => {
    const results = await Promise.allSettled([
      apiService.getAllDropdowns(),
      apiService.getAssignees(),
      apiService.getCompanies({ pageSize: 500 }),
      apiService.getContacts({ pageSize: 500 }),
      apiService.getProducts({ pageSize: 500 }),
    ]);
    const [dropdownRes, usersRes, companiesRes, contactsRes, productsRes] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    );
    if (dropdownRes?.success) {
      setDropdowns({ leadSources: dropdownRes.data.lead_sources || [] });
    }
    if (usersRes?.success) {
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
    }
    if (companiesRes?.success) {
      setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.items || []);
    }
    if (contactsRes?.success) {
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : contactsRes.data?.items || []);
    }
    if (productsRes?.success) {
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || []);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (assignedToFilter) params.assignedTo = assignedToFilter.id;
      if (companyFilter) params.companyId = companyFilter.id;
      if (contactFilter) params.contactId = contactFilter.id;
      if (productFilter) params.productServiceId = productFilter.id;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await apiService.getLeads(params);
      if (response.success) {
        setLeads(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, sourceFilter, assignedToFilter, companyFilter, contactFilter, productFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchDropdowns();
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setAssignedToFilter(null);
    setCompanyFilter(null);
    setContactFilter(null);
    setProductFilter(null);
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const refreshLeadAfterApproval = async (leadId) => {
    fetchLeads();
    if (viewLead?.id === leadId) {
      const res = await apiService.getLead(leadId);
      if (res.success) setViewLead(res.data);
    }
  };

  const handleApproveLead = async (leadId) => {
    if (!leadId) return;
    setError('');
    if (canDirectApprove) {
      try {
        setApprovingLeadId(leadId);
        await apiService.qualifyLead(leadId, {});
        setSuccess('Lead approved');
        await refreshLeadAfterApproval(leadId);
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('approval PIN') || msg.includes('manager can approve')) {
          setApprovalTargetId(leadId);
          setApprovalError('');
          setApprovalDialogOpen(true);
        } else {
          setError(msg || 'Failed to approve lead');
        }
      } finally {
        setApprovingLeadId(null);
      }
      return;
    }
    setApprovalTargetId(leadId);
    setApprovalError('');
    setApprovalDialogOpen(true);
  };

  const closeApprovalDialog = () => {
    setApprovalDialogOpen(false);
    setApprovalTargetId(null);
    setApprovalError('');
  };

  const handleRequestLeadApproval = async () => {
    if (!approvalTargetId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestLeadApproval(approvalTargetId);
      setSuccess('Approval requested. Your manager has been notified.');
      closeApprovalDialog();
      await refreshLeadAfterApproval(approvalTargetId);
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveLeadWithPin = async (pin) => {
    if (!approvalTargetId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveLeadWithPin(approvalTargetId, pin);
      setSuccess('Lead approved');
      closeApprovalDialog();
      await refreshLeadAfterApproval(approvalTargetId);
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleConvert = (leadId) => {
    navigate(`/erp/deals/create?leadId=${leadId}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await apiService.deleteLead(id);
        fetchLeads();
      } catch (err) {
        setError(err.message || 'Failed to delete lead');
      }
    }
  };

  const handleDisqualifyClick = () => {
    setLeadToDisqualify(selectedLead);
    setDisqualifyReason('');
    setDisqualifyDialogOpen(true);
    handleMenuClose();
  };

  const openLeadView = async (lead) => {
    setViewOpen(true);
    setViewLead(null);
    setViewLoading(true);
    try {
      const res = await apiService.getLead(lead.id);
      if (res.success) setViewLead(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load lead');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewFromMenu = () => {
    if (selectedLead) openLeadView(selectedLead);
    handleMenuClose();
  };

  const handleDisqualifyConfirm = async () => {
    if (!leadToDisqualify) return;
    try {
      setDisqualifying(true);
      await apiService.disqualifyLead(leadToDisqualify.id, { reason: disqualifyReason });
      setDisqualifyDialogOpen(false);
      setLeadToDisqualify(null);
      setDisqualifyReason('');
      fetchLeads();
    } catch (err) {
      setError(err.message || 'Failed to disqualify lead');
    } finally {
      setDisqualifying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'primary';
      case 'qualified':
        return 'success';
      case 'disqualified':
        return 'error';
      case 'converted':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && leads.length === 0) {
    return (
      <PageContainer title="Leads" description="Manage leads">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Leads" description="Manage leads">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Leads
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/leads/create')}
          >
            Add Lead
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box mb={2}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Search leads by email, phone, company..."
                    value={search}
                    onChange={handleSearch}
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
                <Box sx={{ minWidth: '200px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={filtersExpanded ? <IconChevronUp /> : <IconChevronDown />}
                    endIcon={<IconFilter size={18} />}
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    sx={{ borderRadius: 2, height: '56px' }}
                  >
                    {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <ListDateRangeFilter
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onFromChange={(v) => { setDateFrom(v); setPage(0); }}
                  onToChange={(v) => { setDateTo(v); setPage(0); }}
                  onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                  helperText="Created date"
                  compact
                />
              </Box>

              <Collapse in={filtersExpanded}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                          label="Status"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="contacted">Contacted</MenuItem>
                          <MenuItem value="pending_approval">Pending Approval</MenuItem>
                          <MenuItem value="qualified">Qualified</MenuItem>
                          <MenuItem value="disqualified">Disqualified</MenuItem>
                          <MenuItem value="converted">Converted</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Source</InputLabel>
                        <Select
                          value={sourceFilter}
                          onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
                          label="Source"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {dropdowns.leadSources.map((source) => (
                            <MenuItem key={source.id} value={source.value}>{source.display_name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={users}
                          getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() || '-'}
                          value={assignedToFilter}
                          onChange={(_, newValue) => { setAssignedToFilter(newValue); setPage(0); }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Assigned To"
                              placeholder="Select user..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(option) => option.company_name || ''}
                          value={companyFilter}
                          onChange={(_, newValue) => { setCompanyFilter(newValue); setPage(0); }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company"
                              placeholder="Select company..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={contacts}
                          getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() + (option.email ? ` (${option.email})` : '')}
                          value={contactFilter}
                          onChange={(_, newValue) => { setContactFilter(newValue); setPage(0); }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Contact Person"
                              placeholder="Select contact..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={products}
                          getOptionLabel={(option) => `${option.name} (${option.category})`}
                          value={productFilter}
                          onChange={(_, newValue) => { setProductFilter(newValue); setPage(0); }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Product/Service"
                              placeholder="Select product..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<IconFilterOff />}
                        onClick={handleClearFilters}
                        disabled={!search && !statusFilter && !sourceFilter && !assignedToFilter && !companyFilter && !contactFilter && !productFilter}
                        sx={{ borderRadius: 2 }}
                      >
                        Clear All Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    {['Lead', 'Company', 'Contact', 'Email', 'Phone', 'Source', 'Status', 'Assigned', ''].map((h, idx) => (
                      <TableCell
                        key={`col-${idx}`}
                        sx={{
                          fontWeight: 700,
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          py: 1.5,
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => {
                    const label = lead.company?.company_name || lead.lead_number || '?';
                    const rowInitial = label.trim().charAt(0).toUpperCase();
                    return (
                      <TableRow
                        key={lead.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover .row-actions': { opacity: 1 },
                          '& td': { py: 1.5 },
                        }}
                        onClick={() => openLeadView(lead)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                              {rowInitial}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {lead.lead_number || '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {lead.company?.company_name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {lead.contact
                              ? [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ') || '—'
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>{lead.email || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{lead.phone || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>{lead.source || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={lead.status} size="small" color={getStatusColor(lead.status)} sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {lead.assignedUser
                              ? [lead.assignedUser.first_name, lead.assignedUser.last_name].filter(Boolean).join(' ') || '—'
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, lead); }}>
                              <IconDotsVertical size={17} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}>
          <MenuItem onClick={handleViewFromMenu} sx={{ gap: 1.5 }}>
            <IconEye size={16} />
            View
          </MenuItem>
          <MenuItem onClick={() => { navigate(`/erp/leads/edit/${selectedLead?.id}`); handleMenuClose(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          {canAttemptApproval && LEAD_APPROVABLE_STATUSES.includes(String(selectedLead?.status || '').toLowerCase()) && (
            <MenuItem
              onClick={() => {
                handleApproveLead(selectedLead.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Approve
            </MenuItem>
          )}
          {selectedLead?.status !== 'converted' && selectedLead?.status !== 'disqualified' && (
            <MenuItem onClick={handleDisqualifyClick}>
              <IconCircleOff size={18} style={{ marginRight: 8 }} />
              Disqualify
            </MenuItem>
          )}
          {selectedLead?.status === 'qualified' && (
            <MenuItem
              onClick={() => {
                handleConvert(selectedLead.id);
                handleMenuClose();
              }}
            >
              <IconRefresh size={18} style={{ marginRight: 8 }} />
              Convert to Deal
            </MenuItem>
          )}
          <MenuItem 
            onClick={() => { 
              handleDelete(selectedLead?.id); 
              handleMenuClose(); 
            }}
            sx={{ color: 'error.main' }}
          >
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>

        <RecordDetailDrawer
          open={viewOpen}
          onClose={() => { setViewOpen(false); setViewLead(null); }}
          title={viewLead?.lead_number ? `Lead ${viewLead.lead_number}` : 'Lead'}
          subtitle={viewLead?.company?.company_name || viewLead?.email || undefined}
          loading={viewLoading}
        >
          {viewLead && (
            <LeadDrawerContent
              lead={viewLead}
              onEdit={() => {
                const lid = viewLead?.id;
                setViewOpen(false);
                if (lid) navigate(`/erp/leads/edit/${lid}`);
              }}
              onNavigateCompany={(companyId) => {
                setViewOpen(false);
                navigate(`/erp/companies/view/${companyId}`);
              }}
              onApprove={handleApproveLead}
              canAttemptApproval={canAttemptApproval}
              approving={approvingLeadId === viewLead?.id}
            />
          )}
        </RecordDetailDrawer>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="lead"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={closeApprovalDialog}
          onDecideLater={closeApprovalDialog}
          onRequestApproval={handleRequestLeadApproval}
          onApproveWithPin={handleApproveLeadWithPin}
          approveButtonLabel="Approve lead"
        />

        <Dialog open={disqualifyDialogOpen} onClose={() => setDisqualifyDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>Disqualify Lead</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for disqualifying this lead (optional but recommended).
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Disqualification Reason"
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              placeholder="e.g. Budget constraints, Not a fit, No response..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDisqualifyDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDisqualifyConfirm} disabled={disqualifying}>
              {disqualifying ? 'Disqualifying...' : 'Disqualify'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default LeadList;
