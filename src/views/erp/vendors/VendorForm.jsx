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
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  vendorType: Yup.string().required('Vendor type is required'),
  companyName: Yup.string().when('vendorType', {
    is: 'company',
    then: (schema) => schema.required('Company name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  firstName: Yup.string().when('vendorType', {
    is: 'individual',
    then: (schema) => schema.required('First name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  lastName: Yup.string().when('vendorType', {
    is: 'individual',
    then: (schema) => schema.required('Last name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone is required'),
});

const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialValues, setInitialValues] = useState({
    vendorType: 'company',
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'UAE',
    postalCode: '',
    serviceCategories: [],
    trnNumber: '',
    paymentTermsDays: 30,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVendor(id);
      if (response.success) {
        const data = response.data;
        // Convert snake_case from API to camelCase for form
        setInitialValues({
          vendorType: data.vendor_type || 'company',
          companyName: data.company_name || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'UAE',
          postalCode: data.postal_code || '',
          serviceCategories: (() => {
            let cats = data.service_categories;
            if (typeof cats === 'string') {
              try { cats = JSON.parse(cats); } catch { cats = []; }
            }
            return Array.isArray(cats) ? cats : [];
          })(),
          trnNumber: data.trn_number || '',
          paymentTermsDays: data.payment_terms_days || 30,
          notes: data.notes || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors: setFormikErrors }) => {
    try {
      setError('');
      setSuccess('');

      // Clean payload based on type
      const payload = { ...values };
      if (payload.vendorType === 'company') {
        delete payload.firstName;
        delete payload.lastName;
      } else {
        delete payload.companyName;
      }

      if (id) {
        await apiService.updateVendor(id, payload);
        setSuccess('Vendor updated successfully!');
      } else {
        await apiService.createVendor(payload);
        setSuccess('Vendor created successfully!');
      }
      setTimeout(() => {
        navigate('/erp/vendors');
      }, 1500);
    } catch (err) {
      // If there are validation errors from backend, show them
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach(error => {
          fieldErrors[error.field] = error.message;
        });
        setFormikErrors(fieldErrors);
        setError(`Validation failed: ${err.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      } else {
        setError(err.message || 'Failed to save vendor');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Vendor' : 'Create Vendor'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Vendor' : 'Create Vendor'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/vendors')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Vendor' : 'Create Vendor'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4 }}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <Typography variant="h6" mb={2}>Basic Information</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Vendor Type"
                        name="vendorType"
                        value={values.vendorType || 'company'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.vendorType && Boolean(errors.vendorType)}
                        helperText={touched.vendorType && errors.vendorType}
                        required
                      >
                        <MenuItem value="company">Company</MenuItem>
                        <MenuItem value="individual">Individual</MenuItem>
                      </TextField>
                    </Grid>

                    {values.vendorType === 'company' ? (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Company Name"
                          name="companyName"
                          value={values.companyName || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.companyName && Boolean(errors.companyName)}
                          helperText={touched.companyName && errors.companyName}
                          required
                        />
                      </Grid>
                    ) : (
                      <>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={values.firstName || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.firstName && Boolean(errors.firstName)}
                            helperText={touched.firstName && errors.firstName}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={values.lastName || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.lastName && Boolean(errors.lastName)}
                            helperText={touched.lastName && errors.lastName}
                            required
                          />
                        </Grid>
                      </>
                    )}

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={values.email || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={values.phone || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone && errors.phone}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Service Category"
                        name="serviceCategories"
                        value={values.serviceCategories?.[0] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFieldValue('serviceCategories', value ? [value] : []);
                        }}
                        onBlur={handleBlur}
                        error={touched.serviceCategories && Boolean(errors.serviceCategories)}
                        helperText={touched.serviceCategories && errors.serviceCategories}
                      >
                        <MenuItem value="">
                          <em>Select a category</em>
                        </MenuItem>
                        <MenuItem value="waste_collection">Waste Collection</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="disposal">Disposal</MenuItem>
                        <MenuItem value="itad">ITAD Services</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Payment Terms (days)"
                        name="paymentTermsDays"
                        type="number"
                        value={values.paymentTermsDays || 30}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Tax Registration Number (TRN)"
                        name="trnNumber"
                        value={values.trnNumber || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <Typography variant="h6" mb={2} mt={2}>Address Information</Typography>
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        multiline
                        rows={2}
                        value={values.address || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="City" 
                        name="city" 
                        value={values.city || ''} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="State" 
                        name="state" 
                        value={values.state || ''} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="Country" 
                        name="country" 
                        value={values.country || 'UAE'} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="Postal Code" 
                        name="postalCode" 
                        value={values.postalCode || ''} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        name="notes"
                        multiline
                        rows={3}
                        value={values.notes || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/vendors')} size="large">
                          Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting} size="large">
                          {isSubmitting ? 'Saving...' : id ? 'Update Vendor' : 'Create Vendor'}
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

export default VendorForm;
