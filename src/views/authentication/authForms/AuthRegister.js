import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Alert } from '@mui/material';
import { useNavigate } from 'react-router';
import { Formik } from 'formik';
import * as Yup from 'yup';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';
import { Stack } from '@mui/system';
import { useAuth } from '../../../context/AuthContext';

const validationSchema = Yup.object({
  tenantName: Yup.string().required('Tenant name is required'),
  companyName: Yup.string().required('Company name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone is required'),
});

const AuthRegister = ({ title, subtitle, subtext }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      await register({
        tenantName: values.tenantName,
        companyName: values.companyName,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Formik
        initialValues={{
          tenantName: '',
          companyName: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phone: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2} mt={3}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <CustomFormLabel htmlFor="tenantName">Tenant Name</CustomFormLabel>
                  <CustomTextField
                    id="tenantName"
                    name="tenantName"
                    variant="outlined"
                    fullWidth
                    value={values.tenantName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.tenantName && Boolean(errors.tenantName)}
                    helperText={touched.tenantName && errors.tenantName}
                  />
                </Grid>
                <Grid size={6}>
                  <CustomFormLabel htmlFor="companyName">Company Name</CustomFormLabel>
                  <CustomTextField
                    id="companyName"
                    name="companyName"
                    variant="outlined"
                    fullWidth
                    value={values.companyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.companyName && Boolean(errors.companyName)}
                    helperText={touched.companyName && errors.companyName}
                  />
                </Grid>
                <Grid size={6}>
                  <CustomFormLabel htmlFor="firstName">First Name</CustomFormLabel>
                  <CustomTextField
                    id="firstName"
                    name="firstName"
                    variant="outlined"
                    fullWidth
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                  />
                </Grid>
                <Grid size={6}>
                  <CustomFormLabel htmlFor="lastName">Last Name</CustomFormLabel>
                  <CustomTextField
                    id="lastName"
                    name="lastName"
                    variant="outlined"
                    fullWidth
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                  />
                </Grid>
              </Grid>

              <Box>
                <CustomFormLabel htmlFor="email">Email Address</CustomFormLabel>
                <CustomTextField
                  id="email"
                  name="email"
                  variant="outlined"
                  fullWidth
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
              </Box>

              <Box>
                <CustomFormLabel htmlFor="phone">Phone</CustomFormLabel>
                <CustomTextField
                  id="phone"
                  name="phone"
                  variant="outlined"
                  fullWidth
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone}
                />
              </Box>

              <Box>
                <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
                <CustomTextField
                  id="password"
                  name="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
              </Box>

              <Box>
                <CustomFormLabel htmlFor="confirmPassword">Confirm Password</CustomFormLabel>
                <CustomTextField
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
              </Box>
            </Stack>

            <Box mt={3}>
              <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>
          </form>
        )}
      </Formik>
      {subtitle}
    </>
  );
};

export default AuthRegister;
