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
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Stack,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical, IconFilterOff, IconFilter, IconChevronDown, IconChevronUp, IconStar, IconFileText } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const TermsList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => { fetchTerms(); }, [page, rowsPerPage, search, statusFilter, categoryFilter, dateFrom, dateTo]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getTermsAndConditions(params);
      if (response.success) {
        setTerms(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteTermsAndConditions(termToDelete.id);
      setSuccess('Term deleted');
      setDeleteDialogOpen(false);
      setTermToDelete(null);
      fetchTerms();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const hasFilters = search || statusFilter || categoryFilter || dateFrom || dateTo;

  return (
    <PageContainer title="Terms & Conditions" description="Manage terms and conditions templates">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconFileText size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Terms & Conditions</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} template${totalCount !== 1 ? 's' : ''}` : 'Reusable T&C templates for deals and orders'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/terms/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Add Terms
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search by title or content..."
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
                  <IconButton size="small" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setDateFrom(''); setDateTo(''); setPage(0); }} sx={{ color: 'error.main' }}>
                    <IconFilterOff size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Collapse in={filtersExpanded}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Status" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth size="small" label="Category" placeholder="e.g. Sales, Service" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={12}>
                    <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Created date" compact />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.04) }}>
                      {['Title', 'Category', 'Preview', 'Default', 'Status', ''].map((h, i) => (
                        <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {terms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <IconFileText size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                          <Typography variant="body2" color="text.secondary">No terms and conditions found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      terms.map(term => (
                        <TableRow key={term.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.02) } }} onClick={() => navigate(`/erp/terms/edit/${term.id}`)}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{term.title}</Typography>
                          </TableCell>
                          <TableCell>
                            {term.category ? <Chip label={term.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} /> : <Typography variant="body2" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {term.content?.substring(0, 100)}{(term.content?.length || 0) > 100 ? '…' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {term.is_default && <Chip icon={<IconStar size={14} />} label="Default" size="small" color="warning" sx={{ fontWeight: 600 }} />}
                          </TableCell>
                          <TableCell>
                            <Chip label={term.status} size="small" color={term.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="right" onClick={e => e.stopPropagation()}>
                            <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedTerm(term); }} sx={{ borderRadius: 1.5 }}>
                              <IconDotsVertical size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} />
            </>
          )}
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedTerm(null); }} PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}>
          <MenuItemMui onClick={() => { navigate(`/erp/terms/edit/${selectedTerm?.id}`); setAnchorEl(null); }}>
            <IconEdit size={16} style={{ marginRight: 10 }} /> Edit
          </MenuItemMui>
          <MenuItemMui onClick={() => { setTermToDelete(selectedTerm); setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <IconTrash size={16} style={{ marginRight: 10 }} /> Delete
          </MenuItemMui>
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete Term</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete <strong>"{termToDelete?.title}"</strong>? This cannot be undone.</DialogContentText></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default TermsList;
