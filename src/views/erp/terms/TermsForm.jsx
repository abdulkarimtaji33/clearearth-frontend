import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  content: Yup.string().required('Content is required'),
});

const TermsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [initialValues, setInitialValues] = useState({
    title: '',
    content: '',
    category: '',
    isDefault: false,
    status: 'active',
  });

  const isEdit = Boolean(id);

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getTermsAndConditionsById(id);
      if (response.success) {
        const t = response.data;
        setInitialValues({
          title: t.title || '',
          content: t.content || '',
          category: t.category || '',
          isDefault: t.is_default || false,
          status: t.status || 'active',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchTerms();
    }
  }, [isEdit, fetchTerms]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      if (isEdit) {
        await apiService.updateTermsAndConditions(id, values);
        setSuccess('Terms and Conditions updated successfully!');
      } else {
        await apiService.createTermsAndConditions(values);
        setSuccess('Terms and Conditions created successfully!');
      }
      setTimeout(() => navigate('/erp/terms'), 1000);
    } catch (err) {
      let errorMessage = err.message || 'Failed to save terms and conditions';
      if (err.errors) {
        if (typeof err.errors === 'string') {
          errorMessage = err.errors;
        } else if (Array.isArray(err.errors)) {
          errorMessage = err.errors.map(e => e.msg || e.message || e).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return (
      <PageContainer title="Loading...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Terms' : 'Create Terms'} description="Manage terms and conditions">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/terms')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Terms & Conditions' : 'Create Terms & Conditions'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update terms and conditions' : 'Create new terms and conditions template'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => (
            <form onSubmit={formikSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Terms & Conditions Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Define the terms and conditions template
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.title && Boolean(errors.title)}
                        helperText={touched.title && errors.title}
                        required
                        placeholder="e.g. Standard Sales Terms"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        fullWidth
                        label="Category"
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Sales, Service"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      label="Content"
                      name="content"
                      placeholder="Enter the full terms and conditions text..."
                      value={values.content}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.content && Boolean(errors.content)}
                      helperText={touched.content && errors.content}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isDefault}
                            onChange={(e) => setFieldValue('isDefault', e.target.checked)}
                            name="isDefault"
                          />
                        }
                        label="Set as Default"
                      />
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        name="status"
                        value={values.status}
                        onChange={handleChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/terms')}
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
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Terms' : 'Create Terms'}
                </Button>
              </Stack>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default TermsForm;
