import React, { useState, useEffect } from 'react';
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
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Autocomplete,
  Menu,
  MenuItem as MenuItemMui,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconCurrencyDollar, IconEye, IconFilterOff, IconFilter, IconChevronDown, IconChevronUp, IconDotsVertical } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    pending: 'warning',
    approved: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

const getPaymentStatusColor = (status) => {
  const colors = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
  return colors[status] || 'default';
};

const DealList = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState(null);
  const [contactFilter, setContactFilter] = useState(null);
  const [assignedToFilter, setAssignedToFilter] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchDeals();
  }, [page, search, statusFilter, paymentStatusFilter, companyFilter, contactFilter, assignedToFilter, productFilter, minAmountFilter, maxAmountFilter]);

  useEffect(() => {
    fetchRelatedData();
  }, []);

  const fetchRelatedData = async () => {
    const results = await Promise.allSettled([
      apiService.getCompanies({ pageSize: 500 }),
      apiService.getContacts({ pageSize: 500 }),
      apiService.getUsers({ pageSize: 500 }),
      apiService.getProducts({ pageSize: 500 }),
    ]);
    const [companiesRes, contactsRes, usersRes, productsRes] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    );
    if (companiesRes?.success) {
      setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.items || []);
    }
    if (contactsRes?.success) {
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : contactsRes.data?.items || []);
    }
    if (usersRes?.success) {
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
    }
    if (productsRes?.success) {
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || []);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, pageSize, search };
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (companyFilter) params.companyId = companyFilter.id;
      if (contactFilter) params.contactId = contactFilter.id;
      if (assignedToFilter) params.assignedTo = assignedToFilter.id;
      if (productFilter) params.productServiceId = productFilter.id;
      if (minAmountFilter) params.minAmount = minAmountFilter;
      if (maxAmountFilter) params.maxAmount = maxAmountFilter;
      
      const response = await apiService.getDeals(params);
      if (response.success) {
        setDeals(response.data || []);
        setTotalPages(Math.ceil((response.pagination?.totalItems || 0) / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setCompanyFilter(null);
    setContactFilter(null);
    setAssignedToFilter(null);
    setProductFilter(null);
    setMinAmountFilter('');
    setMaxAmountFilter('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!dealToDelete) return;
    try {
      await apiService.deleteDeal(dealToDelete.id);
      setSuccess('Deal deleted successfully');
      setDeleteDialogOpen(false);
      setDealToDelete(null);
      fetchDeals();
    } catch (err) {
      setError(err.message || 'Failed to delete deal');
    }
  };

  const openDeleteDialog = (deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleMenuOpen = (event, deal) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeal(deal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeal(null);
  };

  const handleView = () => {
    navigate(`/erp/deals/view/${selectedDeal.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/erp/deals/edit/${selectedDeal.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setDealToDelete(selectedDeal);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  return (
    <PageContainer title="Deals" description="Manage all deals">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" fontWeight={700}>Deals</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage all business deals and transactions
          </Typography>
          </Box>
            <Button
              variant="contained"
            startIcon={<IconPlus size={20} />}
              onClick={() => navigate('/erp/deals/create')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            >
            Create Deal
            </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Search deals by title, description or company..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
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
                      <InputLabel>Deal Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        label="Deal Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        value={paymentStatusFilter}
                        onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                        label="Payment Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="unpaid">Unpaid</MenuItem>
                        <MenuItem value="partial">Partial</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <Box>
                      <Autocomplete
                        fullWidth
                        options={companies}
                        getOptionLabel={(option) => option.company_name || ''}
                        value={companyFilter}
                        onChange={(_, newValue) => { setCompanyFilter(newValue); setPage(1); }}
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
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <Box>
                      <Autocomplete
                        fullWidth
                        options={contacts}
                        getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() || '-'}
                        value={contactFilter}
                        onChange={(_, newValue) => { setContactFilter(newValue); setPage(1); }}
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
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Box>
                      <Autocomplete
                        fullWidth
                        options={users}
                        getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() || '-'}
                        value={assignedToFilter}
                        onChange={(_, newValue) => { setAssignedToFilter(newValue); setPage(1); }}
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
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Box>
                      <Autocomplete
                        fullWidth
                        options={products}
                        getOptionLabel={(option) => `${option.name} (${option.category})`}
                        value={productFilter}
                        onChange={(_, newValue) => { setProductFilter(newValue); setPage(1); }}
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
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Min Amount"
                      type="number"
                      value={minAmountFilter}
                      onChange={(e) => { setMinAmountFilter(e.target.value); setPage(1); }}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Max Amount"
                      type="number"
                      value={maxAmountFilter}
                      onChange={(e) => { setMaxAmountFilter(e.target.value); setPage(1); }}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<IconFilterOff />}
                      onClick={handleClearFilters}
                      disabled={!search && !statusFilter && !paymentStatusFilter && !companyFilter && !contactFilter && !assignedToFilter && !productFilter && !minAmountFilter && !maxAmountFilter}
                      sx={{ borderRadius: 2 }}
                    >
                      Clear All Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
              </Box>

          <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Deal #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" color="text.secondary">
                        No deals found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map((deal) => (
                      <TableRow key={deal.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {deal.deal_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{deal.title}</Typography>
                        {deal.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {(deal.description || '').substring(0, 50)}{(deal.description || '').length > 50 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{deal.company?.company_name || '-'}</Typography>
                      </TableCell>
                        <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {deal.currency} {Number(deal.total).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Subtotal: {Number(deal.subtotal).toFixed(2)} + VAT: {Number(deal.vat_amount).toFixed(2)}
                        </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                          label={deal.status?.replace('_', ' ')} 
                            size="small"
                          color={getStatusColor(deal.status)}
                          />
                        </TableCell>
                        <TableCell>
                        <Chip 
                          label={deal.payment_status?.replace('_', ' ')} 
                          size="small" 
                          color={getPaymentStatusColor(deal.payment_status)}
                        />
                        {deal.payment_status === 'partial' && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Paid: {Number(deal.paid_amount).toFixed(2)} / {Number(deal.total).toFixed(2)}
                            </Typography>
                        )}
                        </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, deal)}>
                          <IconDotsVertical size={18} />
                        </IconButton>
                        </TableCell>
                      </TableRow>
                  ))
                )}
                  </TableBody>
                </Table>
              </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
          </Box>
          )}
        </Card>
      </Box>

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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete deal "{dealToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DealList;
