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
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
  IconEye,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBriefcase,
  IconUser,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import RecordDetailDrawer from '../../../components/erp/RecordDetailDrawer';
import apiService from '../../../services/api';

const ContactDrawerContent = ({ contact, onEdit, onNavigateCompany }) => {
  const theme = useTheme();
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
  const initial = (contact.first_name || contact.last_name || '?').charAt(0).toUpperCase();

  return (
    <Stack spacing={0}>
      {/* Avatar hero */}
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
        <Typography variant="h6" fontWeight={800} textAlign="center" mb={0.5}>{fullName}</Typography>
        {contact.designation && (
          <Typography variant="body2" color="text.secondary" mb={1}>{contact.designation}</Typography>
        )}
        <Stack direction="row" gap={0.75} flexWrap="wrap" justifyContent="center">
          <Chip
            label={contact.status?.toUpperCase() || 'UNKNOWN'}
            size="small"
            color={contact.status === 'active' ? 'success' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5 }}
          />
          {contact.contact_type && (
            <Chip
              label={contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.68rem' }}
            />
          )}
        </Stack>
      </Box>

      {/* Contact details */}
      <Stack spacing={0} divider={<Divider />}>
        {contact.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconMail size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Email</Typography>
              <Typography
                variant="body2"
                component="a"
                href={`mailto:${contact.email}`}
                sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                noWrap
              >
                {contact.email}
              </Typography>
            </Box>
          </Box>
        )}
        {(contact.phone || contact.mobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconPhone size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Phone</Typography>
              <Typography variant="body2" fontWeight={500}>{contact.phone || contact.mobile}</Typography>
            </Box>
          </Box>
        )}
        {contact.department && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBriefcase size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Department</Typography>
              <Typography variant="body2" fontWeight={500}>{contact.department}</Typography>
            </Box>
          </Box>
        )}
        {(contact.company || contact.supplier) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBuilding size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Company</Typography>
              {contact.company?.id ? (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => onNavigateCompany(contact.company.id)}
                  noWrap
                >
                  {contact.company.company_name}
                </Typography>
              ) : (
                <Typography variant="body2" fontWeight={500}>{contact.supplier?.company_name || '—'}</Typography>
              )}
            </Box>
          </Box>
        )}
      </Stack>

      {contact.notes && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>Notes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {contact.notes}
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        fullWidth
        startIcon={<IconEdit size={16} />}
        onClick={onEdit}
        sx={{ mt: 3, borderRadius: 2.5, fontWeight: 700, py: 1.25 }}
      >
        Edit Contact
      </Button>
    </Stack>
  );
};

