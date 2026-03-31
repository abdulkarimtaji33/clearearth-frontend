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
  Divider,
  Stack,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Product/Service name is required'),
  category: Yup.string().trim().required('Category is required'),
  description: Yup.string().trim().nullable(),
  unitOfMeasure: Yup.string().trim().required('Unit of measure is required'),
  price: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  status: Yup.string().oneOf(['active', 'inactive']).required('Active status is required'),
});

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dropdowns, setDropdowns] = useState({
    categories: [],
    unitsOfMeasure: [],
  });

  const [initialValues, setInitialValues] = useState({
    name: '',
    category: '',
    description: '',
    unitOfMeasure: '',
    price: '',
    status: 'active',
  });

  const isEdit = Boolean(id);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({
          categories: response.data.product_categories || [],
          unitsOfMeasure: response.data.units_of_measure || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
      setDropdowns({
        categories: [],
        unitsOfMeasure: [],
      });
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getProduct(id);
      if (response.success) {
        const p = response.data;
        setInitialValues({
          name: p.name || '',
          category: p.category || '',
          description: p.description || '',
          unitOfMeasure: p.unit_of_measure || '',
          price: p.price || '',
          status: p.status || 'active',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load product/service');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDropdowns();
    if (isEdit) {
      fetchProduct();
    }
  }, [isEdit, fetchDropdowns, fetchProduct]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (isEdit) {
        await apiService.updateProduct(id, values);
        setSuccess('Product/Service updated successfully!');
      } else {
        await apiService.createProduct(values);
        setSuccess('Product/Service created successfully!');
      }
      setTimeout(() => navigate('/erp/products'), 1000);
    } catch (err) {
      let errorMessage = err.message || 'Failed to save product/service';
      if (err.errors) {
        if (typeof err.errors === 'string') {
          errorMessage = err.errors;
        } else if (Array.isArray(err.errors)) {
          errorMessage = err.errors.map(e => e.msg || e.message || e).join(', ');
        } else if (typeof err.errors === 'object') {
          errorMessage = Object.values(err.errors).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return (
      <PageContainer title={isEdit ? 'Edit Product/Service' : 'Add Product/Service'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={isEdit ? 'Edit Product/Service' : 'Add Product/Service'}
      description="Manage product or service details"
    >
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/products')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Product/Service' : 'Add New Product/Service'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update product/service information' : 'Create a new product or service'}
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
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
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Product/Service Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Basic details about the product or service
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Product/Service Name"
                        name="name"
                        placeholder="Required"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name ? errors.name : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
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
                        helperText={touched.category ? errors.category : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 300 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">Select Category</MenuItem>
                        {dropdowns.categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.value}>{cat.display_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        placeholder="Optional - describe the product or service..."
                        value={values.description || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Pricing & Measurement
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Price and unit of measure details
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        select
                        label="Unit of Measure"
                        name="unitOfMeasure"
                        value={values.unitOfMeasure}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.unitOfMeasure && Boolean(errors.unitOfMeasure)}
                        helperText={touched.unitOfMeasure ? errors.unitOfMeasure : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 300 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">Select Unit</MenuItem>
                        {dropdowns.unitsOfMeasure.map((unit) => (
                          <MenuItem key={unit.id} value={unit.value}>{unit.display_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Price"
                        name="price"
                        type="number"
                        value={values.price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price && Boolean(errors.price)}
                        helperText={touched.price ? errors.price : ' '}
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        select
                        label="Active"
                        name="status"
                        value={values.status || 'active'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status ? errors.status : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/products')}
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
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Product/Service' : 'Create Product/Service'}
                </Button>
              </Stack>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default ProductForm;
