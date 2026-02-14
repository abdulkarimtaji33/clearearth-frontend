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
  Autocomplete,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  deal_name: Yup.string().required('Deal name is required'),
  client_id: Yup.number().required('Client is required'),
  service_type: Yup.string().required('Service type is required'),
  expected_value: Yup.number().min(0, 'Value must be positive'),
  expected_close_date: Yup.date().required('Expected close date is required'),
});

const DealForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [initialValues, setInitialValues] = useState({
    deal_name: '',
    client_id: '',
    service_type: '',
    expected_value: '',
    expected_close_date: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await apiService.getClients({ pageSize: 100 });
      if (response.success) {
        setClients(response.data.items || response.data);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeal(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateDeal(id, values);
      } else {
        await apiService.createDeal(values);
      }
      navigate('/erp/deals');
    } catch (err) {
      setError(err.message || 'Failed to save deal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Deal' : 'Create Deal'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Deal' : 'Create Deal'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/deals')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Deal' : 'Create Deal'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <Typography variant="h6" mb={2}>Deal Information</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Deal Name"
                        name="deal_name"
                        value={values.deal_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.deal_name && Boolean(errors.deal_name)}
                        helperText={touched.deal_name && errors.deal_name}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        options={clients}
                        getOptionLabel={(option) => option.client_type === 'company' ? option.company_name : `${option.first_name} ${option.last_name}`}
                        value={clients.find(c => c.id === values.client_id) || null}
                        onChange={(e, value) => setFieldValue('client_id', value?.id || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Client"
                            error={touched.client_id && Boolean(errors.client_id)}
                            helperText={touched.client_id && errors.client_id}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Service Type"
                        name="service_type"
                        value={values.service_type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.service_type && Boolean(errors.service_type)}
                        helperText={touched.service_type && errors.service_type}
                      >
                        <MenuItem value="waste_collection">Waste Collection</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="disposal">Disposal</MenuItem>
                        <MenuItem value="itad">ITAD Services</MenuItem>
                        <MenuItem value="consulting">Consulting</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Expected Value (AED)"
                        name="expected_value"
                        type="number"
                        value={values.expected_value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.expected_value && Boolean(errors.expected_value)}
                        helperText={touched.expected_value && errors.expected_value}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Expected Close Date"
                        name="expected_close_date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={values.expected_close_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.expected_close_date && Boolean(errors.expected_close_date)}
                        helperText={touched.expected_close_date && errors.expected_close_date}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        multiline
                        rows={3}
                        value={values.description}
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
                        rows={2}
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/deals')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Deal' : 'Create Deal'}
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

export default DealForm;
