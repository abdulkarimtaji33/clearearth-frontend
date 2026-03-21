import React, { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDotsVertical, IconShield } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getRoles(params);
      if (response.success) {
        setRoles(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleMenuOpen = (event, role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await apiService.deleteRole(selectedRole.id);
      setSuccess('Role deleted');
      setDeleteDialogOpen(false);
      handleMenuClose();
      fetchRoles();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <PageContainer title="Roles" description="Manage roles and permissions">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Roles
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => navigate('/erp/roles/create')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Create Role
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, backgroundColor: 'action.hover' },
                }}
                sx={{ minWidth: 280 }}
              />
            </Stack>

            <Box sx={{ mb: 2 }}>
              <ListDateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(v) => { setDateFrom(v); setPage(0); }}
                onToChange={(v) => { setDateTo(v); setPage(0); }}
                onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                helperText="Created date"
                compact
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Display Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }} color="text.secondary">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{role.name}</Typography>
                        </TableCell>
                        <TableCell>{role.display_name || role.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={role.is_system_role ? 'System' : 'Custom'}
                            color={role.is_system_role ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {role.permissions?.length ?? 0} permissions
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, role)}>
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
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              navigate(`/erp/roles/edit/${selectedRole?.id}`);
              handleMenuClose();
            }}
          >
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          {selectedRole && !selectedRole.is_system_role && (
            <MenuItem
              onClick={() => {
                setDeleteDialogOpen(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <IconTrash size={18} style={{ marginRight: 8 }} />
              Delete
            </MenuItem>
          )}
        </Menu>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete &quot;{selectedRole?.display_name || selectedRole?.name}&quot;? This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default RoleList;
