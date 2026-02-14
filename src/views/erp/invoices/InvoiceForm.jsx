import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  client_id: Yup.number().required('Client is required'),
  invoice_type: Yup.string().required('Invoice type is required'),
  invoice_date: Yup.date().required('Invoice date is required'),
  due_date: Yup.date().required('Due date is required'),
  items: Yup.array().of(
    Yup.object({
      description: Yup.string().required('Description is required'),
      quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      unit_price: Yup.number().min(0, 'Price must be positive').required('Unit price is required'),
    })
  ).min(1, 'At least one item is required'),
});

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [initialValues, setInitialValues] = useState({
    client_id: '',
    invoice_type: 'sales',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 30,
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0, vat_type: 'standard' }],
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await apiService.getClients({ pageSize: 100 });
      if (response.success) {
        setClients(response.data.items || response.data);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInvoice(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateInvoice(id, values);
      } else {
        await apiService.createInvoice(values);
      }
      navigate('/erp/invoices');
    } catch (err) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateItemTotal = (item) => {
    return (item.quantity || 0) * (item.unit_price || 0);
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = (items) => {
    return items.reduce((sum, item) => {
      const total = calculateItemTotal(item);
      return sum + (item.vat_type === 'standard' ? total * 0.05 : 0);
    }, 0);
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Invoice' : 'Create Invoice'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Invoice' : 'Create Invoice'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/invoices')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Invoice' : 'Create Invoice'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <Typography variant="h6" mb={2}>Invoice Details</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        options={clients}
                        getOptionLabel={(option) => option.client_type === 'company' ? option.company_name : `${option.first_name} ${option.last_name}`}
                        value={clients.find(c => c.id === values.client_id) || null}
                        onChange={(e, value) => setFieldValue('client_id', value?.id || '')}
                        renderInput={(params) => (
                          <TextField {...params} label="Client" error={touched.client_id && Boolean(errors.client_id)} helperText={touched.client_id && errors.client_id} />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth select label="Invoice Type" name="invoice_type" value={values.invoice_type} onChange={handleChange} onBlur={handleBlur} error={touched.invoice_type && Boolean(errors.invoice_type)} helperText={touched.invoice_type && errors.invoice_type}>
                        <MenuItem value="sales">Sales Invoice</MenuItem>
                        <MenuItem value="proforma">Proforma Invoice</MenuItem>
                        <MenuItem value="commercial">Commercial Invoice</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Invoice Date" name="invoice_date" type="date" InputLabelProps={{ shrink: true }} value={values.invoice_date} onChange={handleChange} onBlur={handleBlur} error={touched.invoice_date && Boolean(errors.invoice_date)} helperText={touched.invoice_date && errors.invoice_date} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Due Date" name="due_date" type="date" InputLabelProps={{ shrink: true }} value={values.due_date} onChange={handleChange} onBlur={handleBlur} error={touched.due_date && Boolean(errors.due_date)} helperText={touched.due_date && errors.due_date} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Payment Terms (days)" name="payment_terms" type="number" value={values.payment_terms} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Typography variant="h6" mb={2} mt={2}>Invoice Items</Typography>
                    </Grid>

                    <Grid size={12}>
                      <FieldArray name="items">
                        {({ push, remove }) => (
                          <Box>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell width="120">Quantity</TableCell>
                                  <TableCell width="150">Unit Price</TableCell>
                                  <TableCell width="120">VAT Type</TableCell>
                                  <TableCell width="120">Total</TableCell>
                                  <TableCell width="60">Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {values.items.map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        name={`items.${index}.description`}
                                        value={item.description}
                                        onChange={handleChange}
                                        error={touched.items?.[index]?.description && Boolean(errors.items?.[index]?.description)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        name={`items.${index}.quantity`}
                                        value={item.quantity}
                                        onChange={handleChange}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        name={`items.${index}.unit_price`}
                                        value={item.unit_price}
                                        onChange={handleChange}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        select
                                        name={`items.${index}.vat_type`}
                                        value={item.vat_type || 'standard'}
                                        onChange={handleChange}
                                      >
                                        <MenuItem value="standard">Standard (5%)</MenuItem>
                                        <MenuItem value="zero">Zero Rated</MenuItem>
                                        <MenuItem value="exempt">Exempt</MenuItem>
                                      </TextField>
                                    </TableCell>
                                    <TableCell>
                                      <Typography>AED {calculateItemTotal(item).toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <IconButton size="small" onClick={() => remove(index)} disabled={values.items.length === 1}>
                                        <IconTrash size={18} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Button
                              startIcon={<IconPlus />}
                              onClick={() => push({ description: '', quantity: 1, unit_price: 0, vat_type: 'standard' })}
                              sx={{ mt: 2 }}
                            >
                              Add Item
                            </Button>

                            <Box mt={3} display="flex" justifyContent="flex-end">
                              <Box width="300px">
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography>Subtotal:</Typography>
                                  <Typography fontWeight="600">AED {calculateSubtotal(values.items).toFixed(2)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography>VAT (5%):</Typography>
                                  <Typography fontWeight="600">AED {calculateVAT(values.items).toFixed(2)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" borderTop="2px solid" pt={1}>
                                  <Typography variant="h6">Total:</Typography>
                                  <Typography variant="h6" fontWeight="700">
                                    AED {(calculateSubtotal(values.items) + calculateVAT(values.items)).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </FieldArray>
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Notes" name="notes" multiline rows={2} value={values.notes} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/invoices')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Invoice' : 'Create Invoice'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InvoiceForm;
