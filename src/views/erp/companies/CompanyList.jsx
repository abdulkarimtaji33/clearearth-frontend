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
  Avatar,
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
  IconBuilding,
  IconEye,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const CompanyList = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, search, statusFilter, industryFilter, countryFilter, cityFilter, contactFilter]);

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
      if (contactsRes.success) {
        setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
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

  const handleMenuOpen = (event, company) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleView = () => {
    navigate(`/erp/companies/view/${selectedCompany.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/erp/companies/edit/${selectedCompany.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setCompanyToDelete(selectedCompany);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      await apiService.deleteCompany(companyToDelete.id);
      setSuccess('Company deleted successfully!');
      fetchCompanies();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err.message || 'Failed to delete company');
      handleCloseDeleteDialog();
    }
  };

  if (loading && companies.length === 0) {
    return (
      <PageContainer title="Companies" description="Manage companies">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Companies" description="Manage companies">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Companies
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage company accounts and their contacts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/companies/create')}
            size="large"
          >
            Add Company
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
                    placeholder="Search by name, email, phone or industry..."
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
                        <InputLabel>Industry</InputLabel>
                        <Select
                          value={industryFilter}
                          onChange={(e) => { setIndustryFilter(e.target.value); setPage(0); }}
                          label="Industry"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {dropdowns.industryTypes.map((ind) => (
                            <MenuItem key={ind.id} value={ind.value}>{ind.display_name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Country</InputLabel>
                        <Select
                          value={countryFilter}
                          onChange={(e) => { setCountryFilter(e.target.value); setPage(0); }}
                          label="Country"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {dropdowns.countries.map((c) => (
                            <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>City</InputLabel>
                        <Select
                          value={cityFilter}
                          onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
                          label="City"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {dropdowns.cities.map((city) => (
                            <MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
                              label="Primary Contact"
                              placeholder="Select contact..."
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
                          setIndustryFilter(''); 
                          setCountryFilter(''); 
                          setCityFilter(''); 
                          setContactFilter(null);
                          setPage(0); 
                        }}
                        disabled={!search && !statusFilter && !industryFilter && !countryFilter && !cityFilter && !contactFilter}
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
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Primary Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Industry</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {search || statusFilter
                            ? 'No companies found matching your filters'
                            : 'No companies yet. Click "Add Company" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                              <IconBuilding size={18} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {company.company_name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {company.company_code}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {company.primaryContact
                            ? [company.primaryContact.first_name, company.primaryContact.last_name].filter(Boolean).join(' ') || '-'
                            : '-'}
                        </TableCell>
                        <TableCell>{company.email || '-'}</TableCell>
                        <TableCell>{company.phone || '-'}</TableCell>
                        <TableCell>{company.industry_type || '-'}</TableCell>
                        <TableCell>{company.country || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={company.status?.toUpperCase()}
                            size="small"
                            color={company.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, company)}>
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
          <MenuItemMui onClick={handleView}>
            <IconEye size={18} style={{ marginRight: 8 }} />
            View
          </MenuItemMui>
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
            <Typography variant="h5" mb={1} fontWeight={600}>Delete Company</Typography>
            <Typography mb={3} color="textSecondary">
              Are you sure you want to delete this company? This action cannot be undone.
            </Typography>
            {companyToDelete && (
              <Box p={2} mb={3} sx={{ backgroundColor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {companyToDelete.company_name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {companyToDelete.email}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleCloseDeleteDialog} size="large">Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete} size="large">
                Delete Company
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default CompanyList;
