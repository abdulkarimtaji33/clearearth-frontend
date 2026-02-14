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
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const LeadList = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [page, rowsPerPage, search]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeads({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      if (response.success) {
        setLeads(response.data.items || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const handleQualify = async (id) => {
    try {
      await apiService.qualifyLead(id, {});
      fetchLeads();
    } catch (err) {
      setError(err.message || 'Failed to qualify lead');
    }
  };

  const handleConvert = async (id) => {
    try {
      await apiService.convertLead(id, {});
      fetchLeads();
      navigate('/erp/deals');
    } catch (err) {
      setError(err.message || 'Failed to convert lead');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'primary';
      case 'qualified':
        return 'success';
      case 'disqualified':
        return 'error';
      case 'converted':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && leads.length === 0) {
    return (
      <PageContainer title="Leads" description="Manage leads">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Leads" description="Manage leads">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Leads
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/erp/leads/create')}
          >
            Add Lead
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search leads..."
                value={search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lead Source</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Service Interest</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.lead_source}</TableCell>
                      <TableCell>{`${lead.first_name} ${lead.last_name}`}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.service_interest}</TableCell>
                      <TableCell>
                        <Chip label={lead.status} size="small" color={getStatusColor(lead.status)} />
                      </TableCell>
                      <TableCell>{lead.assigned_to_name || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, lead)}>
                          <IconDotsVertical size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
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
          <MenuItem onClick={() => { navigate(`/erp/leads/edit/${selectedLead?.id}`); handleMenuClose(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          {selectedLead?.status === 'new' && (
            <MenuItem
              onClick={() => {
                handleQualify(selectedLead.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Qualify
            </MenuItem>
          )}
          {selectedLead?.status === 'qualified' && (
            <MenuItem
              onClick={() => {
                handleConvert(selectedLead.id);
                handleMenuClose();
              }}
            >
              <IconRefresh size={18} style={{ marginRight: 8 }} />
              Convert to Deal
            </MenuItem>
          )}
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default LeadList;
