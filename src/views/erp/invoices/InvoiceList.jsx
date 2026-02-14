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
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconEye, IconFileInvoice } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, search]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInvoices({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      if (response.success) {
        setInvoices(response.data.items || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      draft: 'default',
      pending_approval: 'warning',
      approved: 'info',
      sent: 'primary',
      partially_paid: 'warning',
      paid: 'success',
      overdue: 'error',
      cancelled: 'error',
    };
    return statusMap[status] || 'default';
  };

  if (loading && invoices.length === 0) {
    return (
      <PageContainer title="Invoices" description="Manage invoices">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Invoices" description="Manage invoices">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Invoices
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/invoices/create')}>
            Create Invoice
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search invoices..."
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
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Invoice Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Amount Paid</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell fontWeight="600">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client_name || '-'}</TableCell>
                      <TableCell>
                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>AED {(invoice.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>AED {(invoice.amount_paid || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={invoice.status} size="small" color={getStatusColor(invoice.status)} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate(`/erp/invoices/view/${invoice.id}`)}>
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => navigate(`/erp/invoices/edit/${invoice.id}`)}>
                          <IconEdit size={18} />
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
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InvoiceList;
