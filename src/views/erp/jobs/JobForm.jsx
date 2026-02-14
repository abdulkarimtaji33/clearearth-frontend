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
  deal_id: Yup.number().required('Deal is required'),
  job_type: Yup.string().required('Job type is required'),
  start_date: Yup.date().required('Start date is required'),
});

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deals, setDeals] = useState([]);
  const [initialValues, setInitialValues] = useState({
    deal_id: '',
    job_type: '',
    start_date: '',
    scheduled_completion_date: '',
    description: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchDeals();
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchDeals = async () => {
    try {
      const response = await apiService.getDeals({ pageSize: 100 });
      if (response.success) {
        setDeals(response.data.items || response.data);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await apiService.getJob(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateJob(id, values);
      } else {
        await apiService.createJob(values);
      }
      navigate('/erp/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Job' : 'Create Job'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Job' : 'Create Job'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/jobs')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Job' : 'Create Job'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        options={deals}
                        getOptionLabel={(option) => option.deal_name || ''}
                        value={deals.find(d => d.id === values.deal_id) || null}
                        onChange={(e, value) => setFieldValue('deal_id', value?.id || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Deal"
                            error={touched.deal_id && Boolean(errors.deal_id)}
                            helperText={touched.deal_id && errors.deal_id}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Job Type"
                        name="job_type"
                        value={values.job_type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.job_type && Boolean(errors.job_type)}
                        helperText={touched.job_type && errors.job_type}
                      >
                        <MenuItem value="collection">Collection</MenuItem>
                        <MenuItem value="sorting">Sorting</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="disposal">Disposal</MenuItem>
                        <MenuItem value="destruction">Destruction</MenuItem>
                        <MenuItem value="itad">ITAD</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        name="start_date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={values.start_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.start_date && Boolean(errors.start_date)}
                        helperText={touched.start_date && errors.start_date}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Scheduled Completion Date"
                        name="scheduled_completion_date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={values.scheduled_completion_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Location" name="location" value={values.location} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Description" name="description" multiline rows={3} value={values.description} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <TextField fullWidth label="Notes" name="notes" multiline rows={2} value={values.notes} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/jobs')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Job' : 'Create Job'}
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

export default JobForm;
