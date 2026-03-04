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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconUsers } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roles, setRoles] = useState([]);
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: null,
    password: '',
    status: 'active',
  });

  const isEdit = Boolean(id);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiService.getRoles({ pageSize: 200 });
      if (res.success) setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getUser(id);
      if (res.success) {
        const u = res.data;
        setInitialValues({
          firstName: u.first_name || u.firstName || '',
          lastName: u.last_name || u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
          roleId: u.role_id ?? u.role?.id ?? null,
          password: '',
          status: u.status || 'active',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoles();
    if (isEdit) fetchUser();
  }, [isEdit, fetchUser, fetchRoles]);

  const validationSchema = Yup.object({
    firstName: Yup.string().trim().required('First name is required'),
    lastName: Yup.string().trim().required('Last name is required'),
    email: Yup.string().email('Valid email required').required('Email is required'),
    roleId: Yup.number().nullable().required('Role is required'),
    ...(isEdit ? {} : { password: Yup.string().min(8, 'Min 8 characters').required('Password is required') }),
  });

  const handleSubmit = async (values) => {
    try {
      setError('');
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        roleId: values.roleId,
        status: values.status,
      };
      if (!isEdit) payload.password = values.password;
      if (isEdit) {
        await apiService.updateUser(id, payload);
        setSuccess('User updated');
      } else {
        await apiService.createUser(payload);
        setSuccess('User created');
      }
      setTimeout(() => navigate('/erp/users'), 1200);
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  if (isEdit && loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit User' : 'Create User'} description={isEdit ? 'Update user and role' : 'Create new user with role'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/users')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit User' : 'Create User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Update user details and role' : 'Add a new user and assign a role'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>User Details</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.firstName && Boolean(errors.firstName)}
                        helperText={touched.firstName && errors.firstName}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.lastName && Boolean(errors.lastName)}
                        helperText={touched.lastName && errors.lastName}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Stack>
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
                      disabled={isEdit}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 400 }}
                    />
                    <TextField
                      fullWidth
                      label="Phone (optional)"
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 320 }}
                    />
                    <Autocomplete
                      options={roles}
                      getOptionLabel={(opt) => opt.display_name || opt.name || ''}
                      value={roles.find((r) => r.id === values.roleId) || null}
                      onChange={(_, v) => setFieldValue('roleId', v?.id ?? null)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Role (Required)"
                          required
                          error={touched.roleId && Boolean(errors.roleId)}
                          helperText={touched.roleId && errors.roleId}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                      sx={{ maxWidth: 400 }}
                    />
                    {!isEdit && (
                      <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        placeholder="Min 8 characters"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 400 }}
                      />
                    )}
                    {isEdit && (
                      <FormControl sx={{ maxWidth: 200 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={values.status}
                          label="Status"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="suspended">Suspended</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2 }}>
                  {isEdit ? 'Update' : 'Create'} User
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/erp/users')} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default UserForm;
