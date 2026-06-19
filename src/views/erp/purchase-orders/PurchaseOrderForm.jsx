import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash, IconFileDownload } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canChangeRecordStatus, formatStatusLabel } from '../../../utils/recordStatus';
import { billListPath } from '../../../utils/purchaseBills';

const CLIENT_PO_APPROVAL_ELIGIBLE = ['new', 'sent', 'under_review', 'revised'];

const initialItem = () => ({
  productServiceId: null,
  itemDescription: '',
  quantity: '',
  price: '',
  total: '',
});

const quotationListPath = (companyId, supplierId) => {
  if (companyId) return '/erp/client-purchase-quotations';
  if (supplierId) return '/erp/vendor-purchase-quotations';
  return '/erp/client-purchase-quotations';
};

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canChangeStatus = canChangeRecordStatus(user, hasPermission, 'purchase_orders.approve');
  const supplierIdFromUrl = searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId'), 10) : null;
  const companyIdFromUrl = searchParams.get('companyId') ? parseInt(searchParams.get('companyId'), 10) : null;
  const dealIdFromUrl = searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null;
  const workOrderIdFromUrl = searchParams.get('workOrderId') ? parseInt(searchParams.get('workOrderId'), 10) : null;
  const billFromUrl = searchParams.get('bill') === '1';
  const [isBillMode, setIsBillMode] = useState(billFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deals, setDeals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [dropdowns, setDropdowns] = useState({ purchaseOrderStatus: [] });
  const [items, setItems] = useState([initialItem()]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [savedPoId, setSavedPoId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [initialValues, setInitialValues] = useState({
    dealId: dealIdFromUrl || null,
    companyId: companyIdFromUrl || null,
    supplierId: supplierIdFromUrl || null,
    poDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    status: supplierIdFromUrl ? 'approved' : 'new',
    termsAndConditionsIds: [],
  });

  const isEdit = Boolean(id);

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, companiesRes, suppliersRes, productsRes, termsRes, dropdownRes] = await Promise.all([
        apiService.getDeals({ pageSize: 500 }),
        apiService.getCompanies({ pageSize: 500 }),
        apiService.getSuppliers({ pageSize: 500 }),
        apiService.getProducts({ pageSize: 500, status: 'active' }),
        apiService.getTermsAndConditions({ pageSize: 500, status: 'active' }),
        apiService.getAllDropdowns(),
      ]);
      if (dealsRes.success) setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
      if (companiesRes.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      if (suppliersRes.success) setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      if (productsRes.success) setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      if (termsRes.success) setTermsAndConditions(Array.isArray(termsRes.data) ? termsRes.data : []);
      if (dropdownRes.success) setDropdowns({ purchaseOrderStatus: dropdownRes.data.purchase_order_status || [] });
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
        setIsBillMode(po.document_type === 'bill' || billFromUrl);
        setInitialValues({
          dealId: po.deal_id || null,
          companyId: po.company_id || null,
          supplierId: po.supplier_id || null,
          poDate: po.po_date || new Date().toISOString().split('T')[0],
          expectedDelivery: po.expected_delivery || '',
          status: po.status || 'new',
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
  }, [id, billFromUrl]);

  const applyDealPreFill = useCallback((deal, supplierIdOverride) => {
    if (!deal) return;
    const isOtp = deal.deal_type === 'offer_to_purchase';
    const useDownstreamSupplier = supplierIdOverride != null;
    setInitialValues((prev) => ({
      ...prev,
      dealId: deal.id,
      ...(useDownstreamSupplier
        ? { supplierId: supplierIdOverride, companyId: null }
        : isOtp
          ? { companyId: deal.company_id || null, supplierId: null }
          : { supplierId: deal.supplier_id || null, companyId: null }),
      termsAndConditionsIds: (deal.termsList && deal.termsList.length > 0)
        ? deal.termsList.map((t) => t.id)
        : (deal.termsAndConditions?.id ? [deal.termsAndConditions.id] : []),
    }));
    if (deal.items && deal.items.length > 0) {
      setItems(
        deal.items.map((it) => ({
          productServiceId: it.product_service_id || null,
          itemDescription: it.notes || '',
          quantity: String(it.quantity ?? ''),
          price: String(it.unit_price ?? ''),
          total: String(it.line_total ?? ''),
        }))
      );
    }
  }, []);

  const fetchDealForPreFill = useCallback(async (dealId, { supplierId, companyId } = {}) => {
    if (!dealId) return;
    try {
      const res = await apiService.getDeal(dealId);
      if (res.success && res.data) {
        applyDealPreFill(res.data, supplierId ?? undefined);
        if (companyId != null) {
          setInitialValues((prev) => ({ ...prev, companyId, supplierId: null }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [applyDealPreFill]);

  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
    fetchData();
    if (isEdit) fetchPO();
    else if (dealIdFromUrl) {
      fetchDealForPreFill(dealIdFromUrl, {
        supplierId: supplierIdFromUrl ?? undefined,
        companyId: companyIdFromUrl ?? undefined,
      });
      if (billFromUrl) {
        setIsBillMode(true);
        setInitialValues((prev) => ({
          ...prev,
          supplierId: supplierIdFromUrl || (companyIdFromUrl ? null : prev.supplierId),
          companyId: companyIdFromUrl || (supplierIdFromUrl ? null : prev.companyId),
          status: 'approved',
        }));
      }
    } else if (supplierIdFromUrl) {
      setInitialValues((prev) => ({ ...prev, supplierId: supplierIdFromUrl, companyId: null, status: 'approved' }));
    } else if (companyIdFromUrl) {
      setInitialValues((prev) => ({ ...prev, companyId: companyIdFromUrl, supplierId: null, status: billFromUrl ? 'approved' : prev.status }));
    }
  }, [fetchData, isEdit, fetchPO, supplierIdFromUrl, companyIdFromUrl, dealIdFromUrl, billFromUrl, fetchDealForPreFill]);

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
      const isVendorQuotation = !isBillMode && Boolean(values.supplierId);
      const isClientQuotation = !isBillMode && Boolean(values.companyId);
      const payload = {
        dealId: values.dealId || null,
        companyId: values.companyId || null,
        supplierId: values.supplierId || null,
        poDate: values.poDate,
        expectedDelivery: values.expectedDelivery || null,
        ...(canChangeStatus && isClientQuotation ? { status: values.status } : {}),
        termsAndConditionsIds: values.termsAndConditionsIds,
        documentType: isBillMode ? 'bill' : 'quotation',
        workOrderId: workOrderIdFromUrl || null,
        items: items.map((it) => ({
          productServiceId: it.productServiceId,
          itemDescription: it.itemDescription || null,
          quantity: String(it.quantity),
          price: String(it.price),
          total: String(it.total),
        })),
      };
      let savedPo;
      if (isEdit) {
        const res = await apiService.updatePurchaseOrder(id, payload);
        savedPo = res.data;
        setSuccess(isBillMode ? 'Purchase bill updated' : 'Purchase quotation updated');
      } else {
        const res = await apiService.createPurchaseOrder(payload);
        savedPo = res.data;
        setSuccess(isBillMode ? 'Purchase bill created' : 'Purchase quotation created');
      }

      const poId = savedPo?.id || (isEdit ? Number(id) : null);
      const poStatus = String(savedPo?.status || (isVendorQuotation ? 'approved' : 'new')).toLowerCase();
      const listPath = isBillMode
        ? billListPath({ company_id: values.companyId, supplier_id: values.supplierId })
        : quotationListPath(values.companyId, values.supplierId);

      if (isClientQuotation && poId && CLIENT_PO_APPROVAL_ELIGIBLE.includes(poStatus)) {
        setSavedPoId(poId);
        setApprovalDialogOpen(true);
      } else {
        setTimeout(() => navigate(listPath), 1500);
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const finishAndNavigate = () => {
    setApprovalDialogOpen(false);
    setSavedPoId(null);
    setApprovalError('');
    const listPath = quotationListPath(initialValues.companyId, initialValues.supplierId);
    navigate(isBillMode ? billListPath({ company_id: initialValues.companyId, supplier_id: initialValues.supplierId }) : listPath);
  };

  const handleRequestPoApproval = async () => {
    if (!savedPoId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestPurchaseOrderApproval(savedPoId);
      setSuccess('Approval requested. Your manager has been notified.');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprovePoWithPin = async (pin) => {
    if (!savedPoId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approvePurchaseOrderWithPin(savedPoId, pin);
      setSuccess('Purchase quotation approved!');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
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

  const isClientBill = isBillMode && Boolean(initialValues.companyId);
  const pageTitle = isBillMode
    ? (isEdit
      ? (isClientBill ? 'Edit Client Purchase Bill' : 'Edit Vendor Purchase Bill')
      : (isClientBill ? 'Create Client Purchase Bill' : 'Create Vendor Purchase Bill'))
    : (isEdit ? 'Edit Purchase Quotation' : 'Create Purchase Quotation');
  const pageDesc = isBillMode
    ? 'Adjust quantities on the purchase bill; totals recalculate automatically'
    : (isEdit ? 'Set status to Approved to download a purchase order PDF' : 'After approval, download PDF is a purchase order');

  const billSubtotal = items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);

  const handlePdf = async () => {
    if (!id) return;
    try {
      setPdfLoading(true);
      await apiService.downloadPurchaseOrderPdf(id);
    } catch (err) {
      setError(err.message || 'PDF download failed');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <PageContainer title={pageTitle} description={pageDesc}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button startIcon={<IconArrowLeft />} onClick={() => navigate(isBillMode ? billListPath({ company_id: initialValues.companyId, supplier_id: initialValues.supplierId }) : quotationListPath(initialValues.companyId, initialValues.supplierId))} size="small">
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {pageTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageDesc}
              </Typography>
            </Box>
          </Stack>
          {isBillMode && isEdit && (
            <Button
              variant="outlined"
              startIcon={pdfLoading ? <CircularProgress size={16} /> : <IconFileDownload size={18} />}
              onClick={handlePdf}
              disabled={pdfLoading}
              sx={{ borderRadius: 2 }}
            >
              Download purchase bill PDF
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object({
            companyId: Yup.number().nullable(),
            supplierId: Yup.number().nullable(),
            poDate: Yup.string().trim().required('Date is required'),
            status: Yup.string().trim().required('Status is required'),
          }).test('party', 'Select client (company) or supplier', function (vals) {
            if (vals.companyId != null || vals.supplierId != null) return true;
            return this.createError({ path: 'companyId', message: 'Select client (company) or supplier' });
          })}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>{isBillMode ? 'Purchase Bill Details' : 'Purchase Quotation Details'}</Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      fullWidth
                      options={deals}
                      getOptionLabel={(opt) => opt.title || opt.deal_number || ''}
                      value={deals.find((d) => d.id === values.dealId) || null}
                      onChange={(_, v) => {
                        setFieldValue('dealId', v?.id || null);
                        if (v?.id) fetchDealForPreFill(v.id);
                      }}
                      disabled={isBillMode}
                      renderInput={(params) => (
                        <TextField {...params} label="Link to Deal (Optional)" placeholder="Select deal to copy items & terms..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <Autocomplete
                      fullWidth
                      options={companies}
                      getOptionLabel={(opt) => opt.company_name || ''}
                      value={companies.find((c) => c.id === values.companyId) || null}
                      onChange={(_, v) => {
                        setFieldValue('companyId', v?.id || null);
                        setFieldValue('supplierId', null);
                        setFieldValue('status', 'new');
                      }}
                      disabled={isBillMode}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Client (company)"
                          placeholder="Offer to purchase: quotation to client"
                          helperText={(errors.companyId && typeof errors.companyId === 'string' ? errors.companyId : null) || 'Pick the client company, or use supplier below — not both'}
                          error={Boolean(errors.companyId)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <Autocomplete
                      fullWidth
                      options={suppliers}
                      getOptionLabel={(opt) => opt.company_name || ''}
                      value={suppliers.find((s) => s.id === values.supplierId) || null}
                      onChange={(_, v) => {
                        setFieldValue('supplierId', v?.id || null);
                        setFieldValue('companyId', null);
                        setFieldValue('status', v?.id ? 'approved' : 'new');
                      }}
                      disabled={isBillMode}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supplier (vendor)"
                          placeholder="Downstream / vendor purchase quotation"
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

                    {!isBillMode && values.supplierId && (
                      <TextField
                        fullWidth
                        label="Status"
                        value="Approved"
                        disabled
                        helperText="Vendor purchase quotations are auto-approved on creation"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                    {!isBillMode && values.companyId && (
                      canChangeStatus ? (
                        <TextField
                          fullWidth
                          select
                          label="Status (Required)"
                          name="status"
                          value={values.status || 'new'}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          error={touched.status && Boolean(errors.status)}
                          helperText={(touched.status && errors.status) || 'Approved → PDF is a purchase order'}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}
                        >
                          {(dropdowns.purchaseOrderStatus?.length ? dropdowns.purchaseOrderStatus : [
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
                      )
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight={600}>Items</Typography>
                    {!isBillMode && (
                      <Button startIcon={<IconPlus />} variant="outlined" size="small" onClick={() => setItems([...items, initialItem()])} sx={{ borderRadius: 2 }}>
                        Add Item
                      </Button>
                    )}
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
                                disabled={isBillMode}
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
                                disabled={isBillMode}
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
                                inputProps={{ min: 0, step: 'any' }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Price"
                                value={row.price}
                                onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                disabled={isBillMode}
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
                                disabled={isBillMode}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>
                              {!isBillMode && (
                                <IconButton size="small" onClick={() => setItems(items.filter((_, i) => i !== idx))} color="error" disabled={items.length <= 1}>
                                  <IconTrash size={18} />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {isBillMode && (
                    <Stack direction="row" justifyContent="flex-end" mt={2}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Bill subtotal: AED {billSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  )}
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
                  {isEdit ? 'Update' : 'Create'} {isBillMode ? (isClientBill ? 'Client Purchase Bill' : 'Vendor Purchase Bill') : 'Purchase Quotation'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate(quotationListPath(values.companyId, values.supplierId))} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
              </Box>
            </form>
          )}
        </Formik>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="client purchase quotation"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => !approvalLoading && finishAndNavigate()}
          onDecideLater={finishAndNavigate}
          onRequestApproval={handleRequestPoApproval}
          onApproveWithPin={handleApprovePoWithPin}
          approveButtonLabel="Approve quotation"
        />
      </Box>
    </PageContainer>
  );
};

export default PurchaseOrderForm;
