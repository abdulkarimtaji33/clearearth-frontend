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
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconFilterOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const VendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, [page, rowsPerPage, search, statusFilter, vendorTypeFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (vendorTypeFilter) params.vendorType = vendorTypeFilter;

      const response = await apiService.getVendors(params);
      if (response.success) {
        setVendors(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || response.data?.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleVendorTypeFilter = (event) => {
    setVendorTypeFilter(event.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setVendorTypeFilter('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, vendor) => {
    setAnchorEl(event.currentTarget);
    setSelectedVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  const handleEdit = () => {
    navigate(`/erp/vendors/edit/${selectedVendor.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setVendorToDelete(selectedVendor);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setVendorToDelete(null);
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await apiService.deleteVendor(vendorToDelete.id);
      setSuccess('Vendor deleted successfully!');
      fetchVendors();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err.message || 'Failed to delete vendor');
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiService.approveVendor(id);
      setSuccess('Vendor approved successfully!');
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to approve vendor');
    }
  };

  const handleActivate = async (id) => {
    try {
      await apiService.activateVendor(id);
      setSuccess('Vendor activated successfully!');
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to activate vendor');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await apiService.deactivateVendor(id);
      setSuccess('Vendor deactivated successfully!');
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to deactivate vendor');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <PageContainer title="Vendors" description="Manage vendors">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Vendors" description="Manage vendors">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Vendors
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your vendor relationships and suppliers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/vendors/create')}
            size="large"
          >
            Add Vendor
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="medium"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={20} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="medium">
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} onChange={handleStatusFilter} label="Status">
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="medium">
                    <InputLabel>Vendor Type</InputLabel>
                    <Select value={vendorTypeFilter} onChange={handleVendorTypeFilter} label="Vendor Type">
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="company">Company</MenuItem>
                      <MenuItem value="individual">Individual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<IconFilterOff />}
                    onClick={handleClearFilters}
                    disabled={!search && !statusFilter && !vendorTypeFilter}
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
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Vendor Code</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {search || statusFilter || vendorTypeFilter
                            ? 'No vendors found matching your filters'
                            : 'No vendors yet. Click "Add Vendor" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor) => (
                      <TableRow key={vendor.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {vendor.vendor_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={vendor.vendor_type === 'company' ? 'Company' : 'Individual'}
                            size="small"
                            color={vendor.vendor_type === 'company' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {vendor.vendor_type === 'company'
                              ? vendor.company_name
                              : `${vendor.first_name} ${vendor.last_name}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{vendor.email || '-'}</TableCell>
                        <TableCell>{vendor.phone || '-'}</TableCell>
                        <TableCell>{vendor.city || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={vendor.status?.toUpperCase()}
                            size="small"
                            color={getStatusColor(vendor.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, vendor)}>
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
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItemMui onClick={handleEdit}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItemMui>
          {selectedVendor?.status === 'pending' && (
            <MenuItemMui
              onClick={() => {
                handleApprove(selectedVendor.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Approve
            </MenuItemMui>
          )}
          {selectedVendor?.status === 'active' && (
            <MenuItemMui
              onClick={() => {
                handleDeactivate(selectedVendor.id);
                handleMenuClose();
              }}
            >
              <IconX size={18} style={{ marginRight: 8 }} />
              Deactivate
            </MenuItemMui>
          )}
          {selectedVendor?.status === 'inactive' && (
            <MenuItemMui
              onClick={() => {
                handleActivate(selectedVendor.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Activate
            </MenuItemMui>
          )}
          <MenuItemMui onClick={handleOpenDeleteDialog}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItemMui>
        </Menu>

        <Dialog 
          open={deleteDialogOpen} 
          onClose={handleCloseDeleteDialog}
          maxWidth="xs"
          fullWidth
        >
          <Box p={3}>
            <Typography variant="h5" mb={1} fontWeight={600}>
              Delete Vendor
            </Typography>
            <Typography mb={3} color="textSecondary">
              Are you sure you want to delete this vendor? This action cannot be undone.
            </Typography>
            {vendorToDelete && (
              <Box 
                p={2} 
                mb={3} 
                sx={{ 
                  backgroundColor: 'error.lighter',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'error.light'
                }}
              >
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {vendorToDelete.vendor_type === 'company' 
                    ? vendorToDelete.company_name 
                    : `${vendorToDelete.first_name} ${vendorToDelete.last_name}`}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {vendorToDelete.email}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleCloseDeleteDialog} size="large">
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                size="large"
              >
                Delete Vendor
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default VendorList;
