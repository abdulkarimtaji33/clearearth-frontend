import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
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
  Stack,
  Divider,
  Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IconArrowLeft, IconUpload, IconPhoto, IconSignature, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { phoneYup, PHONE_PLACEHOLDER, PHONE_HELP_TEXT } from '../../../utils/phone';
import { useAuth } from '../../../context/AuthContext';

const ADMIN_ROLES = ['admin', 'tenant_admin', 'super_admin'];

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Tenant name is required'),
  company_name: Yup.string().trim().required('Company name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: phoneYup(Yup, { label: 'Phone number' }),
  address: Yup.string().nullable(),
  city: Yup.string().nullable(),
  country: Yup.string().trim().nullable(),
  trn_number: Yup.string().nullable(),
  vat_registration_number: Yup.string().nullable(),
  license_number: Yup.string().nullable(),
});

const CompanySettings = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const roleName = user?.role?.name ?? user?.role;
  const canManageApprovalPin = ADMIN_ROLES.includes(roleName);
  const logoInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const signatureInputRef = useRef(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureRemoving, setSignatureRemoving] = useState(false);
  const [dropdowns, setDropdowns] = useState({ countries: [], cities: [] });
  const [leadApprovalPin, setLeadApprovalPin] = useState('');
  const [leadApprovalPinConfirm, setLeadApprovalPinConfirm] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const [initialValues, setInitialValues] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    trn_number: '',
    vat_registration_number: '',
    license_number: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [tenantRes, dropdownRes] = await Promise.all([
          apiService.getTenant(),
          apiService.getAllDropdowns(),
        ]);
        if (tenantRes.success && tenantRes.data) {
          const t = tenantRes.data;
          setInitialValues({
            name: t.name || '',
            company_name: t.company_name || '',
            email: t.email || '',
            phone: t.phone || '',
            address: t.address || '',
            city: t.city || '',
            country: t.country || 'UAE',
            trn_number: t.trn_number || '',
            vat_registration_number: t.vat_registration_number || '',
            license_number: t.license_number || '',
          });
          if (t.logo) {
            setLogoUrl(apiService.getUploadUrl(t.logo));
          }
          if (t.signature) {
            setSignatureUrl(apiService.getUploadUrl(t.signature));
          }
          setPinConfigured(Boolean(t.lead_approval_pin_configured));
        }
        if (dropdownRes.success && dropdownRes.data) {
          setDropdowns({
            countries: dropdownRes.data.countries || [],
            cities: dropdownRes.data.uae_cities || [],
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load company settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      setError('');
      const res = await apiService.uploadTenantLogo(file);
      if (res.success && res.data?.url) {
        setLogoUrl(res.data.url);
        try { sessionStorage.setItem('tenantLogo', res.data.url); } catch { /* ignore */ }
        setSuccess('Logo updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const SIGNATURE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!SIGNATURE_TYPES.includes(file.type)) {
      setError('Signature must be a PNG, JPG or WebP image. A transparent PNG works best.');
      return;
    }
    if (file.size > SIGNATURE_MAX_BYTES) {
      setError('Signature image is too large — choose a file under 2 MB.');
      return;
    }

    try {
      setSignatureUploading(true);
      setError('');
      const res = await apiService.uploadTenantSignature(file);
      if (res.success && res.data?.url) {
        setSignatureUrl(res.data.url);
        setSuccess('Signature updated. It will appear on new quotations and purchase orders.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Could not upload the signature. Please try again.');
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleSignatureRemove = async () => {
    try {
      setSignatureRemoving(true);
      setError('');
      const res = await apiService.deleteTenantSignature();
      if (res.success) {
        setSignatureUrl('');
        setSuccess('Signature removed. Documents will show a blank signing line.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Could not remove the signature. Please try again.');
    } finally {
      setSignatureRemoving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Company Settings">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Company Settings" description="Your organization details used in quotations and purchase orders">
      <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(-1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>Company Settings</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>Organization info used in PDF documents</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        {/* Logo card */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <Typography variant="subtitle1" fontWeight={700}>Company Logo</Typography>
            <Typography variant="body2" color="text.secondary">Appears on the sidebar, login page, and PDF documents</Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 3,
                  border: '2px dashed',
                  borderColor: logoUrl ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  flexShrink: 0,
                }}
              >
                {logoUrl ? (
                  <Box component="img" src={logoUrl} alt="Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
                ) : (
                  <IconPhoto size={32} style={{ opacity: 0.3 }} />
                )}
              </Box>
              <Box>
                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                <Button
                  variant="outlined"
                  startIcon={logoUploading ? <CircularProgress size={16} /> : <IconUpload size={16} />}
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  PNG, JPG or WebP. Recommended: 200×60px or similar wide format.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Authorised signature card */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <Typography variant="subtitle1" fontWeight={700}>Authorised Signature</Typography>
            <Typography variant="body2" color="text.secondary">Printed beside the company stamp on quotations and purchase orders</Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3}>
              <Box
                sx={{
                  width: 180,
                  height: 100,
                  borderRadius: 3,
                  border: '2px dashed',
                  borderColor: signatureUrl ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  // A light backdrop keeps a transparent-PNG signature visible in dark mode.
                  bgcolor: signatureUrl ? '#fff' : alpha(theme.palette.primary.main, 0.04),
                  flexShrink: 0,
                }}
              >
                {signatureUrl ? (
                  <Box component="img" src={signatureUrl} alt="Authorised signature" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
                ) : (
                  <Stack alignItems="center" spacing={0.5}>
                    <IconSignature size={28} style={{ opacity: 0.3 }} />
                    <Typography variant="caption" color="text.secondary">No signature yet</Typography>
                  </Stack>
                )}
              </Box>
              <Box>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleSignatureUpload}
                />
                <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={signatureUploading ? <CircularProgress size={16} /> : <IconUpload size={16} />}
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={signatureUploading || signatureRemoving}
                    sx={{ borderRadius: 2 }}
                  >
                    {signatureUploading ? 'Uploading…' : signatureUrl ? 'Change signature' : 'Upload signature'}
                  </Button>
                  {signatureUrl && (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={signatureRemoving ? <CircularProgress size={16} /> : <IconTrash size={16} />}
                      onClick={handleSignatureRemove}
                      disabled={signatureUploading || signatureRemoving}
                      sx={{ borderRadius: 2 }}
                    >
                      {signatureRemoving ? 'Removing…' : 'Remove'}
                    </Button>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  PNG, JPG or WebP up to 2 MB. A transparent PNG of a dark-ink signature gives the cleanest result over the stamp.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              setError('');
              await apiService.updateTenant(values);
              setSuccess('Company settings updated successfully');
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              setError(err.message || 'Failed to save');
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
                <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <Typography variant="subtitle1" fontWeight={700}>Organization Details</Typography>
                  <Typography variant="body2" color="text.secondary">Appears as the "From" party on quotations and purchase orders</Typography>
                </Box>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Tenant Name" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} error={touched.name && Boolean(errors.name)} helperText={touched.name ? errors.name : ' '} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Company Name" name="company_name" placeholder="As shown on documents" value={values.company_name} onChange={handleChange} onBlur={handleBlur} error={touched.company_name && Boolean(errors.company_name)} helperText={touched.company_name ? errors.company_name : ' '} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Email" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={touched.email && Boolean(errors.email)} helperText={touched.email ? errors.email : ' '} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder={PHONE_PLACEHOLDER}
                    value={values.phone || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone ? errors.phone : PHONE_HELP_TEXT}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Address" name="address" multiline rows={2} value={values.address || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth select label="Country" name="country" value={values.country || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                        <MenuItem value="">Select</MenuItem>
                        {dropdowns.countries.map((c) => (<MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth select label="City" name="city" value={values.city || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 300 } } } }}>
                        <MenuItem value="">Select</MenuItem>
                        {dropdowns.cities.map((city) => (<MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="TRN Number" name="trn_number" placeholder="Tax Registration" value={values.trn_number || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="VAT Registration Number" name="vat_registration_number" value={values.vat_registration_number || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="License Number" name="license_number" value={values.license_number || ''} onChange={handleChange} onBlur={handleBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                  </Grid>

                  <Stack direction="row" justifyContent="flex-end" mt={3}>
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minWidth: 160, borderRadius: 2, fontWeight: 700, px: 4 }}>
                      {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </form>
          )}
        </Formik>

        {canManageApprovalPin && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <Typography variant="subtitle1" fontWeight={700}>Approval PIN</Typography>
              <Typography variant="body2" color="text.secondary">
                Secret PIN lets sales staff self-approve leads, deals, service quotations, and client purchase quotations. Managers can still approve from the list.
              </Typography>
            </Box>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              {pinError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPinError('')}>{pinError}</Alert>}
              {pinSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{pinSuccess}</Alert>}
              <Typography variant="body2" color="text.secondary" mb={2}>
                {pinConfigured ? 'A PIN is configured. Enter a new PIN below to change it.' : 'No PIN configured yet. Sales users can only request manager approval until you set one.'}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="New PIN"
                    type="password"
                    value={leadApprovalPin}
                    onChange={(e) => setLeadApprovalPin(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Confirm PIN"
                    type="password"
                    value={leadApprovalPinConfirm}
                    onChange={(e) => setLeadApprovalPinConfirm(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  disabled={savingPin}
                  onClick={async () => {
                    setPinError('');
                    setPinSuccess('');
                    if (!leadApprovalPin || leadApprovalPin.length < 4) {
                      setPinError('PIN must be at least 4 characters');
                      return;
                    }
                    if (leadApprovalPin !== leadApprovalPinConfirm) {
                      setPinError('PIN confirmation does not match');
                      return;
                    }
                    try {
                      setSavingPin(true);
                      const res = await apiService.updateLeadApprovalPin(leadApprovalPin);
                      setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
                      setLeadApprovalPin('');
                      setLeadApprovalPinConfirm('');
                      setPinSuccess('Lead approval PIN updated');
                      setTimeout(() => setPinSuccess(''), 3000);
                    } catch (err) {
                      setPinError(err.message || 'Failed to update PIN');
                    } finally {
                      setSavingPin(false);
                    }
                  }}
                  sx={{ minWidth: 160, borderRadius: 2, fontWeight: 700 }}
                >
                  {savingPin ? 'Saving…' : pinConfigured ? 'Change PIN' : 'Set PIN'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default CompanySettings;
