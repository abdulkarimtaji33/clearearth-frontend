import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconFilterOff,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconStar,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const TermsList = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchTerms();
  }, [page, rowsPerPage, search, statusFilter, categoryFilter]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await apiService.getTermsAndConditions(params);
      if (response.success) {
        setTerms(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, term) => {
    setAnchorEl(event.currentTarget);
    setSelectedTerm(term);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTerm(null);
  };

  const handleEdit = () => {
    navigate(`/erp/terms/edit/${selectedTerm.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setTermToDelete(selectedTerm);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteTermsAndConditions(termToDelete.id);
      setSuccess('Terms and Conditions deleted successfully');
      setDeleteDialogOpen(false);
      setTermToDelete(null);
      fetchTerms();
    } catch (err) {
      setError(err.message || 'Failed to delete terms and conditions');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <PageContainer title="Terms & Conditions" description="Manage terms and conditions">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Terms & Conditions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage terms and conditions templates
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/terms/create')}
            size="large"
          >
            Add Terms
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
                    placeholder="Search by title or content..."
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
                    <Grid size={{ xs: 12, sm: 8, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Category"
                        placeholder="e.g. Sales, Service"
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
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
                          setCategoryFilter('');
                          setPage(0); 
                        }}
                        disabled={!search && !statusFilter && !categoryFilter}
                        sx={{ borderRadius: 2 }}
                      >
                        Clear All Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Content Preview</TableCell>
                        <TableCell>Default</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {terms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Typography variant="body2" color="textSecondary">
                              No terms and conditions found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        terms.map((term) => (
                          <TableRow key={term.id} hover>
                            <TableCell>
                              <Typography variant="body1" fontWeight="600">
                                {term.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {term.category ? (
                                <Chip label={term.category} size="small" variant="outlined" />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {term.content?.substring(0, 100)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {term.is_default && (
                                <Chip 
                                  icon={<IconStar size={16} />} 
                                  label="Default" 
                                  size="small" 
                                  color="primary" 
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={term.status}
                                size="small"
                                color={term.status === 'active' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, term)}
                              >
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
              </>
            )}
          </CardContent>
        </Card>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItemMui onClick={handleEdit}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItemMui>
          <MenuItemMui onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItemMui>
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{termToDelete?.title}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default TermsList;
