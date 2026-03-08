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
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconRefresh,
  IconFilterOff,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconCircleOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const LeadList = () => {
  const navigate = useNavigate();
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
  const [disqualifyDialogOpen, setDisqualifyDialogOpen] = useState(false);
  const [leadToDisqualify, setLeadToDisqualify] = useState(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [disqualifying, setDisqualifying] = useState(false);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [dropdownRes, usersRes, companiesRes, contactsRes, productsRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getUsers({ pageSize: 500 }),
        apiService.getCompanies({ pageSize: 500 }),
        apiService.getContacts({ pageSize: 500 }),
        apiService.getProducts({ pageSize: 500 }),
      ]);
      if (dropdownRes.success) {
        setDropdowns({ leadSources: dropdownRes.data.lead_sources || [] });
      }
      if (usersRes.success) {
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      }
      if (companiesRes.success) {
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      }
      if (contactsRes.success) {
        setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      }
      if (productsRes.success) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
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
  }, [page, rowsPerPage, search, statusFilter, sourceFilter, assignedToFilter, companyFilter, contactFilter, productFilter]);

  useEffect(() => {
    fetchDropdowns();
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

  const handleQualify = async (id) => {
    try {
      await apiService.qualifyLead(id, {});
      fetchLeads();
    } catch (err) {
      setError(err.message || 'Failed to qualify lead');
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lead #</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.lead_number || '-'}</TableCell>
                      <TableCell>{lead.company?.company_name || '-'}</TableCell>
                      <TableCell>
                        {lead.contact
                          ? [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ') || '-'
                          : '-'}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.source || '-'}</TableCell>
                      <TableCell>
                        <Chip label={lead.status} size="small" color={getStatusColor(lead.status)} />
                      </TableCell>
                      <TableCell>
                        {lead.assignedUser
                          ? [lead.assignedUser.first_name, lead.assignedUser.last_name].filter(Boolean).join(' ') || '-'
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, lead)}>
                          <IconDotsVertical size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
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

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { navigate(`/erp/leads/edit/${selectedLead?.id}`); handleMenuClose(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          {selectedLead?.status === 'new' && (
            <MenuItem
              onClick={() => {
                handleQualify(selectedLead.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Qualify
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