const ContactList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewContact, setViewContact] = useState(null);

  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, search, statusFilter, contactTypeFilter, designationFilter, departmentFilter, companyFilter, dateFrom, dateTo]);

  const fetchDropdowns = async () => {
    try {
      const [dropdownRes, companiesRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getCompanies({ pageSize: 500 }),
      ]);
      if (dropdownRes.success) setDropdowns({ designations: dropdownRes.data.designations || [] });
      if (companiesRes.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
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

  const handleMenuOpen = (event, contact) => { setAnchorEl(event.currentTarget); setSelectedContact(contact); };
  const handleMenuClose = () => { setAnchorEl(null); setSelectedContact(null); };
  const handleEdit = () => { navigate(`/erp/contacts/edit/${selectedContact.id}`); handleMenuClose(); };

  const openContactView = async (contact) => {
    setViewOpen(true);
    setViewContact(null);
    setViewLoading(true);
    try {
      const res = await apiService.getContact(contact.id);
      if (res.success) setViewContact(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load contact');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewFromMenu = () => { if (selectedContact) openContactView(selectedContact); handleMenuClose(); };
  const handleOpenDeleteDialog = () => { setContactToDelete(selectedContact); setDeleteDialogOpen(true); handleMenuClose(); };
  const handleCloseDeleteDialog = () => { setDeleteDialogOpen(false); setContactToDelete(null); };

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

  const clearAllFilters = () => {
    setSearch(''); setStatusFilter(''); setContactTypeFilter('');
    setDesignationFilter(''); setDepartmentFilter(''); setCompanyFilter(null);
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const hasActiveFilters = !!(search || statusFilter || contactTypeFilter || designationFilter || departmentFilter || companyFilter || dateFrom || dateTo);

  if (loading && contacts.length === 0) {
    return (
      <PageContainer title="Contacts" description="Manage contacts">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Contacts" description="Manage contacts">
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mb={0.5}>Contacts</Typography>
            <Typography variant="body2" color="text.secondary">Manage individual contact persons</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => navigate('/erp/contacts/create')}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 2.5 }}
          >
            Add Contact
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            {/* Search + filter toggle */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button
                variant={filtersExpanded ? 'contained' : 'outlined'}
                startIcon={filtersExpanded ? <IconChevronUp size={16} /> : <IconFilter size={16} />}
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                sx={{ borderRadius: 2, height: 56, minWidth: 130, fontWeight: 600, flexShrink: 0 }}
              >
                Filters
              </Button>
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
              <Box sx={{ p: 2.5, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} label="Status" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Contact Type</InputLabel>
                      <Select value={contactTypeFilter} onChange={(e) => { setContactTypeFilter(e.target.value); setPage(0); }} label="Contact Type" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="clients">Clients</MenuItem>
                        <MenuItem value="vendors">Vendors</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Designation</InputLabel>
                      <Select value={designationFilter} onChange={(e) => { setDesignationFilter(e.target.value); setPage(0); }} label="Designation" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.designations.map((d) => <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>)}
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
                    <Autocomplete
                      fullWidth
                      options={companies}
                      getOptionLabel={(o) => o.company_name || ''}
                      value={companyFilter}
                      onChange={(_, v) => { setCompanyFilter(v); setPage(0); }}
                      renderInput={(params) => <TextField {...params} label="Company" placeholder="Select company..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                      isOptionEqualToValue={(o, v) => o.id === v?.id}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<IconFilterOff size={16} />}
                      onClick={clearAllFilters}
                      disabled={!hasActiveFilters}
                      sx={{ borderRadius: 2 }}
                    >
                      Clear All Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>

            {/* Table */}
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    {['Name', 'Contact Type', 'Designation', 'Company / Supplier', 'Email', 'Phone', 'Status', ''].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: '2px solid', borderColor: 'divider' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <IconUser size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                        <Typography color="text.secondary" fontWeight={500}>
                          {hasActiveFilters ? 'No contacts found matching your filters' : 'No contacts yet. Click "Add Contact" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => {
                      const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—';
                      const initial = (contact.first_name || contact.last_name || '?').charAt(0).toUpperCase();
                      return (
                        <TableRow
                          key={contact.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            '&:hover .row-actions': { opacity: 1 },
                            '& td': { py: 1.5 },
                          }}
                          onClick={() => openContactView(contact)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                                {initial}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>{fullName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {contact.contact_type ? (
                              <Chip
                                label={contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1)}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5 }}
                              />
                            ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{contact.designation || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {contact.company?.company_name || contact.supplier?.company_name || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>{contact.email || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{contact.phone || contact.mobile || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contact.status?.toUpperCase() || '—'}
                              size="small"
                              color={contact.status === 'active' ? 'success' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                            />
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, contact); }}>
                                <IconDotsVertical size={17} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}>
          <MenuItemMui onClick={handleViewFromMenu} sx={{ gap: 1.5 }}>
            <IconEye size={16} />
            View
          </MenuItemMui>
          <MenuItemMui onClick={handleEdit} sx={{ gap: 1.5 }}>
            <IconEdit size={16} />
            Edit
          </MenuItemMui>
          <MenuItemMui onClick={handleOpenDeleteDialog} sx={{ color: 'error.main', gap: 1.5 }}>
            <IconTrash size={16} />
            Delete
          </MenuItemMui>
        </Menu>

        <RecordDetailDrawer
          open={viewOpen}
          onClose={() => { setViewOpen(false); setViewContact(null); }}
          title={viewContact ? [viewContact.first_name, viewContact.last_name].filter(Boolean).join(' ') || 'Contact' : 'Contact'}
          subtitle={viewContact?.designation || viewContact?.contact_type || undefined}
          loading={viewLoading}
        >
          {viewContact && (
            <ContactDrawerContent
              contact={viewContact}
              onEdit={() => { const id = viewContact?.id; setViewOpen(false); if (id) navigate(`/erp/contacts/edit/${id}`); }}
              onNavigateCompany={(companyId) => { setViewOpen(false); navigate(`/erp/companies/view/${companyId}`); }}
            />
          )}
        </RecordDetailDrawer>

        {/* Delete dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <Box p={3}>
            <Typography variant="h5" mb={0.75} fontWeight={700}>Delete Contact</Typography>
            <Typography mb={2.5} color="text.secondary" variant="body2">
              This action cannot be undone. The contact will be permanently removed.
            </Typography>
            {contactToDelete && (
              <Box p={2} mb={3} sx={{ bgcolor: alpha(theme.palette.error.main, 0.06), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
                <Typography variant="body2" fontWeight={700} color="error.main">
                  {[contactToDelete.first_name, contactToDelete.last_name].filter(Boolean).join(' ') || '—'}
                </Typography>
                {contactToDelete.email && (
                  <Typography variant="caption" color="text.secondary">{contactToDelete.email}</Typography>
                )}
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" gap={1.5}>
              <Button onClick={handleCloseDeleteDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 2, fontWeight: 700 }}>
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
