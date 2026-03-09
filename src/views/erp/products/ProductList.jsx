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
  Menu,
  MenuItem as MenuItemMui,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconFilterOff, IconFilter, IconChevronDown, IconChevronUp, IconDotsVertical } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dropdowns, setDropdowns] = useState({ categories: [], unitsOfMeasure: [] });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, statusFilter, typeFilter, categoryFilter, unitFilter, minPriceFilter, maxPriceFilter]);

  const fetchDropdowns = async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({ 
          categories: response.data.product_categories || [],
          unitsOfMeasure: response.data.units_of_measure || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, pageSize, search };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (unitFilter) params.unitOfMeasure = unitFilter;
      if (minPriceFilter) params.minPrice = minPriceFilter;
      if (maxPriceFilter) params.maxPrice = maxPriceFilter;
      
      const response = await apiService.getProducts(params);
      if (response.success) {
        setProducts(response.data || []);
        setTotalPages(Math.ceil((response.pagination?.totalItems || 0) / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products/services');
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
    setTypeFilter('');
    setCategoryFilter('');
    setUnitFilter('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiService.deleteProduct(productToDelete.id);
      setSuccess('Product/Service deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product/service');
    }
  };

  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleEdit = () => {
    navigate(`/erp/products/edit/${selectedProduct.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setProductToDelete(selectedProduct);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  return (
    <PageContainer title="Products & Services" description="Manage your products and services">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" fontWeight={700}>Products & Services</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage all products and services offered
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => navigate('/erp/products/create')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Add Product/Service
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
                  placeholder="Search products/services by name or description..."
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
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        label="Type"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="product">Product</MenuItem>
                        <MenuItem value="service">Service</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        label="Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        label="Category"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.value}>{cat.display_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={unitFilter}
                        onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }}
                        label="Unit"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.unitsOfMeasure.map((unit) => (
                          <MenuItem key={unit.id} value={unit.value}>{unit.display_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Min Price"
                      type="number"
                      value={minPriceFilter}
                      onChange={(e) => { setMinPriceFilter(e.target.value); setPage(1); }}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Max Price"
                      type="number"
                      value={maxPriceFilter}
                      onChange={(e) => { setMaxPriceFilter(e.target.value); setPage(1); }}
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
                      disabled={!search && !statusFilter && !typeFilter && !categoryFilter && !unitFilter && !minPriceFilter && !maxPriceFilter}
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
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Unit of Measure</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" color="text.secondary">
                        No products/services found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {product.description.substring(0, 60)}{product.description.length > 60 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{product.unit_of_measure || '-'}</TableCell>
                      <TableCell>
                        {product.price ? `${product.currency || 'AED'} ${Number(product.price).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          size="small"
                          color={product.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, product)}>
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
        <DialogTitle>Delete Product/Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
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

export default ProductList;
