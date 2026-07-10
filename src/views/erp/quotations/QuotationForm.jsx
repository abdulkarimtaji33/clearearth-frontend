import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import UomSelectField from '../../../components/erp/UomSelectField';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canChangeRecordStatus, formatStatusLabel } from '../../../utils/recordStatus';

const QUOTABLE_DEAL_STATUSES = ['approved', 'quotation_sent', 'negotiation', 'won'];

const initialLineItem = () => ({
  productServiceId: null,
  productName: '',
  notes: '',
  quantity: '',
  unitOfMeasure: '',
  unitPrice: '',
  lineTotal: '',
});

const validationSchema = Yup.object({
  dealId: Yup.number().nullable().required('Deal is required'),
  preparedBy: Yup.number().nullable().required('Prepared by is required'),
  quotationDate: Yup.string().trim().required('Quotation date is required'),
  quotationAmount: Yup.string().trim().required('Quotation amount is required'),
  status: Yup.string().trim().required('Status is required'),
  remarks: Yup.string().trim().nullable(),
});

const QuotationForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canChangeStatus = canChangeRecordStatus(user, hasPermission, 'quotations.approve');
  const dealIdFromUrl = searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [addTermsDialogOpen, setAddTermsDialogOpen] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [newTermsValues, setNewTermsValues] = useState({ title: '', content: '', category: '' });
  const [newTermsErrors, setNewTermsErrors] = useState({});
  const setFieldValueRef = useRef(null);
  const valuesRef = useRef({});
  const [lineItems, setLineItems] = useState([]);
  const [dealMeta, setDealMeta] = useState({ vatPercentage: 5, dealType: 'offer_to_charge' });
  const [dropdowns, setDropdowns] = useState({ quotationStatus: [], unitsOfMeasure: [] });
  const [initialValues, setInitialValues] = useState({
    dealId: dealIdFromUrl || null,
    preparedBy: null,
    quotationDate: new Date().toISOString().split('T')[0],
    quotationAmount: '',
    status: 'new',
    remarks: '',
    termsAndConditionsIds: [],
  });

  const isEdit = Boolean(id);

  const recalcQuotationAmount = useCallback((items, vatPct, dealType) => {
    if (dealType === 'free_of_charge') return '0.00';
    const sub = items.reduce((sum, item) => sum + parseFloat(item.lineTotal || 0), 0);
    const vat = (sub * parseFloat(vatPct || 5)) / 100;
    return (sub + vat).toFixed(2);
  }, []);

  const applyDealToForm = useCallback((deal, onAmount) => {
    if (!deal) return;
    const dealType = deal.deal_type || 'offer_to_charge';
    const vatPct = deal.vat_percentage || 5;
    setDealMeta({ vatPercentage: vatPct, dealType });

    const items = (deal.items && deal.items.length > 0)
      ? deal.items.map((it) => ({
          productServiceId: it.product_service_id || it.productService?.id || null,
          productName: it.productService?.name || '',
          notes: it.notes || '',
          quantity: String(it.quantity ?? ''),
          unitOfMeasure: it.unit_of_measure || it.productService?.unit_of_measure || '',
          unitPrice: String(it.unit_price ?? ''),
          lineTotal: String(it.line_total ?? ''),
        }))
      : [initialLineItem()];

    setLineItems(items);

    const termsIds = (deal.termsList && deal.termsList.length > 0)
      ? deal.termsList.map((t) => t.id)
      : (deal.terms_and_conditions_id ? [deal.terms_and_conditions_id] : []);

    const total = recalcQuotationAmount(items, vatPct, dealType);
    setInitialValues((prev) => ({
      ...prev,
      dealId: deal.id,
      quotationAmount: total || prev.quotationAmount,
      termsAndConditionsIds: termsIds,
    }));
    if (onAmount && total) onAmount(total);
    setFieldValueRef.current?.('termsAndConditionsIds', termsIds);
  }, [recalcQuotationAmount]);

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, usersRes, productsRes, termsRes, dropdownRes] = await Promise.all([
        apiService.getDeals({ pageSize: 500 }),
        apiService.getAssignees(),
        apiService.getProducts({ pageSize: 500, status: 'active' }),
        apiService.getTermsAndConditions({ pageSize: 500, status: 'active' }),
        apiService.getAllDropdowns(),
      ]);
      if (dealsRes.success) {
        const allDeals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
        setDeals(allDeals.filter((d) => QUOTABLE_DEAL_STATUSES.includes(String(d.status || '').toLowerCase())));
      }
      if (usersRes.success) setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
      if (productsRes.success) setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || []);
      if (termsRes.success) setTermsAndConditions(Array.isArray(termsRes.data) ? termsRes.data : termsRes.data?.items || []);
      if (dropdownRes.success) {
        setDropdowns({
          quotationStatus: dropdownRes.data.quotation_status || [],
          unitsOfMeasure: dropdownRes.data.units_of_measure || [],
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getQuotation(id);
      if (res.success) {
        const q = res.data;
        setInitialValues({
          dealId: q.deal_id || null,
          preparedBy: q.prepared_by || null,
          quotationDate: q.quotation_date || new Date().toISOString().split('T')[0],
          quotationAmount: String(q.quotation_amount ?? ''),
          status: q.status || 'new',
          remarks: q.remarks || '',
          termsAndConditionsIds: [],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDealForPreFill = useCallback(async (dealId, onAmount) => {
    if (!dealId) return;
    try {
      const res = await apiService.getDeal(dealId);
      if (res.success && res.data) {
        if (!QUOTABLE_DEAL_STATUSES.includes(String(res.data.status || '').toLowerCase())) {
          setError('This deal must be approved before creating a quotation');
          setInitialValues((prev) => ({ ...prev, dealId: null }));
          setLineItems([]);
          return;
        }
        applyDealToForm(res.data, onAmount);
      }
    } catch (err) {
      console.error(err);
    }
  }, [applyDealToForm]);

  const handleCreateTerms = async () => {
    const errors = {};
    if (!newTermsValues.title?.trim()) errors.title = 'Required';
    if (!newTermsValues.content?.trim()) errors.content = 'Required';
    setNewTermsErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSavingTerms(true);
      const res = await apiService.createTermsAndConditions({
        title: newTermsValues.title.trim(),
        content: newTermsValues.content.trim(),
        category: newTermsValues.category?.trim() || undefined,
        isDefault: false,
        status: 'active',
      });
      const created = res.data;
      setTermsAndConditions((prev) => [...prev, created]);
      const currentIds = valuesRef.current?.termsAndConditionsIds || [];
      setFieldValueRef.current?.('termsAndConditionsIds', [...currentIds, created.id]);
      setNewTermsValues({ title: '', content: '', category: '' });
      setAddTermsDialogOpen(false);
      setNewTermsErrors({});
    } catch (err) {
      setNewTermsErrors({ submit: err.message || 'Failed to create terms and conditions' });
    } finally {
      setSavingTerms(false);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].unitPrice || 0);
      newItems[index].lineTotal = (qty * price).toFixed(2);
    }
    setLineItems(newItems);
    const amount = recalcQuotationAmount(newItems, dealMeta.vatPercentage, dealMeta.dealType);
    setFieldValueRef.current?.('quotationAmount', amount);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...lineItems];
    newItems[index].productServiceId = product?.id || null;
    newItems[index].productName = product?.name || '';
    if (product?.price != null) newItems[index].unitPrice = String(product.price);
    newItems[index].unitOfMeasure = product?.unit_of_measure || '';
    const qty = parseFloat(newItems[index].quantity || 0);
    const price = parseFloat(newItems[index].unitPrice || 0);
    newItems[index].lineTotal = (qty * price).toFixed(2);
    setLineItems(newItems);
    const amount = recalcQuotationAmount(newItems, dealMeta.vatPercentage, dealMeta.dealType);
    setFieldValueRef.current?.('quotationAmount', amount);
  };

  useEffect(() => {
    if (isEdit && id) {
      navigate(`/erp/quotations/view/${id}`, { replace: true });
    }
  }, [isEdit, id, navigate]);

  useEffect(() => {
    fetchData();
    if (isEdit) fetchQuotation();
    else if (dealIdFromUrl) {
      setInitialValues((prev) => ({ ...prev, dealId: dealIdFromUrl }));
      fetchDealForPreFill(dealIdFromUrl);
    }
  }, [fetchData, isEdit, fetchQuotation, dealIdFromUrl, fetchDealForPreFill]);

  useEffect(() => {
    if (isEdit || !user?.id) return;
    setInitialValues((prev) => (prev.preparedBy ? prev : { ...prev, preparedBy: user.id }));
  }, [isEdit, user?.id]);

  const handleSubmit = async (values) => {
    try {
      setError('');
      const deal = deals.find((d) => d.id === values.dealId);
      if (!deal && values.dealId) {
        const dealRes = await apiService.getDeal(values.dealId);
        if (!dealRes.success || !dealRes.data) {
          setError('Selected deal must be approved before creating a quotation');
          return;
        }
      }

      const missingUomIndex = lineItems.findIndex((item) => !item.unitOfMeasure?.toString().trim());
      if (missingUomIndex >= 0) {
        setError(`Line item ${missingUomIndex + 1}: Unit of measure (UOM) is required`);
        return;
      }

      const invalidItems = lineItems.filter(
        (it) => !it.productServiceId || !it.quantity?.toString().trim() || !it.unitPrice?.toString().trim()
      );
      if (invalidItems.length > 0) {
        setError('All line items must have Item, Quantity, UOM, and Unit Price');
        return;
      }

      await apiService.updateDeal(values.dealId, {
        items: lineItems.map((item) => ({
          productServiceId: item.productServiceId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          unitOfMeasure: item.unitOfMeasure?.toString().trim() || null,
          notes: item.notes?.toString().trim() || null,
        })),
        termsAndConditionsIds: values.termsAndConditionsIds || [],
      });

      const payload = {
        dealId: values.dealId,
        preparedBy: values.preparedBy,
        quotationDate: values.quotationDate,
        quotationAmount: parseFloat(values.quotationAmount) || 0,
        ...(canChangeStatus ? { status: values.status } : {}),
        remarks: values.remarks || null,
      };
      let savedQuotation;
      if (isEdit) {
        const res = await apiService.updateQuotation(id, payload);
        savedQuotation = res.data;
        setSuccess('Service quotation updated');
      } else {
        const res = await apiService.createQuotation(payload);
        savedQuotation = res.data;
        setSuccess('Service quotation created');
      }

      const quotationId = savedQuotation?.id || (isEdit ? Number(id) : null);
      if (quotationId) {
        navigate(`/erp/quotations/view/${quotationId}`);
      } else {
        navigate('/erp/quotations');
      }
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
    <PageContainer title={isEdit ? 'Edit Service Quotation' : 'Create Service Quotation'} description={isEdit ? 'Set Approved for service order PDF' : 'After approval, download PDF is a service order'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/quotations')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit Service Quotation' : 'Create Service Quotation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Set status to Approved to download a service order PDF' : 'Line items and terms are saved to the linked deal'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
            setFieldValueRef.current = setFieldValue;
            valuesRef.current = values;
            return (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Service Quotation Details</Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      fullWidth
                      options={deals}
                      getOptionLabel={(opt) => opt.title || opt.deal_number || ''}
                      value={deals.find((d) => d.id === values.dealId) || null}
                      onChange={(_, v) => {
                        setFieldValue('dealId', v?.id || null);
                        if (v?.id) fetchDealForPreFill(v.id, (amount) => setFieldValue('quotationAmount', amount));
                        else {
                          setLineItems([]);
                          setFieldValue('termsAndConditionsIds', []);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Deal Name (Required)" required error={touched.dealId && Boolean(errors.dealId)} helperText={touched.dealId && errors.dealId} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <Autocomplete
                      fullWidth
                      options={users}
                      getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || opt.email || ''}
                      value={users.find((u) => u.id === values.preparedBy) || null}
                      onChange={(_, v) => setFieldValue('preparedBy', v?.id || null)}
                      renderInput={(params) => (
                        <TextField {...params} label="Prepared By (Required)" required error={touched.preparedBy && Boolean(errors.preparedBy)} helperText={touched.preparedBy && errors.preparedBy} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <TextField
                      fullWidth
                      label="Quotation Date (Required)"
                      name="quotationDate"
                      type="date"
                      value={values.quotationDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.quotationDate && Boolean(errors.quotationDate)}
                      helperText={touched.quotationDate && errors.quotationDate}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Quotation Amount (AED) (Required)"
                      name="quotationAmount"
                      type="number"
                      value={values.quotationAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.quotationAmount && Boolean(errors.quotationAmount)}
                      helperText={(touched.quotationAmount && errors.quotationAmount) || 'Auto-calculated from line items and deal VAT'}
                      required
                      placeholder="0.00"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {canChangeStatus ? (
                      <TextField
                        fullWidth
                        select
                        label="Status (Required)"
                        name="status"
                        value={values.status || 'new'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status && errors.status}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}
                      >
                        {(dropdowns.quotationStatus?.length ? dropdowns.quotationStatus : [
                          { id: 1, value: 'new', display_name: 'New' },
                          { id: 2, value: 'sent', display_name: 'Sent' },
                          { id: 3, value: 'rejected', display_name: 'Rejected' },
                        ])
                          .filter((s) => !['approved', 'pending_approval'].includes(s.value))
                          .map((s) => (
                            <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                          ))}
                        {values.status === 'pending_approval' && (
                          <MenuItem value="pending_approval" disabled>Pending Approval</MenuItem>
                        )}
                        {values.status === 'approved' && (
                          <MenuItem value="approved" disabled>Approved</MenuItem>
                        )}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        label="Status"
                        value={formatStatusLabel(values.status || 'new')}
                        disabled
                        helperText="Status is managed through the approval workflow"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Remarks (Optional)"
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight={600}>Line Items</Typography>
                    <Button
                      startIcon={<IconPlus />}
                      variant="outlined"
                      size="small"
                      disabled={!values.dealId}
                      onClick={() => setLineItems([...lineItems, initialLineItem()])}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Item
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {!values.dealId ? (
                    <Typography variant="body2" color="text.secondary">Select a deal to load line items.</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Item (Required)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Quantity (Required)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>UOM (Required)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Unit Price (Required)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                            <TableCell width={60} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lineItems.map((row, idx) => (
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
                                  placeholder="Brief description"
                                  value={row.notes || ''}
                                  onChange={(e) => handleLineItemChange(idx, 'notes', e.target.value)}
                                  inputProps={{ maxLength: 500 }}
                                  sx={{ minWidth: 160 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder="Qty"
                                  value={row.quantity}
                                  onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                  sx={{ width: 90 }}
                                  inputProps={{ min: 0, step: 'any' }}
                                />
                              </TableCell>
                              <TableCell>
                                <UomSelectField
                                  value={row.unitOfMeasure || ''}
                                  onChange={(v) => handleLineItemChange(idx, 'unitOfMeasure', v)}
                                  unitsOfMeasure={dropdowns.unitsOfMeasure || []}
                                  onUnitsChange={(next) => setDropdowns((d) => ({ ...d, unitsOfMeasure: next }))}
                                  minWidth={110}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder="Price"
                                  value={row.unitPrice}
                                  onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                                  sx={{ width: 100 }}
                                  inputProps={{ min: 0, step: 0.01 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.lineTotal}
                                  disabled
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const next = lineItems.filter((_, i) => i !== idx);
                                    setLineItems(next);
                                    const amount = recalcQuotationAmount(next, dealMeta.vatPercentage, dealMeta.dealType);
                                    setFieldValueRef.current?.('quotationAmount', amount);
                                  }}
                                  color="error"
                                  disabled={lineItems.length <= 1}
                                >
                                  <IconTrash size={18} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Terms & Conditions (Optional)</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box position="relative">
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
                          <Chip key={opt.id} label={opt.title} {...getTagProps({ index: idx })} size="small" sx={{ borderRadius: 1 }} />
                        ))
                      }
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />
                    <Box sx={{ position: 'absolute', top: -8, right: 12, backgroundColor: 'background.paper', px: 1, zIndex: 1 }}>
                      <Button
                        size="small"
                        onClick={() => { setError(''); setAddTermsDialogOpen(true); }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          minWidth: 'auto',
                          px: 0.5,
                          py: 0,
                          color: 'primary.main',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                        }}
                      >
                        + Add New
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2 }}>
                  {isEdit ? 'Update' : 'Create'} Service Quotation
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/erp/quotations')} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
              </Box>
            </form>
            );
          }}
        </Formik>

        <Dialog open={addTermsDialogOpen} onClose={() => setAddTermsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>
            <Typography variant="h4" fontWeight={700}>Add Terms & Conditions</Typography>
          </DialogTitle>
          <DialogContent>
            {newTermsErrors.submit && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{newTermsErrors.submit}</Alert>}
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                required
                value={newTermsValues.title}
                onChange={(e) => setNewTermsValues((v) => ({ ...v, title: e.target.value }))}
                error={Boolean(newTermsErrors.title)}
                helperText={newTermsErrors.title}
                placeholder="e.g. Standard Service Terms"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Category (Optional)"
                value={newTermsValues.category}
                onChange={(e) => setNewTermsValues((v) => ({ ...v, category: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Content"
                required
                multiline
                minRows={5}
                value={newTermsValues.content}
                onChange={(e) => setNewTermsValues((v) => ({ ...v, content: e.target.value }))}
                error={Boolean(newTermsErrors.content)}
                helperText={newTermsErrors.content}
                placeholder="Enter the full terms and conditions text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => { setAddTermsDialogOpen(false); setNewTermsErrors({}); }} sx={{ minWidth: 120, borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" disabled={savingTerms} onClick={handleCreateTerms} sx={{ minWidth: 150, borderRadius: 2 }}>
              {savingTerms ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default QuotationForm;
