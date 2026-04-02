import React, { useEffect, useState } from 'react';
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
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem as MenuItemMui,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Collapse,
  Autocomplete,
  Stack,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical,
  IconFilterOff, IconBuilding, IconEye, IconFilter, IconChevronDown,
  IconChevronUp, IconPhone, IconMail,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const CompanyList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [contactFilter, setContactFilter] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [dropdowns, setDropdowns] = useState({ industryTypes: [], countries: [], cities: [] });
  const [contacts, setContacts] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => { fetchCompanies(); }, [page, rowsPerPage, search, statusFilter, industryFilter, countryFilter, cityFilter, contactFilter, dateFrom, dateTo]);

  const fetchDropdowns = async () => {
    try {
      const [dropdownRes, contactsRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getContacts({ pageSize: 500 }),
      ]);
      if (dropdownRes.success) {
        setDropdowns({
          industryTypes: dropdownRes.data.industry_types || [],
          countries: dropdownRes.data.countries || [],
          cities: dropdownRes.data.uae_cities || [],
        });
      }
      if (contactsRes.success) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
      if (industryFilter) params.industryType = industryFilter;
      if (countryFilter) params.country = countryFilter;
      if (cityFilter) params.city = cityFilter;
      if (contactFilter) params.contactId = contactFilter.id;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getCompanies(params);
      if (response.success) {
        setCompanies(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      await apiService.deleteCompany(companyToDelete.id);
      setSuccess('Company deleted');
      fetchCompanies();
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete company');
      setDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setIndustryFilter('');
    setCountryFilter(''); setCityFilter(''); setContactFilter(null);
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const hasFilters = search || statusFilter || industryFilter || countryFilter || cityFilter || contactFilter || dateFrom || dateTo;

  const getInitials = (name) => (name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <PageContainer title="Companies" description="Manage companies">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBuilding size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Companies</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} compan${totalCount !== 1 ? 'ies' : 'y'}` : 'Manage client company accounts'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/companies/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Company
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search by name, email, phone or industry..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 280, flex: 1 }}
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
                  <IconButton size="small" onClick={clearFilters} sx={{ color: 'error.main' }}>
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
                      <InputLabel>Industry</InputLabel>
                      <Select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(0); }} label="Industry" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.industryTypes.map(ind => <MenuItem key={ind.id} value={ind.value}>{ind.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Country</InputLabel>
                      <Select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(0); }} label="Country" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.countries.map(c => <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>City</InputLabel>
                      <Select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(0); }} label="City" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.cities.map(city => <MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Autocomplete
                      size="small"
                      options={contacts}
                      getOptionLabel={o => `${o.first_name || ''} ${o.last_name || ''}`.trim() + (o.email ? ` (${o.email})` : '')}
                      value={contactFilter}
                      onChange={(_, v) => { setContactFilter(v); setPage(0); }}
                      renderInput={p => <TextField {...p} label="Primary Contact" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
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

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Company', 'Primary Contact', 'Email', 'Phone', 'Industry', 'Status', ''].map((h, i) => (
                    <TableCell key={i} align={i === 6 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} /></TableCell></TableRow>
                  ))
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <IconBuilding size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">
                        {hasFilters ? 'No companies match your filters' : 'No companies yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map(company => (
                    <TableRow
                      key={company.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                      onClick={() => navigate(`/erp/companies/view/${company.id}`)}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                            {getInitials(company.company_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{company.company_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{company.company_code || `#${company.id}`}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {company.primaryContact ? (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {[company.primaryContact.first_name, company.primaryContact.last_name].filter(Boolean).join(' ') || '—'}
                            </Typography>
                            {company.primaryContact.phone && (
                              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.25}>
                                <IconPhone size={11} style={{ opacity: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">{company.primaryContact.phone}</Typography>
                              </Stack>
                            )}
                          </Box>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {company.email ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconMail size={13} style={{ opacity: 0.4 }} />
                            <Typography variant="body2">{company.email}</Typography>
                          </Stack>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {company.phone ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconPhone size={13} style={{ opacity: 0.4 }} />
                            <Typography variant="body2">{company.phone}</Typography>
                          </Stack>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell><Typography variant="body2">{company.industry_type || <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}</Typography></TableCell>
                      <TableCell>
                        <Chip label={company.status === 'active' ? 'Active' : 'Inactive'} size="small" color={company.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedCompany(company); }} sx={{ borderRadius: 1.5 }}>
                          <IconDotsVertical size={16} />
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
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedCompany(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}>
          <MenuItemMui onClick={() => { navigate(`/erp/companies/view/${selectedCompany?.id}`); setAnchorEl(null); }}>
            <IconEye size={16} style={{ marginRight: 10 }} /> View
          </MenuItemMui>
          <MenuItemMui onClick={() => { navigate(`/erp/companies/edit/${selectedCompany?.id}`); setAnchorEl(null); }}>
            <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
          </MenuItemMui>
          <MenuItemMui onClick={() => { setCompanyToDelete(selectedCompany); setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
          </MenuItemMui>
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setCompanyToDelete(null); }} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete Company</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete <strong>"{companyToDelete?.company_name}"</strong>? This cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => { setDeleteDialogOpen(false); setCompanyToDelete(null); }} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default CompanyList;
