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
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  phone: Yup.string().required('Phone is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  leadSource: Yup.string().required('Lead source is required'),
  productServiceId: Yup.number().nullable().required('Product/Service is required'),
});

const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Dropdown states
  const [dropdowns, setDropdowns] = useState({
    leadSources: [],
  });
  
  const [initialValues, setInitialValues] = useState({
    companyId: null,
    contactId: null,
    email: '',
    phone: '',
    leadSource: '',
    productServiceId: null,
    estimatedValue: '',
    notes: '',
  });

  const isEdit = Boolean(id);

  const fetchCompaniesAndContacts = useCallback(async () => {
    try {
      const [companiesRes, contactsRes, productsRes] = await Promise.all([
        apiService.getCompanies({ pageSize: 500 }),
        apiService.getContacts({ pageSize: 500 }),
        apiService.getProducts({ pageSize: 500, status: 'active' }),
      ]);
      if (companiesRes.success) {
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      }
      if (contactsRes.success) {
        setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      }
      if (productsRes.success) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({
          leadSources: response.data.lead_sources || [],
        });
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
          productServiceId: lead.product_service_id || null,
          estimatedValue: lead.estimated_value || '',
          notes: lead.notes || '',
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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Transform form values to API payload
      const payload = {
        companyId: values.companyId,
        contactId: values.contactId,
        email: values.email,
        phone: values.phone,
        source: values.leadSource,
        productServiceId: values.productServiceId,
        estimatedValue: values.estimatedValue,
        notes: values.notes,
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
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => (
            <form onSubmit={formikSubmit}>
              {/* Lead Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Lead Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Select company and contact person for this lead
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object' ? opt.company_name || '' : ''
                          }
                          value={companies.find((c) => c.id === values.companyId) || null}
                          onChange={(_, val) => setFieldValue('companyId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company"
                              placeholder="Select or search company..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{
                            style: { maxHeight: '300px' }
                          }}
                          sx={{
                            '& .MuiAutocomplete-inputRoot': {
                              minWidth: '300px',
                            }
                          }}
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
                            onClick={() => navigate('/erp/companies/create')}
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
                    <Grid item xs={12} md={6}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={contacts}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object'
                              ? `${opt.first_name} ${opt.last_name}${opt.email ? ` (${opt.email})` : ''}`
                              : ''
                          }
                          value={contacts.find((c) => c.id === values.contactId) || null}
                          onChange={(_, val) => setFieldValue('contactId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Contact Person"
                              placeholder="Select or search contact..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{
                            style: { maxHeight: '300px' }
                          }}
                          sx={{
                            '& .MuiAutocomplete-inputRoot': {
                              minWidth: '300px',
                            }
                          }}
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
                            onClick={() => navigate('/erp/contacts/create')}
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone && errors.phone}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Lead Details */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Lead Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Source, service interest, and estimated value
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Lead Source"
                        name="leadSource"
                        value={values.leadSource}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.leadSource && Boolean(errors.leadSource)}
                        helperText={touched.leadSource && errors.leadSource}
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
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        fullWidth
                        options={products}
                        getOptionLabel={(opt) =>
                          typeof opt === 'object' ? `${opt.name} - ${opt.category}` : ''
                        }
                        value={products.find((p) => p.id === values.productServiceId) || null}
                        onChange={(_, val) => setFieldValue('productServiceId', val?.id || null)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Product/Service"
                            placeholder="Select product or service..."
                            error={touched.productServiceId && Boolean(errors.productServiceId)}
                            helperText={touched.productServiceId && errors.productServiceId}
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        )}
                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        ListboxProps={{
                          style: { maxHeight: '300px' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Estimated Value (AED)"
                        name="estimatedValue"
                        type="number"
                        value={values.estimatedValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notes"
                        name="notes"
                        placeholder="Add any additional notes or comments..."
                        value={values.notes}
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
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default LeadForm;
