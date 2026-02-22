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
  IconFilterOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const ContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (statusFilter) params.status = statusFilter;

      const response = await apiService.getContacts(params);
      if (response.success) {
        setContacts(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, contact) => {
    setAnchorEl(event.currentTarget);
    setSelectedContact(contact);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContact(null);
  };

  const handleEdit = () => {
    navigate(`/erp/contacts/edit/${selectedContact.id}`);
    handleMenuClose();
  };

  const handleOpenDeleteDialog = () => {
    setContactToDelete(selectedContact);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await apiService.deleteContact(contactToDelete.id);
      setSuccess('Contact deleted successfully!');
      fetchContacts();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
      handleCloseDeleteDialog();
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <PageContainer title="Contacts" description="Manage contacts">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Contacts" description="Manage contacts">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="600" mb={0.5}>
              Contacts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage individual contact persons
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/contacts/create')}
            size="large"
          >
            Add Contact
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
                    placeholder="Search by name, email or phone..."
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
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Job Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {search || statusFilter
                            ? 'No contacts found matching your filters'
                            : 'No contacts yet. Click "Add Contact" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {contact.contact_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {contact.first_name} {contact.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{contact.email || '-'}</TableCell>
                        <TableCell>{contact.phone || contact.mobile || '-'}</TableCell>
                        <TableCell>{contact.job_title || '-'}</TableCell>
                        <TableCell>{contact.department || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={contact.status?.toUpperCase()}
                            size="small"
                            color={contact.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, contact)}>
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
            <Typography variant="h5" mb={1} fontWeight={600}>Delete Contact</Typography>
            <Typography mb={3} color="textSecondary">
              Are you sure you want to delete this contact? This action cannot be undone.
            </Typography>
            {contactToDelete && (
              <Box p={2} mb={3} sx={{ backgroundColor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {contactToDelete.first_name} {contactToDelete.last_name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {contactToDelete.email}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleCloseDeleteDialog} size="large">Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete} size="large">
                Delete Contact
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default ContactList;
