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
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').nullable(),
  phone: Yup.string().nullable(),
});

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    jobTitle: '',
    department: '',
    status: 'active',
    notes: '',
  });

  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContact(id);
      if (response.success) {
        const c = response.data;
        setInitialValues({
          firstName: c.first_name || '',
          lastName: c.last_name || '',
          email: c.email || '',
          phone: c.phone || '',
          mobile: c.mobile || '',
          jobTitle: c.job_title || '',
          department: c.department || '',
          status: c.status || 'active',
          notes: c.notes || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (isEdit) {
        await apiService.updateContact(id, values);
        setSuccess('Contact updated successfully!');
      } else {
        await apiService.createContact(values);
        setSuccess('Contact created successfully!');
      }
      setTimeout(() => navigate('/erp/contacts'), 1000);
    } catch (err) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return (
      <PageContainer title={isEdit ? 'Edit Contact' : 'Add Contact'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={isEdit ? 'Edit Contact' : 'Add Contact'}
      description="Manage contact details"
    >
      <Box>
        <Box display="flex" alignItems="center" mb={3} gap={2}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft />}
            onClick={() => navigate('/erp/contacts')}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight="600">
              {isEdit ? 'Edit Contact' : 'Add New Contact'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting }) => (
            <form onSubmit={formikSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="First Name *"
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.firstName && Boolean(errors.firstName)}
                        helperText={touched.firstName && errors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Last Name *"
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.lastName && Boolean(errors.lastName)}
                        helperText={touched.lastName && errors.lastName}
                      />
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
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mobile"
                        name="mobile"
                        value={values.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        name="status"
                        value={values.status}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Professional Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Job Title"
                        name="jobTitle"
                        value={values.jobTitle}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        name="department"
                        placeholder="e.g. Sales, Finance, HR"
                        value={values.department}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/contacts')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default ContactForm;
