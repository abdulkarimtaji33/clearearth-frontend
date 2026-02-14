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
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone is required'),
  lead_source: Yup.string().required('Lead source is required'),
  service_interest: Yup.string().required('Service interest is required'),
});

const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialValues, setInitialValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    lead_source: '',
    service_interest: '',
    estimated_value: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLead(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateLead(id, values);
      } else {
        await apiService.createLead(values);
      }
      navigate('/erp/leads');
    } catch (err) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Lead' : 'Create Lead'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Lead' : 'Create Lead'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/leads')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Lead' : 'Create Lead'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <Typography variant="h6" mb={2}>Contact Information</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="First Name" name="first_name" value={values.first_name} onChange={handleChange} onBlur={handleBlur} error={touched.first_name && Boolean(errors.first_name)} helperText={touched.first_name && errors.first_name} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Last Name" name="last_name" value={values.last_name} onChange={handleChange} onBlur={handleBlur} error={touched.last_name && Boolean(errors.last_name)} helperText={touched.last_name && errors.last_name} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Email" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={touched.email && Boolean(errors.email)} helperText={touched.email && errors.email} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Phone" name="phone" value={values.phone} onChange={handleChange} onBlur={handleBlur} error={touched.phone && Boolean(errors.phone)} helperText={touched.phone && errors.phone} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Company" name="company" value={values.company} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Job Title" name="job_title" value={values.job_title} onChange={handleChange} onBlur={handleBlur} />
                    </Grid>

                    <Grid size={12}>
                      <Typography variant="h6" mb={2} mt={2}>Lead Details</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Lead Source"
                        name="lead_source"
                        value={values.lead_source}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.lead_source && Boolean(errors.lead_source)}
                        helperText={touched.lead_source && errors.lead_source}
                      >
                        <MenuItem value="website">Website</MenuItem>
                        <MenuItem value="referral">Referral</MenuItem>
                        <MenuItem value="cold_call">Cold Call</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="social_media">Social Media</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Service Interest"
                        name="service_interest"
                        value={values.service_interest}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.service_interest && Boolean(errors.service_interest)}
                        helperText={touched.service_interest && errors.service_interest}
                      >
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
                        label="Estimated Value"
                        name="estimated_value"
                        type="number"
                        value={values.estimated_value}
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
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/leads')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Lead' : 'Create Lead'}
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

export default LeadForm;
