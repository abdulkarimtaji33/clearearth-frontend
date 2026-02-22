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
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconFilterOff,
  IconBuilding,
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
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;

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
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    size="medium"
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
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="medium">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<IconFilterOff />}
                    onClick={() => { setSearch(''); setStatusFilter(''); setPage(0); }}
                    disabled={!search && !statusFilter}
                    size="large"
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
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
                            ? `${company.primaryContact.first_name} ${company.primaryContact.last_name}`
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
