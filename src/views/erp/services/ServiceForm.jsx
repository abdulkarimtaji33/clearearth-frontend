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
  service_code: Yup.string().required('Service code is required'),
  service_name: Yup.string().required('Service name is required'),
  category: Yup.string().required('Category is required'),
  unit_price: Yup.number().min(0, 'Price must be positive').required('Unit price is required'),
});

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialValues, setInitialValues] = useState({
    service_code: '',
    service_name: '',
    category: '',
    description: '',
    unit_price: '',
    unit_of_measure: 'service',
  });

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await apiService.getService(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateService(id, values);
      } else {
        await apiService.createService(values);
      }
      navigate('/erp/services');
    } catch (err) {
      setError(err.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Service' : 'Create Service'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Service' : 'Create Service'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/services')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Service' : 'Create Service'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Service Code" name="service_code" value={values.service_code} onChange={handleChange} onBlur={handleBlur} error={touched.service_code && Boolean(errors.service_code)} helperText={touched.service_code && errors.service_code} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Service Name" name="service_name" value={values.service_name} onChange={handleChange} onBlur={handleBlur} error={touched.service_name && Boolean(errors.service_name)} helperText={touched.service_name && errors.service_name} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Category"
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.category && Boolean(errors.category)}
                        helperText={touched.category && errors.category}
                      >
                        <MenuItem value="collection">Collection</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="disposal">Disposal</MenuItem>
                        <MenuItem value="consulting">Consulting</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Unit Price (AED)" name="unit_price" type="number" value={values.unit_price} onChange={handleChange} onBlur={handleBlur} error={touched.unit_price && Boolean(errors.unit_price)} helperText={touched.unit_price && errors.unit_price} />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Description" name="description" multiline rows={4} value={values.description} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/services')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Service' : 'Create Service'}
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

export default ServiceForm;
