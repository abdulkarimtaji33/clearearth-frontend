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
  product_code: Yup.string().required('Product code is required'),
  product_name: Yup.string().required('Product name is required'),
  category: Yup.string().required('Category is required'),
  unit_price: Yup.number().min(0, 'Price must be positive').required('Unit price is required'),
  unit_of_measure: Yup.string().required('Unit of measure is required'),
});

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialValues, setInitialValues] = useState({
    product_code: '',
    product_name: '',
    category: '',
    description: '',
    unit_price: '',
    unit_of_measure: '',
    specifications: '',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProduct(id);
      if (response.success) {
        setInitialValues(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (id) {
        await apiService.updateProduct(id, values);
      } else {
        await apiService.createProduct(values);
      }
      navigate('/erp/products');
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={id ? 'Edit Product' : 'Create Product'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={id ? 'Edit Product' : 'Create Product'}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/products')} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {id ? 'Edit Product' : 'Create Product'}
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
                      <TextField
                        fullWidth
                        label="Product Code"
                        name="product_code"
                        value={values.product_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.product_code && Boolean(errors.product_code)}
                        helperText={touched.product_code && errors.product_code}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Product Name"
                        name="product_name"
                        value={values.product_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.product_name && Boolean(errors.product_name)}
                        helperText={touched.product_name && errors.product_name}
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
                        helperText={touched.category && errors.category}
                      >
                        <MenuItem value="materials">Materials</MenuItem>
                        <MenuItem value="equipment">Equipment</MenuItem>
                        <MenuItem value="supplies">Supplies</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Unit of Measure"
                        name="unit_of_measure"
                        value={values.unit_of_measure}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.unit_of_measure && Boolean(errors.unit_of_measure)}
                        helperText={touched.unit_of_measure && errors.unit_of_measure}
                      >
                        <MenuItem value="kg">Kilogram (kg)</MenuItem>
                        <MenuItem value="ton">Ton</MenuItem>
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="liter">Liter</MenuItem>
                        <MenuItem value="meter">Meter</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Unit Price (AED)"
                        name="unit_price"
                        type="number"
                        value={values.unit_price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.unit_price && Boolean(errors.unit_price)}
                        helperText={touched.unit_price && errors.unit_price}
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
                        label="Specifications"
                        name="specifications"
                        multiline
                        rows={2}
                        value={values.specifications}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>

                    <Grid size={12}>
                      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                        <Button onClick={() => navigate('/erp/products')}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
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

export default ProductForm;
