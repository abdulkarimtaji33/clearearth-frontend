import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  InputAdornment, IconButton, Chip, Menu, MenuItem as MenuItemMui,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert, Grid, FormControl, InputLabel, Select, MenuItem, Collapse,
  Autocomplete, Stack, Avatar, Divider, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical,
  IconFilterOff, IconFilter, IconChevronDown, IconChevronUp,
  IconEye, IconMail, IconPhone, IconBuilding, IconBriefcase,
  IconAddressBook, IconUser,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import RecordDetailDrawer from '../../../components/erp/RecordDetailDrawer';
import apiService from '../../../services/api';

const contactTypeLabel = (type) => ({ clients: 'Client', vendors: 'Vendor', both: 'Client & Vendor' }[type] || type);

const ContactDrawerContent = ({ contact, onEdit, onNavigateCompany }) => {
  const theme = useTheme();
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
  const initial = (contact.first_name || contact.last_name || '?').charAt(0).toUpperCase();

  return (
    <Stack spacing={0}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, px: 2, mb: 2, borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.12) }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: theme.palette.primary.main, color: 'primary.contrastText', fontSize: '1.6rem', fontWeight: 800, mb: 1.5, boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}` }}>
          {initial}
        </Avatar>
        <Typography variant="h6" fontWeight={800} textAlign="center" mb={0.5}>{fullName}</Typography>
        {contact.designation && <Typography variant="body2" color="text.secondary" mb={1}>{contact.designation}</Typography>}
        <Stack direction="row" gap={0.75} flexWrap="wrap" justifyContent="center">
          <Chip label={contact.status?.toUpperCase() || 'UNKNOWN'} size="small" color={contact.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5 }} />
          {contact.contact_type && <Chip label={contactTypeLabel(contact.contact_type)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.68rem' }} />}
        </Stack>
      </Box>

      <Stack spacing={0} divider={<Divider />}>
        {contact.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconMail size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>Email</Typography>
              <Typography variant="body2" component="a" href={`mailto:${contact.email}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }} noWrap>{contact.email}</Typography>
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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.75 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
              <IconBuilding size={15} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5}>
                {contact.company && contact.supplier ? 'Organizations' : 'Company'}
              </Typography>
              {contact.company?.id && (
                <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => onNavigateCompany(contact.company.id)} noWrap>
                  {contact.contact_type === 'both' ? `Client: ${contact.company.company_name}` : contact.company.company_name}
                </Typography>
              )}
              {contact.supplier?.company_name && (
                <Typography variant="body2" fontWeight={contact.company ? 500 : 600} color={contact.company ? 'text.primary' : 'primary.main'} sx={{ mt: contact.company ? 0.5 : 0 }} noWrap>
                  {contact.contact_type === 'both' ? `Vendor: ${contact.supplier.company_name}` : contact.supplier.company_name}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Stack>

      {contact.notes && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>Notes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{contact.notes}</Typography>
        </Box>
      )}

      <Button variant="contained" fullWidth startIcon={<IconEdit size={16} />} onClick={onEdit} sx={{ mt: 3, borderRadius: 2.5, fontWeight: 700, py: 1.25 }}>
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
  useEffect(() => { fetchContacts(); }, [page, rowsPerPage, search, statusFilter, contactTypeFilter, designationFilter, departmentFilter, companyFilter, dateFrom, dateTo]);

  const fetchDropdowns = async () => {
    try {
      const [dropdownRes, companiesRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getCompanies({ pageSize: 500 }),
      ]);
      if (dropdownRes.success) setDropdowns({ designations: dropdownRes.data.designations || [] });
      if (companiesRes.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
    } catch (err) { console.error(err); }
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

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await apiService.deleteContact(contactToDelete.id);
      setSuccess('Contact deleted');
      fetchContacts();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
      setDeleteDialogOpen(false);
    }
  };

  const clearAllFilters = () => {
    setSearch(''); setStatusFilter(''); setContactTypeFilter('');
    setDesignationFilter(''); setDepartmentFilter(''); setCompanyFilter(null);
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const hasFilters = !!(search || statusFilter || contactTypeFilter || designationFilter || departmentFilter || companyFilter || dateFrom || dateTo);

  const getInitials = (c) => {
    const n = [c.first_name, c.last_name].filter(Boolean).join(' ');
    return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  const TYPE_COLOR = { clients: 'primary', vendors: 'secondary', both: 'info' };

  const formatOrganization = (contact) => {
    const parts = [];
    if (contact.company?.company_name) parts.push(contact.company.company_name);
    if (contact.supplier?.company_name && contact.supplier.company_name !== contact.company?.company_name) {
      parts.push(contact.supplier.company_name);
    }
    return parts.join(' · ') || null;
  };

  return (
    <PageContainer title="Contacts" description="Manage contacts">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAddressBook size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Contacts</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} contact${totalCount !== 1 ? 's' : ''}` : 'Manage individual contact persons'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/contacts/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Contact
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Filter bar */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
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
                  <IconButton size="small" onClick={clearAllFilters} sx={{ color: 'error.main' }}>
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
                      <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Status" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select value={contactTypeFilter} onChange={e => { setContactTypeFilter(e.target.value); setPage(0); }} label="Type" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="clients">Clients</MenuItem>
                        <MenuItem value="vendors">Vendors</MenuItem>
                        <MenuItem value="both">Client & Vendor</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Designation</InputLabel>
                      <Select value={designationFilter} onChange={e => { setDesignationFilter(e.target.value); setPage(0); }} label="Designation" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.designations.map(d => <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" label="Department" value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(0); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Autocomplete
                      size="small"
                      options={companies}
                      getOptionLabel={o => o.company_name || ''}
                      value={companyFilter}
                      onChange={(_, v) => { setCompanyFilter(v); setPage(0); }}
                      renderInput={p => <TextField {...p} label="Company" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                      isOptionEqualToValue={(o, v) => o.id === v?.id}
                    />
                  </Grid>
                  <Grid size={12}>
                    <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Created date" compact />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Contact', 'Type', 'Company', 'Email', 'Phone', 'Status', ''].map((h, i) => (
                    <TableCell key={i} align={i === 6 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} /></TableCell></TableRow>
                  ))
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <IconUser size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">
                        {hasFilters ? 'No contacts match your filters' : 'No contacts yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map(contact => {
                    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—';
                    return (
                      <TableRow
                        key={contact.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }, '&:hover .row-actions': { opacity: 1 } }}
                        onClick={() => openContactView(contact)}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                              {getInitials(contact)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{fullName}</Typography>
                              {contact.designation && <Typography variant="caption" color="text.secondary">{contact.designation}</Typography>}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {contact.contact_type ? (
                            <Chip
                              label={contactTypeLabel(contact.contact_type)}
                              size="small"
                              color={TYPE_COLOR[contact.contact_type] || 'default'}
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {formatOrganization(contact) || <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <IconMail size={13} style={{ opacity: 0.4 }} />
                              <Typography variant="body2" noWrap>{contact.email}</Typography>
                            </Stack>
                          ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell>
                          {(contact.phone || contact.mobile) ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <IconPhone size={13} style={{ opacity: 0.4 }} />
                              <Typography variant="body2">{contact.phone || contact.mobile}</Typography>
                            </Stack>
                          ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip label={contact.status === 'active' ? 'Active' : 'Inactive'} size="small" color={contact.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                            <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedContact(contact); }} sx={{ borderRadius: 1.5 }}>
                              <IconDotsVertical size={16} />
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
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedContact(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 150 } }}>
          <MenuItemMui onClick={() => { if (selectedContact) openContactView(selectedContact); setAnchorEl(null); }}>
            <IconEye size={16} style={{ marginRight: 10 }} /> View
          </MenuItemMui>
          <MenuItemMui onClick={() => { navigate(`/erp/contacts/edit/${selectedContact?.id}`); setAnchorEl(null); }}>
            <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
          </MenuItemMui>
          <MenuItemMui onClick={() => { setContactToDelete(selectedContact); setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
          </MenuItemMui>
        </Menu>

        <RecordDetailDrawer
          open={viewOpen}
          onClose={() => { setViewOpen(false); setViewContact(null); }}
          title={viewContact ? [viewContact.first_name, viewContact.last_name].filter(Boolean).join(' ') || 'Contact' : 'Contact'}
          subtitle={viewContact?.designation || (viewContact?.contact_type ? contactTypeLabel(viewContact.contact_type) : undefined)}
          loading={viewLoading}
        >
          {viewContact && (
            <ContactDrawerContent
              contact={viewContact}
              onEdit={() => { const cid = viewContact?.id; setViewOpen(false); if (cid) navigate(`/erp/contacts/edit/${cid}`); }}
              onNavigateCompany={companyId => { setViewOpen(false); navigate(`/erp/companies/view/${companyId}`); }}
            />
          )}
        </RecordDetailDrawer>

        <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setContactToDelete(null); }} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete Contact</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>"{[contactToDelete?.first_name, contactToDelete?.last_name].filter(Boolean).join(' ')}"</strong>? This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => { setDeleteDialogOpen(false); setContactToDelete(null); }} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default ContactList;
