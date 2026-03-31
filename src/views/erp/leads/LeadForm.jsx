import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popper,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// Popper that matches the anchor element width
const WidePopper = ({ style, anchorEl, ...props }) => {
  const width = anchorEl ? anchorEl.getBoundingClientRect().width : undefined;
  return <Popper {...props} anchorEl={anchorEl} style={{ ...style, width }} placement="bottom-start" />;
};

const validationSchema = Yup.object({
  companyId: Yup.number().nullable().required('Company is required'),
  contactId: Yup.number().nullable().required('Contact is required'),
  leadSource: Yup.string().trim().required('Source is required'),
  status: Yup.string().trim().required('Status is required'),
  productServiceId: Yup.number().nullable().required('Item is required'),
  email: Yup.string().email('Invalid email').nullable().transform((v) => v || null),
  phone: Yup.string().nullable().transform((v) => v || null),
  notes: Yup.string().trim().nullable(),
});

const canAssignLeads = (roleName) =>
  ['sales_manager', 'admin', 'tenant_admin', 'super_admin'].includes(roleName);

const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = user?.role?.name ?? user?.role;
  const showAssignedTo = canAssignLeads(roleName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [newCompanyValues, setNewCompanyValues] = useState({
    companyName: '', type: 'organization', email: '', phone: '', country: 'UAE', city: '', address: '', industryType: '', vatNumber: '',
  });
  const [newContactValues, setNewContactValues] = useState({
    firstName: '', lastName: '', email: '', phone: '', designation: '', companyId: null,
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState({});
  const [newContactErrors, setNewContactErrors] = useState({});
  const setFieldValueRef = useRef(null);
  const valuesRef = useRef({});
  
  // Dropdown states
  const [dropdowns, setDropdowns] = useState({
    leadSources: [],
    industryTypes: [],
    cities: [],
    countries: [],
    designations: [],
  });
  
  const [users, setUsers] = useState([]);
  const [initialValues, setInitialValues] = useState({
    companyId: null,
    contactId: null,
    email: '',
    phone: '',
    leadSource: '',
    status: 'new',
    productServiceId: null,
    notes: '',
    assignedTo: null,
  });

  const isEdit = Boolean(id);

  const fetchCompaniesAndContacts = useCallback(async () => {
    const results = await Promise.allSettled([
      apiService.getCompanies({ pageSize: 500 }),
      apiService.getContacts({ pageSize: 500 }),
      apiService.getProducts({ pageSize: 500, status: 'active' }),
      apiService.getUsers({ pageSize: 500 }),
    ]);
    const [companiesRes, contactsRes, productsRes, usersRes] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    );
    if (companiesRes?.success) {
      setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.items || []);
    }
    if (contactsRes?.success) {
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : contactsRes.data?.items || []);
    }
    if (productsRes?.success) {
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || []);
    }
    if (usersRes?.success) {
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns((prev) => ({
          ...prev,
          leadSources: response.data.lead_sources || [],
          industryTypes: response.data.industry_types || [],
          cities: response.data.uae_cities || [],
          countries: response.data.countries || [],
          designations: response.data.designations || [],
        }));
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, []);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getLead(id);
      if (response.success) {
        const lead = response.data;
        setInitialValues({
          companyId: lead.company_id || null,
          contactId: lead.contact_id || null,
          email: lead.email || '',
          phone: lead.phone || '',
          leadSource: lead.source || '',
          status: lead.status || 'new',
          productServiceId: lead.product_service_id || null,
          notes: lead.notes || '',
          assignedTo: lead.assigned_to || null,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompaniesAndContacts();
    fetchDropdowns();
    if (isEdit) {
      fetchLead();
    }
  }, [isEdit, fetchCompaniesAndContacts, fetchDropdowns, fetchLead]);

  const handleCreateCompany = async () => {
    const setFieldValue = setFieldValueRef.current;
    const errors = {};
    if (!newCompanyValues.companyName) errors.companyName = 'Required';
    if (!newCompanyValues.phone) errors.phone = 'Required';
    if (!newCompanyValues.country) errors.country = 'Required';
    if (!newCompanyValues.city) errors.city = 'Required';
    if (!newCompanyValues.address) errors.address = 'Required';
    if (newCompanyValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCompanyValues.email)) errors.email = 'Invalid email';
    setNewCompanyErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSavingCompany(true);
      const res = await apiService.createCompany({
        companyName: newCompanyValues.companyName,
        type: newCompanyValues.type || 'organization',
        email: newCompanyValues.email || undefined,
        phone: newCompanyValues.phone || undefined,
        country: newCompanyValues.country,
        city: newCompanyValues.city,
        address: newCompanyValues.address,
        industryType: newCompanyValues.industryType,
        vatNumber: newCompanyValues.vatNumber || undefined,
      });
      const newCompany = res.data;
      setCompanies((prev) => [...prev, newCompany]);
      setFieldValue?.('companyId', newCompany.id);
      setNewCompanyValues({ companyName: '', type: 'organization', email: '', phone: '', country: 'UAE', city: '', address: '', industryType: '', vatNumber: '' });
      setAddCompanyDialogOpen(false);
      setNewCompanyErrors({});
    } catch (err) {
      setNewCompanyErrors({ submit: err.message || 'Failed to create company' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreateContact = async () => {
    const setFieldValue = setFieldValueRef.current;
    const companyId = valuesRef.current.companyId;
    const errors = {};
    if (!newContactValues.firstName) errors.firstName = 'Required';
    if (!newContactValues.phone?.trim()) errors.phone = 'Required';
    if (newContactValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactValues.email)) errors.email = 'Invalid email';
    setNewContactErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSavingContact(true);
      const res = await apiService.createContact({
        firstName: newContactValues.firstName,
        lastName: newContactValues.lastName || undefined,
        email: newContactValues.email || undefined,
        phone: newContactValues.phone || undefined,
        designation: newContactValues.designation,
        companyId: companyId || null,
      });
      const newContact = res.data;
      setContacts((prev) => [...prev, newContact]);
      setFieldValue?.('contactId', newContact.id);
      setFieldValue?.('email', newContact.email || '');
      setFieldValue?.('phone', newContact.phone || newContact.mobile || '');
      setNewContactValues({ firstName: '', lastName: '', email: '', phone: '', designation: '', companyId: null });
      setAddContactDialogOpen(false);
      setNewContactErrors({});
    } catch (err) {
      setNewContactErrors({ submit: err.message || 'Failed to create contact' });
    } finally {
      setSavingContact(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Transform form values to API payload
      const payload = {
        companyId: values.companyId,
        contactId: values.contactId,
        email: values.email || undefined,
        phone: values.phone || undefined,
        source: values.leadSource,
        status: values.status,
        productServiceId: values.productServiceId,
        notes: values.notes || undefined,
        assignedTo: values.assignedTo || undefined,
      };
      
      if (isEdit) {
        await apiService.updateLead(id, payload);
        setSuccess('Lead updated successfully!');
      } else {
        await apiService.createLead(payload);
        setSuccess('Lead created successfully!');
      }
      setTimeout(() => navigate('/erp/leads'), 1000);
    } catch (err) {
      // Display detailed validation errors
      let errorMessage = err.message || 'Failed to save lead';
      if (err.errors) {
        if (typeof err.errors === 'string') {
          errorMessage += ': ' + err.errors;
        } else if (Array.isArray(err.errors)) {
          const errorList = err.errors.map(e => {
            if (typeof e === 'object' && e.field && e.message) {
              return `${e.field}: ${e.message}`;
            }
            return e.msg || e.message || JSON.stringify(e);
          });
          errorMessage = errorList.join(' | ');
        } else if (typeof err.errors === 'object') {
          errorMessage = Object.entries(err.errors).map(([key, val]) => `${key}: ${val}`).join(' | ');
        }
      }
      setError(errorMessage);
      console.error('Full Error Object:', err);
      console.error('Error Response:', err.response);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return (
      <PageContainer title={isEdit ? 'Edit Lead' : 'Add Lead'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Lead' : 'Add Lead'} description="Manage lead details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/leads')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Lead' : 'Add New Lead'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update lead information' : 'Create a new lead in the system'}
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Validation Error</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue, setFieldTouched }) => {
            setFieldValueRef.current = setFieldValue;
            valuesRef.current = values;
            return (
            <form onSubmit={formikSubmit}>
              {/* Lead Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Lead Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Select company and contact person for this lead
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object' ? opt.company_name || '' : ''
                          }
                          value={companies.find((c) => c.id === values.companyId) || null}
                          onChange={(_, val) => {
                            const newCompanyId = val?.id || null;
                            setFieldValue('companyId', newCompanyId);
                            const pool = newCompanyId ? contacts.filter((c) => c.company_id === newCompanyId) : [];
                            if (!pool.some((c) => c.id === values.contactId)) {
                              setFieldValue('contactId', null);
                            }
                          }}
                          onBlur={() => setFieldTouched('companyId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company"
                              placeholder="Required - Select or search company..."
                              error={touched.companyId && Boolean(errors.companyId)}
                              helperText={touched.companyId ? errors.companyId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 12,
                            backgroundColor: 'background.paper',
                            px: 1,
                            zIndex: 1,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => setAddCompanyDialogOpen(true)}
                            sx={{ 
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              minWidth: 'auto',
                              px: 0.5,
                              py: 0,
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              }
                            }}
                          >
                            + Add New
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={
                            values.companyId
                              ? contacts.filter((c) => c.company_id === values.companyId)
                              : []
                          }
                          getOptionLabel={(opt) =>
                            typeof opt === 'object'
                              ? `${opt.first_name || ''} ${opt.last_name || ''}`.trim() + (opt.email ? ` (${opt.email})` : '')
                              : ''
                          }
                          value={
                            values.companyId
                              ? contacts.find((c) => c.id === values.contactId && c.company_id === values.companyId) || null
                              : null
                          }
                          noOptionsText={values.companyId ? 'No contacts for this company' : 'Select a company first'}
                          onChange={(_, val) => {
                            setFieldValue('contactId', val?.id || null);
                            if (val) {
                              setFieldValue('email', val.email || '');
                              setFieldValue('phone', val.phone || val.mobile || '');
                            }
                          }}
                          onBlur={() => setFieldTouched('contactId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Contact"
                              placeholder="Required - Select or search contact..."
                              error={touched.contactId && Boolean(errors.contactId)}
                              helperText={
                                touched.contactId
                                  ? errors.contactId
                                  : values.companyId
                                    ? 'Contacts linked to the selected company'
                                    : 'Choose a company to list contacts'
                              }
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 12,
                            backgroundColor: 'background.paper',
                            px: 1,
                            zIndex: 1,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => {
                              if (!values.companyId) {
                                setError('Select a company before adding a contact.');
                                return;
                              }
                              setError('');
                              setNewContactValues((prev) => ({ ...prev, companyId: values.companyId }));
                              setAddContactDialogOpen(true);
                            }}
                            sx={{ 
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              minWidth: 'auto',
                              px: 0.5,
                              py: 0,
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              }
                            }}
                          >
                            + Add New
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="Optional"
                        value={values.email || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email ? errors.email : ' '}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        placeholder="Optional"
                        value={values.phone || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone ? errors.phone : ' '}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Lead Details */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Lead Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Source, service interest, and estimated value
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Source"
                        name="leadSource"
                        value={values.leadSource || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.leadSource && Boolean(errors.leadSource)}
                        helperText={touched.leadSource ? errors.leadSource : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 350 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">Select Source</MenuItem>
                        {dropdowns.leadSources.map((source) => (
                          <MenuItem key={source.id} value={source.value}>{source.display_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        name="status"
                        value={values.status || 'new'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status ? errors.status : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 250 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="contacted">Contacted</MenuItem>
                        <MenuItem value="qualified">Qualified</MenuItem>
                        <MenuItem value="disqualified">Disqualified</MenuItem>
                        <MenuItem value="converted">Converted</MenuItem>
                      </TextField>
                    </Grid>
                    {showAssignedTo && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          fullWidth
                          options={users}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object'
                              ? `${opt.first_name || ''} ${opt.last_name || ''}`.trim() + (opt.email ? ` (${opt.email})` : '')
                              : ''
                          }
                          value={users.find((u) => u.id === values.assignedTo) || null}
                          onChange={(_, val) => setFieldValue('assignedTo', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Assigned To"
                              placeholder="Select sales rep..."
                              helperText="Assign lead to a sales representative"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Grid>
                    )}
                    <Grid size={12}>
                      <Autocomplete
                        fullWidth
                        options={products}
                        getOptionLabel={(opt) =>
                          typeof opt === 'object' ? `${opt.name}${opt.category ? ` - ${opt.category}` : ''}` : ''
                        }
                        value={products.find((p) => p.id === values.productServiceId) || null}
                        onChange={(_, val) => setFieldValue('productServiceId', val?.id || null)}
                        onBlur={() => setFieldTouched('productServiceId', true)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Item"
                            placeholder="Select product or service..."
                            error={touched.productServiceId && Boolean(errors.productServiceId)}
                            helperText={touched.productServiceId ? errors.productServiceId : ' '}
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        )}
                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        ListboxProps={{ style: { maxHeight: '300px' } }}
                        PopperComponent={WidePopper}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        name="notes"
                        placeholder="Optional - Add any additional notes or comments..."
                        value={values.notes || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={() => navigate('/erp/leads')}
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
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
                </Button>
              </Stack>
            </form>
          );}}
        </Formik>

        {/* Add Company Dialog */}
        <Dialog open={addCompanyDialogOpen} onClose={() => setAddCompanyDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
            <Typography variant="h4" fontWeight={700}>Add New Company</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>Create a company and select it for this lead</Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 5, px: 4 }}>
            {newCompanyErrors.submit && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{newCompanyErrors.submit}</Alert>}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Company Name" value={newCompanyValues.companyName} onChange={(e) => setNewCompanyValues((v) => ({ ...v, companyName: e.target.value }))}
                  error={Boolean(newCompanyErrors.companyName)} helperText={newCompanyErrors.companyName} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth select label="Type" value={newCompanyValues.type || 'organization'} onChange={(e) => setNewCompanyValues((v) => ({ ...v, type: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="organization">Organization</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" required value={newCompanyValues.phone} onChange={(e) => setNewCompanyValues((v) => ({ ...v, phone: e.target.value }))}
                  error={Boolean(newCompanyErrors.phone)} helperText={newCompanyErrors.phone} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" type="email" value={newCompanyValues.email} onChange={(e) => setNewCompanyValues((v) => ({ ...v, email: e.target.value }))}
                  error={Boolean(newCompanyErrors.email)} helperText={newCompanyErrors.email} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth select label="Country" required value={newCompanyValues.country} onChange={(e) => setNewCompanyValues((v) => ({ ...v, country: e.target.value }))}
                  error={Boolean(newCompanyErrors.country)} helperText={newCompanyErrors.country} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                  {dropdowns.countries?.map((c) => <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth select label="City" required value={newCompanyValues.city} onChange={(e) => setNewCompanyValues((v) => ({ ...v, city: e.target.value }))}
                  error={Boolean(newCompanyErrors.city)} helperText={newCompanyErrors.city} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                  <MenuItem value="">None</MenuItem>
                  {dropdowns.cities?.map((city) => <MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Address" required value={newCompanyValues.address} onChange={(e) => setNewCompanyValues((v) => ({ ...v, address: e.target.value }))}
                  error={Boolean(newCompanyErrors.address)} helperText={newCompanyErrors.address} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth select label="Industry Type" value={newCompanyValues.industryType} onChange={(e) => setNewCompanyValues((v) => ({ ...v, industryType: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                  <MenuItem value="">None</MenuItem>
                  {dropdowns.industryTypes?.map((t) => <MenuItem key={t.id} value={t.value}>{t.display_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="VAT/TRN Number" placeholder="Optional" value={newCompanyValues.vatNumber} onChange={(e) => setNewCompanyValues((v) => ({ ...v, vatNumber: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
            <Button onClick={() => { setAddCompanyDialogOpen(false); setNewCompanyErrors({}); }} sx={{ minWidth: 120, borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" disabled={savingCompany} onClick={handleCreateCompany} sx={{ minWidth: 150, borderRadius: 2 }}>
              {savingCompany ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Contact Dialog */}
        <Dialog open={addContactDialogOpen} onClose={() => setAddContactDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
            <Typography variant="h4" fontWeight={700}>Add New Contact</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>Create a contact and select it for this lead</Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 5, px: 4 }}>
            {newContactErrors.submit && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{newContactErrors.submit}</Alert>}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="First Name" value={newContactValues.firstName} onChange={(e) => setNewContactValues((v) => ({ ...v, firstName: e.target.value }))}
                  error={Boolean(newContactErrors.firstName)} helperText={newContactErrors.firstName} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Last Name" value={newContactValues.lastName} onChange={(e) => setNewContactValues((v) => ({ ...v, lastName: e.target.value }))}
                  error={Boolean(newContactErrors.lastName)} helperText={newContactErrors.lastName} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" value={newContactValues.phone} onChange={(e) => setNewContactValues((v) => ({ ...v, phone: e.target.value }))}
                  error={Boolean(newContactErrors.phone)} helperText={newContactErrors.phone} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" type="email" value={newContactValues.email} onChange={(e) => setNewContactValues((v) => ({ ...v, email: e.target.value }))}
                  error={Boolean(newContactErrors.email)} helperText={newContactErrors.email} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth select label="Designation" value={newContactValues.designation} onChange={(e) => setNewContactValues((v) => ({ ...v, designation: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                  <MenuItem value="">None</MenuItem>
                  {dropdowns.designations?.map((d) => <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
            <Button onClick={() => { setAddContactDialogOpen(false); setNewContactErrors({}); }} sx={{ minWidth: 120, borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" disabled={savingContact} onClick={handleCreateContact} sx={{ minWidth: 150, borderRadius: 2 }}>
              {savingContact ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default LeadForm;
