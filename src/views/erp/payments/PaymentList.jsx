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
  Tabs,
  Tab,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const PaymentList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, search, tabValue]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPayments({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      
      if (response.success) {
        setPayments(response.data.items || response.data);
        setTotalCount(response.data.totalCount || response.data.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, payment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await apiService.deletePayment(selectedPayment.id);
        fetchPayments();
      } catch (err) {
        setError(err.message || 'Failed to delete payment');
      }
    }
    handleMenuClose();
  };

  const getPaymentModeColor = (mode) => {
    const colors = {
      cash: 'success',
      bank_transfer: 'primary',
      cheque: 'warning',
      credit_card: 'info',
    };
    return colors[mode] || 'default';
  };

  return (
    <PageContainer title="Payments" description="Manage payments">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Payments
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/payments/create')}>
            Record Payment
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Payments" />
            <Tab label="Post-Dated Cheques" />
          </Tabs>

          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={20} />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment Mode</TableCell>
                        {tabValue === 1 && <TableCell>Cheque Date</TableCell>}
                        {tabValue === 1 && <TableCell>Status</TableCell>}
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={tabValue === 1 ? 9 : 7} align="center">
                            <Typography>No payments found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment) => (
                          <TableRow key={payment.id} hover>
                            <TableCell>{payment.payment_number || payment.id}</TableCell>
                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.invoice_number || payment.invoice_id}</TableCell>
                            <TableCell>{payment.client_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Typography fontWeight="600">AED {payment.amount?.toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.payment_mode?.replace('_', ' ').toUpperCase()}
                                color={getPaymentModeColor(payment.payment_mode)}
                                size="small"
                              />
                            </TableCell>
                            {tabValue === 1 && <TableCell>{payment.cheque_date ? new Date(payment.cheque_date).toLocaleDateString() : '-'}</TableCell>}
                            {tabValue === 1 && <TableCell>{payment.cheque_status || '-'}</TableCell>}
                            <TableCell>
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, payment)}>
                                <IconDotsVertical />
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
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleDelete}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default PaymentList;
