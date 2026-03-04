import React, { useEffect, useState, useCallback } from 'react';
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
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { useDropzone } from 'react-dropzone';
import { IconArrowLeft, IconPlus, IconTrash, IconPhoto } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  leadId: Yup.number().nullable().required('Lead is required'),
  companyId: Yup.number().nullable().required('Company is required'),
  contactId: Yup.number().nullable().required('Contact person is required'),
  dealType: Yup.string().trim().required('Deal type is required'),
  currency: Yup.string().trim().required('Currency is required'),
  status: Yup.string().trim().required('Status is required'),
  dealDate: Yup.date().nullable().required('Date is required'),
  supplierId: Yup.number().nullable(),
  title: Yup.string().trim().required('Title is required'),
  inspectionRequired: Yup.boolean().required('Inspection required is required'),
  termsAndConditionsIds: Yup.array(),
});

const DealImageDropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    onDrop: (acceptedFiles) => { if (acceptedFiles.length) onDrop(acceptedFiles); },
  });
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <input {...getInputProps()} />
      <IconPhoto size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
      <Typography variant="body2" color="text.secondary">
        Drag and drop images here, or click to select
      </Typography>
    </Box>
  );
};

const DealForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  
  const [dropdowns, setDropdowns] = useState({
    dealStatus: [],
    paymentStatus: [],
  });

  const [lineItems, setLineItems] = useState([]);
  const [dealImages, setDealImages] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const [initialValues, setInitialValues] = useState({
    leadId: null,
    companyId: null,
    contactId: null,
    supplierId: null,
    title: '',
    description: '',
    dealDate: new Date().toISOString().split('T')[0],
    vatPercentage: 5,
    currency: 'AED',
    status: 'draft',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    assignedTo: null,
    termsAndConditionsIds: [],
    dealType: 'offer_to_purchase',
    containerType: null,
    locationType: null,
    wdsRequired: false,
    inspectionRequired: false,
    customInspection: false,
    trakheesInspection: false,
    dubaiMunicipalityInspection: false,
    notes: '',
  });

  const [wdsDialogOpen, setWdsDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [inspectionDetails, setInspectionDetails] = useState({
    materialTypeId: null,
    location: '',
    locationType: '',
    gatePassRequirement: '',
    serviceType: '',
    quantity: '',
    safetyToolsRequired: false,
    supportingDocuments: '',
    requestedBy: null,
    notes: '',
  });
  const [wdsDetails, setWdsDetails] = useState({
    refNo: '',
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    licenseNo: '',
    wasteDescription: '',
    sourceProcess: '',
    packageType: '',
    quantityPerPackage: '',
    totalWeight: '',
    containerNo: '',
    purpose: '',
    blNo: '',
    borNo: '',
  });

  const isEdit = Boolean(id);

  const fetchAllData = useCallback(async () => {
    try {
      const [leadsRes, companiesRes, contactsRes, suppliersRes, productsRes, usersRes, termsRes, materialTypesRes] = await Promise.all([
        apiService.getLeads({ pageSize: 500 }),
        apiService.getCompanies({ pageSize: 500 }),
        apiService.getContacts({ pageSize: 500 }),
        apiService.getSuppliers({ pageSize: 500 }),
        apiService.getProducts({ pageSize: 500, status: 'active' }),
        apiService.getUsers({ pageSize: 500 }),
        apiService.getTermsAndConditions({ pageSize: 500, status: 'active' }),
        apiService.getMaterialTypes(),
      ]);
      
      if (leadsRes.success) setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      if (companiesRes.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      if (contactsRes.success) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      if (suppliersRes.success) setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      if (productsRes.success) setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      if (usersRes.success) setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
      if (termsRes.success) setTermsAndConditions(Array.isArray(termsRes.data) ? termsRes.data : []);
      if (materialTypesRes.success) setMaterialTypes(Array.isArray(materialTypesRes.data) ? materialTypesRes.data : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({
          dealStatus: response.data.deal_status || [],
          paymentStatus: response.data.payment_status || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, []);

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeal(id);
      if (response.success) {
        const d = response.data;
        setInitialValues({
          leadId: d.lead_id || null,
          companyId: d.company_id || null,
          contactId: d.contact_id || null,
          supplierId: d.supplier_id || null,
          title: d.title || '',
          description: d.description || '',
          dealDate: d.deal_date ? new Date(d.deal_date).toISOString().split('T')[0] : '',
          vatPercentage: d.vat_percentage || 5,
          currency: d.currency || 'AED',
          status: d.status || 'draft',
          paymentStatus: d.payment_status || 'unpaid',
          paidAmount: d.paid_amount || 0,
          assignedTo: d.assigned_to || null,
          termsAndConditionsIds: (d.termsList && d.termsList.length > 0)
            ? d.termsList.map((t) => t.id)
            : (d.terms_and_conditions_id ? [d.terms_and_conditions_id] : []),
          dealType: d.deal_type || 'offer_to_purchase',
          containerType: d.container_type || null,
          locationType: d.location_type || null,
          wdsRequired: d.wds_required || false,
          inspectionRequired: d.inspection_required || false,
          customInspection: d.custom_inspection || false,
          trakheesInspection: d.trakhees_inspection || false,
          dubaiMunicipalityInspection: d.dubai_municipality_inspection || false,
          notes: d.notes || '',
        });
        
        const defaultWds = {
          refNo: '',
          date: new Date().toISOString().split('T')[0],
          companyName: '',
          licenseNo: '',
          wasteDescription: '',
          sourceProcess: '',
          packageType: '',
          quantityPerPackage: '',
          totalWeight: '',
          containerNo: '',
          purpose: '',
          blNo: '',
          borNo: '',
        };
        if (d.wdsDetails) {
          const w = d.wdsDetails;
          setWdsDetails({
            ...defaultWds,
            refNo: w.ref_no || '',
            date: w.date ? new Date(w.date).toISOString().split('T')[0] : defaultWds.date,
            companyName: w.company_name || '',
            licenseNo: w.license_no || '',
            wasteDescription: w.waste_description || '',
            sourceProcess: w.source_process || '',
            packageType: w.package_type || '',
            quantityPerPackage: w.quantity_per_package || '',
            totalWeight: w.total_weight || '',
            containerNo: w.container_no || '',
            purpose: w.purpose || '',
            blNo: w.bl_no || '',
            borNo: w.bor_no || '',
          });
        } else {
          setWdsDetails(defaultWds);
        }

        if (d.inspectionRequest) {
          const i = d.inspectionRequest;
          setInspectionDetails({
            materialTypeId: i.material_type_id || null,
            location: i.location || '',
            locationType: i.location_type || '',
            gatePassRequirement: i.gate_pass_requirement || '',
            serviceType: i.service_type || '',
            quantity: i.quantity || '',
            safetyToolsRequired: i.safety_tools_required || false,
            supportingDocuments: i.supporting_documents || '',
            requestedBy: i.requested_by || null,
            notes: i.notes || '',
          });
        } else {
          setInspectionDetails({
            materialTypeId: null,
            location: '',
            locationType: '',
            gatePassRequirement: '',
            serviceType: '',
            quantity: '',
            safetyToolsRequired: false,
            supportingDocuments: '',
            requestedBy: null,
            notes: '',
          });
        }
        
        setDealImages((d.images || []).map(img => ({ path: img.file_path, url: apiService.getUploadUrl(img.file_path) })));

        // Load line items
        const items = (d.items || []).map(item => ({
          id: item.id,
          productServiceId: item.product_service_id,
          productName: item.productService?.name || '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          lineTotal: item.line_total,
          notes: item.notes || '',
        }));
        setLineItems(items);
      }
    } catch (err) {
      setError(err.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLeadData = useCallback(async (leadId) => {
    try {
      const response = await apiService.getLead(leadId);
      if (response.success) {
        const lead = response.data;
        setInitialValues(prev => ({
          ...prev,
          leadId: lead.id,
          companyId: lead.company_id || null,
          contactId: lead.contact_id || null,
          assignedTo: lead.assigned_to || null,
          title: `Deal from Lead ${lead.lead_number}`,
          description: lead.notes || '',
        }));
        
        if (lead.product_service_id) {
          setLineItems([{
            productServiceId: lead.product_service_id,
            productName: lead.productService?.name || '',
            quantity: 1,
            unitPrice: lead.estimated_value || 0,
            lineTotal: lead.estimated_value || 0,
            notes: '',
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to load lead:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchDropdowns();
    if (isEdit) {
      fetchDeal();
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const leadId = urlParams.get('leadId');
      if (leadId) {
        fetchLeadData(leadId);
      }
    }
  }, [isEdit, fetchAllData, fetchDropdowns, fetchDeal, fetchLeadData]);

  // Recalculate totals when line items or VAT changes
  useEffect(() => {
    const sub = lineItems.reduce((sum, item) => sum + parseFloat(item.lineTotal || 0), 0);
    setSubtotal(sub);
    
    const vat = (sub * parseFloat(initialValues.vatPercentage || 5)) / 100;
    setVatAmount(vat);
    
    setTotal(sub + vat);
  }, [lineItems, initialValues.vatPercentage]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      productServiceId: null,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      notes: '',
    }]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    
    // Auto-calculate line total
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].unitPrice || 0);
      newItems[index].lineTotal = (qty * price).toFixed(2);
    }
    
    // Auto-fill price when product is selected
    if (field === 'productServiceId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.price || 0;
        const qty = parseFloat(newItems[index].quantity || 0);
        newItems[index].lineTotal = (qty * parseFloat(product.price || 0)).toFixed(2);
      }
    }
    
    setLineItems(newItems);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      if (lineItems.length === 0) {
        setError('At least one product/service is required');
        setSubmitting(false);
        return;
      }

      const invalidItems = lineItems.filter((item) => !item.productServiceId);
      if (invalidItems.length > 0) {
        setError('Please select a product/service for all line items');
        setSubmitting(false);
        return;
      }

      if (values.inspectionRequired) {
        if (!values.companyId) {
          setError('Company is required when inspection is required');
          setSubmitting(false);
          return;
        }
        if (!values.contactId) {
          setError('Contact is required when inspection is required');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.location?.trim()) {
          setError('Location is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.serviceType?.trim()) {
          setError('Service Type is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.materialTypeId) {
          setError('Material Type is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.quantity?.toString().trim()) {
          setError('Quantity is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.requestedBy) {
          setError('Requested By is required in inspection request details');
          setSubmitting(false);
          return;
        }
      }

      if (values.wdsRequired) {
        const required = ['refNo', 'date', 'companyName', 'licenseNo', 'wasteDescription', 'containerNo'];
        const missing = required.filter((f) => !wdsDetails[f]?.toString().trim());
        if (missing.length > 0) {
          setError('Please fill all required WDS details (Ref No, Date, Company Name, License No, Waste Description, Container No)');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ...values,
        items: lineItems.map(item => ({
          productServiceId: item.productServiceId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          notes: item.notes,
        })),
        wdsDetails: values.wdsRequired ? wdsDetails : null,
        inspectionDetails: values.inspectionRequired ? inspectionDetails : null,
        images: dealImages.map(img => ({ path: img.path })),
      };

      if (isEdit) {
        await apiService.updateDeal(id, payload);
        setSuccess('Deal updated successfully!');
      } else {
        await apiService.createDeal(payload);
        setSuccess('Deal created successfully!');
      }
      setTimeout(() => navigate('/erp/deals'), 1000);
    } catch (err) {
      let errorMessage = err.message || 'Failed to save deal';
      if (err.errors) {
        if (typeof err.errors === 'string') {
          errorMessage = err.errors;
        } else if (Array.isArray(err.errors)) {
          errorMessage = err.errors.map(e => e.msg || e.message || e).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return (
      <PageContainer title="Loading...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Deal' : 'Create Deal'} description="Manage deal details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/deals')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Deal' : 'Create New Deal'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update deal information' : 'Create a new business deal'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
            <form onSubmit={formikSubmit}>
              {/* Basic Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Deal Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Basic details about the deal
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Deal Title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.title && Boolean(errors.title)}
                        helperText={touched.title ? errors.title : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        fullWidth
                        label="Deal Date"
                        name="dealDate"
                        type="date"
                        value={values.dealDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.dealDate && Boolean(errors.dealDate)}
                        helperText={touched.dealDate ? errors.dealDate : ' '}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Description"
                      name="description"
                      placeholder="Describe the deal in detail..."
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                        Images
                      </Typography>
                      <DealImageDropzone
                        onDrop={async (acceptedFiles) => {
                          for (const file of acceptedFiles) {
                            try {
                              const res = await apiService.uploadDealImage(file);
                              if (res.success && res.data?.path) {
                                setDealImages(prev => [...prev, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }]);
                              }
                            } catch (err) {
                              setError(err.message || 'Image upload failed');
                            }
                          }
                        }}
                      />
                      {dealImages.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                          {dealImages.map((img, idx) => (
                            <Box key={idx} sx={{ position: 'relative' }}>
                              <Box
                                component="img"
                                src={img.url}
                                alt=""
                                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setDealImages(prev => prev.filter((_, i) => i !== idx))}
                                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                              >
                                <IconTrash size={14} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Relationships */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Related Entities
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Link this deal to leads, companies, contacts, and suppliers
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={leads}
                          getOptionLabel={(opt) => `${opt.lead_number || ''} - ${opt.email || ''}`}
                          value={leads.find((l) => l.id === values.leadId) || null}
                          onChange={(_, val) => setFieldValue('leadId', val?.id || null)}
                          onBlur={() => setFieldTouched('leadId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Lead"
                              placeholder="Required - Select lead..."
                              error={touched.leadId && Boolean(errors.leadId)}
                              helperText={touched.leadId ? errors.leadId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                      
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(opt) => opt.company_name || ''}
                          value={companies.find((c) => c.id === values.companyId) || null}
                          onChange={(_, val) => setFieldValue('companyId', val?.id || null)}
                          onBlur={() => setFieldTouched('companyId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company"
                              placeholder="Required - Select company..."
                              error={touched.companyId && Boolean(errors.companyId)}
                              helperText={touched.companyId ? errors.companyId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={contacts}
                          getOptionLabel={(opt) => `${opt.first_name} ${opt.last_name} ${opt.email ? `(${opt.email})` : ''}`}
                          value={contacts.find((c) => c.id === values.contactId) || null}
                          onChange={(_, val) => setFieldValue('contactId', val?.id || null)}
                          onBlur={() => setFieldTouched('contactId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Contact Person"
                              placeholder="Required - Select contact..."
                              error={touched.contactId && Boolean(errors.contactId)}
                              helperText={touched.contactId ? errors.contactId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                      
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={suppliers}
                          getOptionLabel={(opt) => opt.company_name || ''}
                          value={suppliers.find((s) => s.id === values.supplierId) || null}
                          onChange={(_, val) => setFieldValue('supplierId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Supplier (Optional)"
                              placeholder="Select supplier..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={users}
                          getOptionLabel={(opt) => `${opt.first_name} ${opt.last_name}`}
                          value={users.find((u) => u.id === values.assignedTo) || null}
                          onChange={(_, val) => setFieldValue('assignedTo', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Assigned To"
                              placeholder="Select user..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                      <Box>
                        <Autocomplete
                          multiple
                          fullWidth
                          options={termsAndConditions}
                          getOptionLabel={(opt) => opt.title || ''}
                          value={termsAndConditions.filter((t) => (values.termsAndConditionsIds || []).includes(t.id))}
                          onChange={(_, val) => setFieldValue('termsAndConditionsIds', val ? val.map((t) => t.id) : [])}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Terms & Conditions"
                              placeholder="Select terms..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Deal Type & Logistics */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Deal Type & Logistics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Specify deal type and logistics requirements
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      select
                      label="Deal Type"
                      name="dealType"
                      value={values.dealType || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.dealType && Boolean(errors.dealType)}
                      helperText={touched.dealType ? errors.dealType : ' '}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="offer_to_charge">Offer to Charge</MenuItem>
                      <MenuItem value="offer_to_purchase">Offer to Purchase</MenuItem>
                      <MenuItem value="free_of_charge">Free of Charge</MenuItem>
                    </TextField>

                    {values.dealType === 'offer_to_charge' && (
                      <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                          <TextField
                            fullWidth
                            select
                            label="Container Type"
                            name="containerType"
                            value={values.containerType || ''}
                            onChange={handleChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          >
                            <MenuItem value="LCL">LCL</MenuItem>
                            <MenuItem value="FCL">FCL</MenuItem>
                          </TextField>

                          <TextField
                            fullWidth
                            select
                            label="Location Type"
                            name="locationType"
                            value={values.locationType || ''}
                            onChange={handleChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          >
                            <MenuItem value="Main Land">Main Land</MenuItem>
                            <MenuItem value="Free Zone">Free Zone</MenuItem>
                          </TextField>
                        </Box>

                        <Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={values.wdsRequired}
                                onChange={(e) => {
                                  setFieldValue('wdsRequired', e.target.checked);
                                  if (e.target.checked) {
                                    setWdsDialogOpen(true);
                                  }
                                }}
                                name="wdsRequired"
                              />
                            }
                            label="WDS Required?"
                          />
                          {values.wdsRequired && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setWdsDialogOpen(true)}
                              sx={{ ml: 2, borderRadius: 2 }}
                            >
                              Edit WDS Details
                            </Button>
                          )}
                        </Box>

                        {values.inspectionRequired && (
                          <Box sx={{ ml: 0, mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values.customInspection}
                                  onChange={(e) => setFieldValue('customInspection', e.target.checked)}
                                  name="customInspection"
                                />
                              }
                              label="Custom Inspection"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values.trakheesInspection}
                                  onChange={(e) => setFieldValue('trakheesInspection', e.target.checked)}
                                  name="trakheesInspection"
                                />
                              }
                              label="Trakhees Inspection"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values.dubaiMunicipalityInspection}
                                  onChange={(e) => setFieldValue('dubaiMunicipalityInspection', e.target.checked)}
                                  name="dubaiMunicipalityInspection"
                                />
                              }
                              label="Dubai Municipality Inspection"
                            />
                          </Box>
                        )}
                      </>
                    )}

                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.inspectionRequired}
                            onChange={(e) => {
                              setFieldValue('inspectionRequired', e.target.checked);
                              if (e.target.checked) {
                                setInspectionDialogOpen(true);
                              }
                            }}
                            name="inspectionRequired"
                          />
                        }
                        label="Inspection Required?"
                      />
                      {values.inspectionRequired && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setInspectionDialogOpen(true)}
                          sx={{ ml: 2, borderRadius: 2 }}
                        >
                          Edit Inspection Details
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Products/Services Line Items */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        Products & Services
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        At least one product/service is required
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<IconPlus size={20} />}
                      onClick={handleAddLineItem}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Add Item
                    </Button>
                  </Stack>

                  {lineItems.length === 0 ? (
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 6,
                        textAlign: 'center',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <Typography variant="body1" fontWeight={500} color="text.secondary">
                        No items added yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Click &quot;Add Item&quot; to add at least one product or service (required)
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                            <TableCell sx={{ fontWeight: 700, minWidth: 250 }}>Product/Service</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 100 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 130 }}>Unit Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 130 }}>Line Total</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 150 }}>Notes</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lineItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Autocomplete
                                  options={products}
                                  getOptionLabel={(opt) => `${opt.name} (${opt.category})`}
                                  value={products.find((p) => p.id === item.productServiceId) || null}
                                  onChange={(_, val) => handleLineItemChange(index, 'productServiceId', val?.id || null)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      placeholder="Select..."
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                  )}
                                  isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                  inputProps={{ min: 0, step: 0.01 }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                  inputProps={{ min: 0, step: 0.01 }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {values.currency} {parseFloat(item.lineTotal || 0).toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={item.notes}
                                  onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                                  placeholder="Notes..."
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveLineItem(index)}
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

                  {/* Totals Summary */}
                  {lineItems.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 350 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">Subtotal:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {values.currency} {subtotal.toFixed(2)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">VAT:</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                name="vatPercentage"
                                type="number"
                                value={values.vatPercentage}
                                onChange={(e) => {
                                  handleChange(e);
                                  const newVat = (subtotal * parseFloat(e.target.value || 0)) / 100;
                                  setVatAmount(newVat);
                                  setTotal(subtotal + newVat);
                                }}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                              <Typography variant="body2">%</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                = {values.currency} {vatAmount.toFixed(2)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Divider />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="h5" fontWeight={700}>Total:</Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                              {values.currency} {total.toFixed(2)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Status & Payment */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Status & Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Deal status and payment tracking
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        name="status"
                        value={values.status || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status ? errors.status : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {dropdowns.dealStatus.map((s) => (
                          <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Payment Status"
                        name="paymentStatus"
                        value={values.paymentStatus}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {dropdowns.paymentStatus.map((s) => (
                          <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Paid Amount"
                        name="paidAmount"
                        type="number"
                        value={values.paidAmount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        helperText={`Total: ${values.currency} ${total.toFixed(2)}`}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Currency"
                        name="currency"
                        value={values.currency || 'AED'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.currency && Boolean(errors.currency)}
                        helperText={touched.currency ? errors.currency : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="AED">AED</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Additional Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Terms, conditions, and other important information
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Notes"
                    name="notes"
                    placeholder="Add any additional notes, terms, conditions, or special instructions..."
                    value={values.notes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/deals')}
                  sx={{ minWidth: '140px', borderRadius: 2, fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ minWidth: '180px', borderRadius: 2, fontWeight: 600 }}
                >
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
                </Button>
              </Stack>
            </form>
          )}
        </Formik>

        {/* WDS Details Dialog */}
        <Dialog
          open={wdsDialogOpen}
          onClose={() => setWdsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h4" fontWeight={700}>
              WDS Details
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Ref No"
                  value={wdsDetails.refNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, refNo: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={wdsDetails.date}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Autocomplete
                fullWidth
                options={companies}
                getOptionLabel={(opt) => opt.company_name || ''}
                value={companies.find((c) => c.company_name === wdsDetails.companyName) || null}
                onChange={(_, val) => setWdsDetails({ ...wdsDetails, companyName: val?.company_name || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company Name"
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                isOptionEqualToValue={(opt, val) => opt.company_name === val?.company_name}
                ListboxProps={{ style: { maxHeight: '300px' } }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="License No"
                  value={wdsDetails.licenseNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, licenseNo: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Container No"
                  value={wdsDetails.containerNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, containerNo: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Waste Description"
                value={wdsDetails.wasteDescription}
                onChange={(e) => setWdsDetails({ ...wdsDetails, wasteDescription: e.target.value })}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Source/Process"
                value={wdsDetails.sourceProcess}
                onChange={(e) => setWdsDetails({ ...wdsDetails, sourceProcess: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Package Type"
                  value={wdsDetails.packageType}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, packageType: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Quantity per Package"
                  value={wdsDetails.quantityPerPackage}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, quantityPerPackage: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Total Weight"
                  value={wdsDetails.totalWeight}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, totalWeight: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Purpose"
                value={wdsDetails.purpose}
                onChange={(e) => setWdsDetails({ ...wdsDetails, purpose: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="BL No"
                  value={wdsDetails.blNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, blNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="BOR No"
                  value={wdsDetails.borNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, borNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setWdsDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setWdsDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={inspectionDialogOpen} onClose={() => setInspectionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Inspection Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Autocomplete
                fullWidth
                options={materialTypes}
                getOptionLabel={(opt) => opt.display_name || opt.value || ''}
                value={materialTypes.find((m) => m.id === inspectionDetails.materialTypeId) || null}
                onChange={(_, val) => setInspectionDetails({ ...inspectionDetails, materialTypeId: val?.id || null })}
                renderInput={(params) => (
                  <TextField {...params} label="Material Type (Required)" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
              />
              <TextField
                fullWidth
                label="Location"
                value={inspectionDetails.location}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, location: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                select
                label="Location Type"
                value={inspectionDetails.locationType || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, locationType: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="mainland">Mainland</MenuItem>
                <MenuItem value="freezone">Freezone</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Gate Pass Requirement?"
                value={inspectionDetails.gatePassRequirement || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, gatePassRequirement: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Service Type (Required)"
                value={inspectionDetails.serviceType || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, serviceType: e.target.value })}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="free_of_charge">Free of Charge</MenuItem>
                <MenuItem value="N/A">N/A</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Quantity (Required)"
                type="number"
                value={inspectionDetails.quantity}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, quantity: e.target.value })}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={inspectionDetails.safetyToolsRequired}
                    onChange={(e) => setInspectionDetails({ ...inspectionDetails, safetyToolsRequired: e.target.checked })}
                  />
                }
                label="Safety tools required"
              />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Supporting documents
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const res = await apiService.uploadInspectionDocument(file);
                        if (res.success && res.data?.path) {
                          setInspectionDetails({ ...inspectionDetails, supportingDocuments: res.data.path });
                        }
                      } catch (err) {
                        setError(err.message || 'Upload failed');
                      }
                    }
                    e.target.value = '';
                  }}
                  style={{ display: 'block' }}
                />
                {inspectionDetails.supportingDocuments && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                    File uploaded
                  </Typography>
                )}
              </Box>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || opt.email || ''}
                value={users.find((u) => u.id === inspectionDetails.requestedBy) || null}
                onChange={(_, val) => setInspectionDetails({ ...inspectionDetails, requestedBy: val?.id || null })}
                renderInput={(params) => (
                  <TextField {...params} label="Requested by (Required)" placeholder="Select user..." required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                noOptionsText="No users found"
                ListboxProps={{ style: { maxHeight: '300px' } }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={inspectionDetails.notes}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, notes: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setInspectionDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={() => setInspectionDialogOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default DealForm;
