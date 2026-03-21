import React, { useEffect, useState } from 'react';
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
  MenuItem as MenuItemMui,
  Dialog,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Autocomplete,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconFilterOff,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const ContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [dropdowns, setDropdowns] = useState({ designations: [] });
  const [companies, setCompanies] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, search, statusFilter, contactTypeFilter, designationFilter, departmentFilter, companyFilter, dateFrom, dateTo]);

  const fetchDropdowns = async () => {
    try {
      const [dropdownRes, companiesRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getCompanies({ pageSize: 500 }),
      ]);
      if (dropdownRes.success) {
        setDropdowns({
          designations: dropdownRes.data.designations || [],
        });
      }
      if (companiesRes.success) {
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
      if (contactTypeFilter) params.contactType = contactTypeFilter;
      if (designationFilter) params.designation = designationFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (companyFilter) params.companyId = companyFilter.id;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await apiService.getContacts(params);
      if (response.success) {
        setContacts(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, contact) => {
    setAnchorEl(event.currentTarget);
    setSelectedContact(contact);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContact(null);
  };

  const handleEdit = () => {
    navigate(`/erp/contacts/edit/${selectedContact.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setContactToDelete(selectedContact);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await apiService.deleteContact(contactToDelete.id);
      setSuccess('Contact deleted successfully!');
      fetchContacts();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
      handleCloseDeleteDialog();
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <PageContainer title="Contacts" description="Manage contacts">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Contacts" description="Manage contacts">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Contacts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage individual contact persons
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/contacts/create')}
            size="large"
          >
            Add Contact
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

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box mb={3}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, email or phone..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Contact Type</InputLabel>
                        <Select
                          value={contactTypeFilter}
                          onChange={(e) => { setContactTypeFilter(e.target.value); setPage(0); }}
                          label="Contact Type"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="clients">Clients</MenuItem>
                          <MenuItem value="vendors">Vendors</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Designation</InputLabel>
                        <Select
                          value={designationFilter}
                          onChange={(e) => { setDesignationFilter(e.target.value); setPage(0); }}
                          label="Designation"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {dropdowns.designations.map((d) => (
                            <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                      <TextField
                        fullWidth
                        label="Department"
                        placeholder="e.g. Sales"
                        value={departmentFilter}
                        onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<IconFilterOff />}
                        onClick={() => { 
                          setSearch(''); 
                          setStatusFilter(''); 
                          setContactTypeFilter(''); 
                          setDesignationFilter(''); 
                          setDepartmentFilter(''); 
                          setCompanyFilter(null);
                          setDateFrom('');
                          setDateTo('');
                          setPage(0); 
                        }}
                        disabled={!search && !statusFilter && !contactTypeFilter && !designationFilter && !departmentFilter && !companyFilter && !dateFrom && !dateTo}
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
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Contact Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Company / Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {search || statusFilter || contactTypeFilter
                            ? 'No contacts found matching your filters'
                            : 'No contacts yet. Click "Add Contact" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {contact.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {contact.contact_type ? contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {contact.designation || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {contact.company?.company_name || contact.supplier?.company_name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {contact.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {contact.phone || contact.mobile || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={contact.status?.toUpperCase()}
                            size="small"
                            color={contact.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, contact)}>
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
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItemMui onClick={handleEdit}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItemMui>
          <MenuItemMui onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItemMui>
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
          <Box p={3}>
            <Typography variant="h5" mb={1} fontWeight={600}>Delete Contact</Typography>
            <Typography mb={3} color="textSecondary">
              Are you sure you want to delete this contact? This action cannot be undone.
            </Typography>
            {contactToDelete && (
              <Box p={2} mb={3} sx={{ backgroundColor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {[contactToDelete.first_name, contactToDelete.last_name].filter(Boolean).join(' ') || '-'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {contactToDelete.email}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleCloseDeleteDialog} size="large">Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete} size="large">
                Delete Contact
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default ContactList;
