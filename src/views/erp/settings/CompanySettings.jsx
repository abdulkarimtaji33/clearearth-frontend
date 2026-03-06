import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
  Stack,
  Divider,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Tenant name is required'),
  company_name: Yup.string().trim().required('Company name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().nullable(),
  address: Yup.string().nullable(),
  city: Yup.string().nullable(),
  country: Yup.string().trim().nullable(),
  trn_number: Yup.string().nullable(),
  vat_registration_number: Yup.string().nullable(),
  license_number: Yup.string().nullable(),
});

const CompanySettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dropdowns, setDropdowns] = useState({ countries: [], cities: [] });

  const [initialValues, setInitialValues] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    trn_number: '',
    vat_registration_number: '',
    license_number: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [tenantRes, dropdownRes] = await Promise.all([
          apiService.getTenant(),
          apiService.getAllDropdowns(),
        ]);
        if (tenantRes.success && tenantRes.data) {
          const t = tenantRes.data;
          setInitialValues({
            name: t.name || '',
            company_name: t.company_name || '',
            email: t.email || '',
            phone: t.phone || '',
            address: t.address || '',
            city: t.city || '',
            country: t.country || 'UAE',
            trn_number: t.trn_number || '',
            vat_registration_number: t.vat_registration_number || '',
            license_number: t.license_number || '',
          });
          if (t.logo) {
            setLogoUrl(apiService.getUploadUrl(t.logo));
          }
        }
        if (dropdownRes.success && dropdownRes.data) {
          setDropdowns({
            countries: dropdownRes.data.countries || [],
            cities: dropdownRes.data.uae_cities || [],
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load company settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Company Settings">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Company Settings" description="Your organization details used in quotations and purchase orders">
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate(-1)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              Company Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Update your organization info (used in PDF documents)
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              setError('');
              await apiService.updateTenant(values);
              setSuccess('Company settings updated successfully');
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              setError(err.message || 'Failed to save');
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Organization Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    This information appears as the "From" party on quotations and purchase orders
                  </Typography>
                  <Divider sx={{ mb: 4 }} />

                  <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Tenant Name"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name ? errors.name : ' '}
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            name="company_name"
                            placeholder="As shown on documents"
                            value={values.company_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.company_name && Boolean(errors.company_name)}
                            helperText={touched.company_name ? errors.company_name : ' '}
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.email && Boolean(errors.email)}
                            helperText={touched.email ? errors.email : ' '}
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={values.phone || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            multiline
                            rows={2}
                            value={values.address || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            select
                            label="Country"
                            name="country"
                            value={values.country || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {dropdowns.countries.map((c) => (
                              <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            select
                            label="City"
                            name="city"
                            value={values.city || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {dropdowns.cities.map((city) => (
                              <MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="TRN Number"
                            name="trn_number"
                            placeholder="Tax Registration"
                            value={values.trn_number || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="VAT Registration Number"
                            name="vat_registration_number"
                            value={values.vat_registration_number || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="License Number"
                            name="license_number"
                            value={values.license_number || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Stack direction="row" justifyContent="flex-end" mt={4}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isSubmitting}
                      sx={{ minWidth: 140, borderRadius: 2, fontWeight: 600 }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default CompanySettings;
