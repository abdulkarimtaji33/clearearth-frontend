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
  IconFilter,
  IconFilterOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage, search, statusFilter, clientTypeFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (clientTypeFilter) params.clientType = clientTypeFilter;
      
      const response = await apiService.getClients(params);
      if (response.success) {
        setClients(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || response.data?.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load clients');
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

  const handleClientTypeFilter = (event) => {
    setClientTypeFilter(event.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setClientTypeFilter('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleEdit = () => {
    navigate(`/erp/clients/edit/${selectedClient.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setClientToDelete(selectedClient);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await apiService.deleteClient(clientToDelete.id);
      setSuccess('Client deleted successfully!');
      fetchClients();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiService.approveClient(id);
      setSuccess('Client approved successfully!');
      fetchClients();
    } catch (err) {
      setError(err.message || 'Failed to approve client');
    }
  };

  const handleActivate = async (id) => {
    try {
      await apiService.activateClient(id);
      setSuccess('Client activated successfully!');
      fetchClients();
    } catch (err) {
      setError(err.message || 'Failed to activate client');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await apiService.deactivateClient(id);
      setSuccess('Client deactivated successfully!');
      fetchClients();
    } catch (err) {
      setError(err.message || 'Failed to deactivate client');
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

  if (loading && clients.length === 0) {
    return (
      <PageContainer title="Clients" description="Manage clients">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Clients" description="Manage clients">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Clients
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your client relationships and accounts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/clients/create')}
            size="large"
          >
            Add Client
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
                    <InputLabel>Client Type</InputLabel>
                    <Select value={clientTypeFilter} onChange={handleClientTypeFilter} label="Client Type">
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
                    disabled={!search && !statusFilter && !clientTypeFilter}
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
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Client Code</TableCell>
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
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {search || statusFilter || clientTypeFilter
                            ? 'No clients found matching your filters'
                            : 'No clients yet. Click "Add Client" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {client.client_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.client_type === 'company' ? 'Company' : 'Individual'}
                            size="small"
                            color={client.client_type === 'company' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {client.client_type === 'company'
                              ? client.company_name
                              : `${client.first_name} ${client.last_name}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{client.email || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>{client.city || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={client.status?.toUpperCase()}
                            size="small"
                            color={getStatusColor(client.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, client)}>
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
          {selectedClient?.status === 'pending' && (
            <MenuItemMui
              onClick={() => {
                handleApprove(selectedClient.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Approve
            </MenuItemMui>
          )}
          {selectedClient?.status === 'active' && (
            <MenuItemMui
              onClick={() => {
                handleDeactivate(selectedClient.id);
                handleMenuClose();
              }}
            >
              <IconX size={18} style={{ marginRight: 8 }} />
              Deactivate
            </MenuItemMui>
          )}
          {selectedClient?.status === 'inactive' && (
            <MenuItemMui
              onClick={() => {
                handleActivate(selectedClient.id);
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
              Delete Client
            </Typography>
            <Typography mb={3} color="textSecondary">
              Are you sure you want to delete this client? This action cannot be undone.
            </Typography>
            {clientToDelete && (
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
                  {clientToDelete.client_type === 'company' 
                    ? clientToDelete.company_name 
                    : `${clientToDelete.first_name} ${clientToDelete.last_name}`}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {clientToDelete.email}
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
                Delete Client
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default ClientList;
