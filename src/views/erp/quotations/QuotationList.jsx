import React, { useEffect, useState, useCallback } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({ quotationStatus: [] });

  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await apiService.getAllDropdowns();
      if (res.success) setDropdowns({ quotationStatus: res.data.quotation_status || [] });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;
      const response = await apiService.getQuotations(params);
      if (response.success) {
        setQuotations(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleMenuOpen = (e, q) => {
    setAnchorEl(e.currentTarget);
    setSelectedQuotation(q);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuotation(null);
  };

  const handleDelete = async () => {
    if (!selectedQuotation) return;
    try {
      await apiService.deleteQuotation(selectedQuotation.id);
      setSuccess('Quotation deleted');
      setDeleteDialogOpen(false);
      setSelectedQuotation(null);
      fetchQuotations();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const statusLabel = (v) => dropdowns.quotationStatus.find((s) => s.value === v)?.display_name || v;

  return (
    <PageContainer title="Quotations" description="Manage quotations">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={600} mb={0.5}>
              Quotations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage quotations linked to deals
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/quotations/create')} size="large">
            Add Quotation
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by deal title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ maxWidth: 320 }}
              />
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 140 }}
                SelectProps={{ native: true }}
              >
                <option value="">All</option>
                {dropdowns.quotationStatus.map((s) => (
                  <option key={s.id} value={s.value}>{s.display_name}</option>
                ))}
              </TextField>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Deal</strong></TableCell>
                    <TableCell><strong>Prepared By</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="right"><strong>Amount (AED)</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : quotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }} color="text.secondary">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotations.map((q) => (
                      <TableRow key={q.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/quotations/edit/${q.id}`)}>
                        <TableCell>{q.deal?.title || q.deal?.deal_number || '-'}</TableCell>
                        <TableCell>
                          {q.preparedByUser ? `${q.preparedByUser.first_name || ''} ${q.preparedByUser.last_name || ''}`.trim() : '-'}
                        </TableCell>
                        <TableCell>{q.quotation_date || '-'}</TableCell>
                        <TableCell align="right">{parseFloat(q.quotation_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{statusLabel(q.status)}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, q)}>
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
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Quotation</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this quotation?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { navigate(`/erp/quotations/edit/${selectedQuotation?.id}`); handleMenuClose(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <IconTrash size={18} style={{ marginRight: 8 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default QuotationList;
