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
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconFilterOff, IconFilter, IconChevronDown, IconChevronUp, IconDotsVertical, IconPackage } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const ProductList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dropdowns, setDropdowns] = useState({ categories: [], unitsOfMeasure: [] });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const pageSize = 10;

  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => { fetchProducts(); }, [page, search, statusFilter, typeFilter, categoryFilter, unitFilter, minPriceFilter, maxPriceFilter, dateFrom, dateTo]);

  const fetchDropdowns = async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({ categories: response.data.product_categories || [], unitsOfMeasure: response.data.units_of_measure || [] });
      }
    } catch (err) { console.error(err); }
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
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getProducts(params);
      if (response.success) {
        setProducts(response.data || []);
        const total = response.pagination?.totalItems || 0;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products/services');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch(''); setStatusFilter(''); setTypeFilter(''); setCategoryFilter('');
    setUnitFilter(''); setMinPriceFilter(''); setMaxPriceFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiService.deleteProduct(productToDelete.id);
      setSuccess('Product/Service deleted');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const hasFilters = search || statusFilter || typeFilter || categoryFilter || unitFilter || minPriceFilter || maxPriceFilter || dateFrom || dateTo;

  return (
    <PageContainer title="Products & Services" description="Manage your products and services">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPackage size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Products & Services</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'Manage catalog items'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/products/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Product
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search products & services..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                  <IconButton size="small" onClick={handleClearFilters} sx={{ color: 'error.main' }}>
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
                      <InputLabel>Type</InputLabel>
                      <Select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} label="Type" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="product">Product</MenuItem>
                        <MenuItem value="service">Service</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} label="Status" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} label="Category" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.categories.map(c => <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Unit</InputLabel>
                      <Select value={unitFilter} onChange={e => { setUnitFilter(e.target.value); setPage(1); }} label="Unit" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        {dropdowns.unitsOfMeasure.map(u => <MenuItem key={u.id} value={u.value}>{u.display_name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" label="Min Price" type="number" value={minPriceFilter} onChange={e => { setMinPriceFilter(e.target.value); setPage(1); }} inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" label="Max Price" type="number" value={maxPriceFilter} onChange={e => { setMaxPriceFilter(e.target.value); setPage(1); }} inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={12}>
                    <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(1); }} onToChange={v => { setDateTo(v); setPage(1); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }} helperText="Created date" compact />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
                  {['Name', 'Category', 'Unit', 'Price (AED)', 'Status', ''].map((h, i) => (
                    <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} /></TableCell></TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <IconPackage size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No products/services found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map(product => (
                    <TableRow key={product.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.02) } }} onClick={() => navigate(`/erp/products/edit/${product.id}`)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                        {product.description && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 240, display: 'block' }}>{product.description.substring(0, 60)}{product.description.length > 60 ? '…' : ''}</Typography>}
                      </TableCell>
                      <TableCell><Chip label={product.category} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{product.unit_of_measure || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{product.price ? Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</Typography></TableCell>
                      <TableCell><Chip label={product.status} size="small" color={product.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedProduct(product); }} sx={{ borderRadius: 1.5 }}>
                          <IconDotsVertical size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
            </Box>
          )}
        </Card>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedProduct(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}>
        <MenuItemMui onClick={() => { navigate(`/erp/products/edit/${selectedProduct?.id}`); setAnchorEl(null); }}>
          <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
        </MenuItemMui>
        <MenuItemMui onClick={() => { setProductToDelete(selectedProduct); setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
        </MenuItemMui>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Delete Product/Service</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete <strong>"{productToDelete?.name}"</strong>? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProductList;
