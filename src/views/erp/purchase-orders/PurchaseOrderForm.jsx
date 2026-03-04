import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const initialItem = () => ({
  productServiceId: null,
  itemDescription: '',
  quantity: '',
  price: '',
  total: '',
});

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [items, setItems] = useState([initialItem()]);
  const [initialValues, setInitialValues] = useState({
    supplierId: null,
    poDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    termsAndConditionsIds: [],
  });

  const isEdit = Boolean(id);

  const fetchData = useCallback(async () => {
    try {
      const [suppliersRes, productsRes, termsRes] = await Promise.all([
        apiService.getSuppliers({ pageSize: 500 }),
        apiService.getProducts({ pageSize: 500, status: 'active' }),
        apiService.getTermsAndConditions({ pageSize: 500, status: 'active' }),
      ]);
      if (suppliersRes.success) setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      if (productsRes.success) setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      if (termsRes.success) setTermsAndConditions(Array.isArray(termsRes.data) ? termsRes.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPO = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getPurchaseOrder(id);
      if (res.success) {
        const po = res.data;
        setInitialValues({
          supplierId: po.supplier_id || null,
          poDate: po.po_date || new Date().toISOString().split('T')[0],
          expectedDelivery: po.expected_delivery || '',
          termsAndConditionsIds: (po.terms || []).map((t) => t.id),
        });
        if (po.items && po.items.length > 0) {
          setItems(
            po.items.map((it) => ({
              productServiceId: it.product_service_id || null,
              itemDescription: it.item_description || '',
              quantity: String(it.quantity ?? ''),
              price: String(it.price ?? ''),
              total: String(it.total ?? ''),
            }))
          );
        } else {
          setItems([initialItem()]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    if (isEdit) fetchPO();
  }, [fetchData, isEdit, fetchPO]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].total = (qty * price).toFixed(2);
    }
    setItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    newItems[index].productServiceId = product?.id || null;
    if (product?.price) newItems[index].price = String(product.price);
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].price) || 0;
    newItems[index].total = (qty * price).toFixed(2);
    setItems(newItems);
  };

  const handleSubmit = async (values) => {
    const invalidItems = items.filter(
      (it) => !it.productServiceId || !it.quantity?.toString().trim() || !it.price?.toString().trim() || !it.total?.toString().trim()
    );
    if (invalidItems.length > 0) {
      setError('All items must have Item, Quantity, Price, and Total');
      return;
    }
    try {
      setError('');
      const payload = {
        supplierId: values.supplierId,
        poDate: values.poDate,
        expectedDelivery: values.expectedDelivery || null,
        termsAndConditionsIds: values.termsAndConditionsIds,
        items: items.map((it) => ({
          productServiceId: it.productServiceId,
          itemDescription: it.itemDescription || null,
          quantity: String(it.quantity),
          price: String(it.price),
          total: String(it.total),
        })),
      };
      if (isEdit) {
        await apiService.updatePurchaseOrder(id, payload);
        setSuccess('Purchase order updated');
      } else {
        await apiService.createPurchaseOrder(payload);
        setSuccess('Purchase order created');
      }
      setTimeout(() => navigate('/erp/purchase-orders'), 1500);
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  if (isEdit && loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'} description={isEdit ? 'Update purchase order' : 'Create new purchase order'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/purchase-orders')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Update purchase order details' : 'Add a new purchase order'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object({
            supplierId: Yup.number().nullable().required('Vendor/Supplier is required'),
            poDate: Yup.string().trim().required('Date is required'),
          })}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Purchase Order Details</Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      fullWidth
                      options={suppliers}
                      getOptionLabel={(opt) => opt.company_name || ''}
                      value={suppliers.find((s) => s.id === values.supplierId) || null}
                      onChange={(_, v) => setFieldValue('supplierId', v?.id || null)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Vendor/Supplier Name (Required)"
                          required
                          error={touched.supplierId && Boolean(errors.supplierId)}
                          helperText={touched.supplierId && errors.supplierId}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <TextField
                      fullWidth
                      label="Date (Required)"
                      name="poDate"
                      type="date"
                      value={values.poDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={touched.poDate && Boolean(errors.poDate)}
                      helperText={touched.poDate && errors.poDate}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 280 }}
                    />

                    <TextField
                      fullWidth
                      label="Expected Delivery (Optional)"
                      name="expectedDelivery"
                      value={values.expectedDelivery}
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight={600}>Items</Typography>
                    <Button startIcon={<IconPlus />} variant="outlined" size="small" onClick={() => setItems([...items, initialItem()])} sx={{ borderRadius: 2 }}>
                      Add Item
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Item (Required)</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Item Description (Optional)</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Quantity (Required)</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Price (Required)</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Total (Required)</TableCell>
                          <TableCell width={60}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                options={products}
                                getOptionLabel={(opt) => opt.name || ''}
                                value={products.find((p) => p.id === row.productServiceId) || null}
                                onChange={(_, v) => handleProductSelect(idx, v)}
                                renderInput={(params) => <TextField {...params} placeholder="Select item" />}
                                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                                sx={{ minWidth: 200 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Description"
                                value={row.itemDescription}
                                onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                                sx={{ minWidth: 180 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Qty"
                                value={row.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                sx={{ width: 90 }}
                                inputProps={{ min: 0 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Price"
                                value={row.price}
                                onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Total"
                                value={row.total}
                                onChange={(e) => handleItemChange(idx, 'total', e.target.value)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0 }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => setItems(items.filter((_, i) => i !== idx))} color="error" disabled={items.length <= 1}>
                                <IconTrash size={18} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Terms & Conditions (Optional)</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Autocomplete
                    multiple
                    fullWidth
                    options={termsAndConditions}
                    getOptionLabel={(opt) => opt.title || ''}
                    value={termsAndConditions.filter((t) => (values.termsAndConditionsIds || []).includes(t.id))}
                    onChange={(_, val) => setFieldValue('termsAndConditionsIds', val ? val.map((t) => t.id) : [])}
                    renderInput={(params) => (
                      <TextField {...params} label="Terms & Conditions" placeholder="Select terms..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    )}
                    renderTags={(val, getTagProps) =>
                      val.map((opt, idx) => (
                        <Chip
                          key={opt.id}
                          label={opt.title}
                          {...getTagProps({ index: idx })}
                          onDelete={getTagProps({ index: idx }).onDelete}
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      ))
                    }
                    isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  />
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2 }}>
                  {isEdit ? 'Update' : 'Create'} Purchase Order
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/erp/purchase-orders')} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default PurchaseOrderForm;
