import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
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
  warehouse_code: Yup.string().required('Warehouse code is required'),
  warehouse_name: Yup.string().required('Warehouse name is required'),
  location: Yup.string().required('Location is required'),
});

const WarehouseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialValues, setInitialValues] = useState({
    warehouse_code: '',
    warehouse_name: '',
    location: '',
    address: '',
    capacity: '',
    manager_name: '',
    contact_phone: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWarehouse(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateWarehouse(id, values);
      } else {
        await apiService.createWarehouse(values);
      }
      navigate('/erp/warehouses');
    } catch (err) {
      setError(err.message || 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Warehouse' : 'Create Warehouse'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Warehouse' : 'Create Warehouse'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/warehouses')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Warehouse' : 'Create Warehouse'}
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
                      <TextField fullWidth label="Warehouse Code" name="warehouse_code" value={values.warehouse_code} onChange={handleChange} onBlur={handleBlur} error={touched.warehouse_code && Boolean(errors.warehouse_code)} helperText={touched.warehouse_code && errors.warehouse_code} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Warehouse Name" name="warehouse_name" value={values.warehouse_name} onChange={handleChange} onBlur={handleBlur} error={touched.warehouse_name && Boolean(errors.warehouse_name)} helperText={touched.warehouse_name && errors.warehouse_name} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Location" name="location" value={values.location} onChange={handleChange} onBlur={handleBlur} error={touched.location && Boolean(errors.location)} helperText={touched.location && errors.location} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Capacity (sq ft)" name="capacity" type="number" value={values.capacity} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Address" name="address" multiline rows={2} value={values.address} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Manager Name" name="manager_name" value={values.manager_name} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Contact Phone" name="contact_phone" value={values.contact_phone} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Notes" name="notes" multiline rows={2} value={values.notes} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/warehouses')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Warehouse' : 'Create Warehouse'}
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

export default WarehouseForm;
