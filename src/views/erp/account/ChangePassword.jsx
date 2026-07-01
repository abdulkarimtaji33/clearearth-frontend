import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const validationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm your new password'),
});

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Clear scroll-lock / stuck menu backdrops left by MUI Modal when navigating from profile menu
  useEffect(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }, []);

  const displayName = [user?.firstName || user?.first_name, user?.lastName || user?.last_name].filter(Boolean).join(' ')
    || user?.email
    || 'Your account';

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await apiService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setSuccess('Password updated successfully.');
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Change Password" description="Update your login password">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate(-1)} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>Change Password</Typography>
            <Typography variant="body2" color="text.secondary">
              Update the password for {displayName}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, maxWidth: 560 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" fontWeight={600} mb={1}>Account security</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter your current password, then choose a new password with at least 8 characters.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Formik
              initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Current password"
                      name="currentPassword"
                      type="password"
                      value={values.currentPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.currentPassword && Boolean(errors.currentPassword)}
                      helperText={touched.currentPassword && errors.currentPassword}
                      autoComplete="current-password"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      label="New password"
                      name="newPassword"
                      type="password"
                      value={values.newPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.newPassword && Boolean(errors.newPassword)}
                      helperText={touched.newPassword && errors.newPassword}
                      autoComplete="new-password"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm new password"
                      name="confirmPassword"
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                      autoComplete="new-password"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ borderRadius: 2, alignSelf: 'flex-start' }}>
                      {saving ? 'Updating…' : 'Update password'}
                    </Button>
                  </Stack>
                </form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ChangePassword;
