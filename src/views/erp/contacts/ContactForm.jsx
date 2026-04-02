import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField,
  MenuItem, Alert, CircularProgress, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, IconButton, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconX, IconBuilding } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  contactType: Yup.string().oneOf(['clients', 'vendors']).required('Contact type is required'),
  lastName: Yup.string().trim().nullable().transform(v => v || ''),
  phone: Yup.string().trim().required('Phone is required'),
  email: Yup.string().email('Invalid email').nullable().transform(v => v || null),
});

const tfSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [newCompanyValues, setNewCompanyValues] = useState({
    addAs: 'client', companyName: '', type: 'organization', email: '', phone: '',
    country: 'UAE', city: '', address: '', industryType: '', website: '', vatNumber: '',
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState({});
  const [formikSetFieldValue, setFormikSetFieldValue] = useState(null);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  const [createdSupplierId, setCreatedSupplierId] = useState(null);
  const [dropdowns, setDropdowns] = useState({ designations: [], industryTypes: [], cities: [], countries: [] });

  const [initialValues, setInitialValues] = useState({
    firstName: '', lastName: '', designation: '',
    companyId: null, supplierId: null, phone: '', email: '',
    status: 'active', contactType: '',
  });

  const isEdit = Boolean(id);

  const fetchAllCompanies = useCallback(async () => {
    try {
      const r = await apiService.getCompanies({ pageSize: 500 });
      if (r.success) setCompanies(Array.isArray(r.data) ? r.data : []);
    } catch { /* silent */ }
  }, []);

  const fetchAllSuppliers = useCallback(async () => {
    try {
      const r = await apiService.getSuppliers({ pageSize: 500 });
      if (r.success) setSuppliers(Array.isArray(r.data) ? r.data : []);
    } catch { /* silent */ }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const r = await apiService.getAllDropdowns();
      if (r.success) setDropdowns({
        designations: r.data.designations || [],
        industryTypes: r.data.industry_types || [],
        cities: r.data.uae_cities || [],
        countries: r.data.countries || [],
      });
    } catch (err) { console.error(err); }
  }, []);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const r = await apiService.getContact(id);
      if (r.success) {
        const c = r.data;
        setInitialValues({
          firstName: c.first_name || '', lastName: c.last_name || '',
          designation: c.designation || '',
          companyId: c.company_id || null, supplierId: c.supplier_id || null,
          phone: c.phone || '', email: c.email || '',
          status: c.status || 'active',
          contactType: c.contact_type || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompanies();
    fetchAllSuppliers();
    fetchDropdowns();
    if (isEdit) fetchContact();
  }, [id]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      if (isEdit) {
        await apiService.updateContact(id, values);
        setSuccess('Contact updated successfully!');
      } else {
        const payload = { ...values };
        if (createdCompanyId || createdSupplierId) payload.setAsPrimaryContact = true;
        await apiService.createContact(payload);
        setSuccess('Contact created successfully!');
      }
      setTimeout(() => navigate('/erp/contacts'), 1000);
    } catch (err) {
      let msg = err.message || 'Failed to save contact';
      if (err.errors) {
        if (typeof err.errors === 'string') msg = err.errors;
        else if (Array.isArray(err.errors)) msg = err.errors.map(e => e.msg || e.message || e).join(', ');
        else if (typeof err.errors === 'object') msg = Object.values(err.errors).join(', ');
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompany = async () => {
    const errs = {};
    if (!newCompanyValues.companyName?.trim()) errs.companyName = 'Required';
    if (!newCompanyValues.phone?.trim()) errs.phone = 'Required';
    if (!newCompanyValues.country?.trim()) errs.country = 'Required';
    if (!newCompanyValues.city?.trim()) errs.city = 'Required';
    if (!newCompanyValues.address?.trim()) errs.address = 'Required';
    if (newCompanyValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCompanyValues.email)) errs.email = 'Invalid email';
    setNewCompanyErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSavingCompany(true);
      const isVendor = newCompanyValues.addAs === 'vendor';
      if (isVendor) {
        const r = await apiService.createSupplier(newCompanyValues);
        if (r.success || r.data) {
          const c = r.data;
          setSuppliers(p => [...p, c]);
          setCreatedSupplierId(c.id);
          if (formikSetFieldValue) { formikSetFieldValue('supplierId', c.id); formikSetFieldValue('companyId', null); }
        }
      } else {
        const r = await apiService.createCompany(newCompanyValues);
        if (r.success || r.data) {
          const c = r.data;
          setCompanies(p => [...p, c]);
          setCreatedCompanyId(c.id);
          if (formikSetFieldValue) { formikSetFieldValue('companyId', c.id); formikSetFieldValue('supplierId', null); }
        }
      }
      setNewCompanyValues({ addAs: 'client', companyName: '', type: 'organization', email: '', phone: '', country: 'UAE', city: '', address: '', industryType: '', website: '', vatNumber: '' });
      setAddCompanyDialogOpen(false);
    } catch (err) {
      setNewCompanyErrors({ submit: err.message || 'Failed to create' });
    } finally {
      setSavingCompany(false);
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
    <PageContainer title={isEdit ? 'Edit Contact' : 'Add Contact'} description="Manage contact details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={20} />} onClick={() => navigate('/erp/contacts')} sx={{ borderRadius: 2 }}>
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Contact' : 'Add New Contact'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update contact information' : 'Create a new contact in the system'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => {
            if (!formikSetFieldValue) setFormikSetFieldValue(() => setFieldValue);

            const combinedOptions = [
              ...(companies || []).map(c => ({ ...c, _type: 'company' })),
              ...(suppliers || []).map(s => ({ ...s, _type: 'supplier' })),
            ].sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));

            const selectedOrg = combinedOptions.find(
              o => (o._type === 'company' && o.id === values.companyId) || (o._type === 'supplier' && o.id === values.supplierId)
            ) || null;

            return (
              <form onSubmit={formikSubmit}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                      Contact Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={4}>
                      Name, type, contact details, role, and linked company or supplier
                    </Typography>
                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth required label="First Name" name="firstName"
                          value={values.firstName} onChange={handleChange} onBlur={handleBlur}
                          error={touched.firstName && Boolean(errors.firstName)}
                          helperText={touched.firstName ? errors.firstName : ' '}
                          sx={tfSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth label="Last Name" name="lastName"
                          value={values.lastName || ''} onChange={handleChange}
                          helperText=" "
                          sx={tfSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth select required label="Contact Type" name="contactType"
                          value={values.contactType || ''}
                          onChange={e => {
                            const v = e.target.value;
                            setFieldValue('contactType', v);
                            if (v === 'clients') setFieldValue('supplierId', null);
                            else if (v === 'vendors') setFieldValue('companyId', null);
                          }}
                          onBlur={handleBlur}
                          error={touched.contactType && Boolean(errors.contactType)}
                          helperText={touched.contactType ? errors.contactType : ' '}
                          sx={tfSx}
                          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}
                        >
                          <MenuItem value="">Select type</MenuItem>
                          <MenuItem value="clients">Client</MenuItem>
                          <MenuItem value="vendors">Vendor</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth required label="Phone" name="phone"
                          value={values.phone} onChange={handleChange} onBlur={handleBlur}
                          error={touched.phone && Boolean(errors.phone)}
                          helperText={touched.phone ? errors.phone : ' '}
                          sx={tfSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box position="relative" sx={{ width: '100%' }}>
                          <Autocomplete
                            fullWidth
                            options={combinedOptions}
                            getOptionLabel={o => (typeof o === 'object' ? o.company_name || '' : '')}
                            groupBy={o => (o._type === 'company' ? 'Clients' : 'Vendors')}
                            value={selectedOrg}
                            onChange={(_, val) => {
                              if (!val) { setFieldValue('companyId', null); setFieldValue('supplierId', null); }
                              else if (val._type === 'company') { setFieldValue('companyId', val.id); setFieldValue('supplierId', null); }
                              else { setFieldValue('supplierId', val.id); setFieldValue('companyId', null); }
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Company / Supplier"
                                placeholder="Search or select…"
                                sx={tfSx}
                              />
                            )}
                            isOptionEqualToValue={(o, v) => o?.id === v?.id && o?._type === v?._type}
                            ListboxProps={{ style: { maxHeight: 300 } }}
                          />
                          <Box sx={{ position: 'absolute', top: -8, right: 12, bgcolor: 'background.paper', px: 1, zIndex: 1 }}>
                            <Button
                              size="small"
                              onClick={() => {
                                if (values.contactType === 'vendors') setNewCompanyValues(v => ({ ...v, addAs: 'vendor' }));
                                setAddCompanyDialogOpen(true);
                              }}
                              sx={{
                                textTransform: 'none', fontSize: '0.75rem', fontWeight: 500, minWidth: 'auto', px: 0.5, py: 0,
                                color: 'primary.main', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                              }}
                            >
                              + Add New
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth label="Email" name="email" type="email"
                          value={values.email || ''} onChange={handleChange} onBlur={handleBlur}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email ? errors.email : ' '}
                          sx={tfSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth select label="Designation" name="designation"
                          value={values.designation || ''} onChange={handleChange}
                          helperText=" "
                          sx={tfSx}
                          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}
                        >
                          <MenuItem value="">None</MenuItem>
                          {dropdowns.designations.map(d => (
                            <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth select label="Status" name="status"
                          value={values.status} onChange={handleChange}
                          helperText=" "
                          sx={tfSx}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                  <Button variant="outlined" size="large" onClick={() => navigate('/erp/contacts')} sx={{ minWidth: 140, borderRadius: 2, fontWeight: 600 }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minWidth: 180, borderRadius: 2, fontWeight: 600 }}>
                    {isSubmitting ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
                  </Button>
                </Stack>
              </form>
            );
          }}
        </Formik>
      </Box>

      <Dialog open={addCompanyDialogOpen} onClose={() => setAddCompanyDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 2, pt: 4, px: 4, position: 'relative', pr: 6 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBuilding size={18} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>Add New Company</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Creates a client company or vendor and links this contact
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setAddCompanyDialogOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}>
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {newCompanyErrors.submit && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{newCompanyErrors.submit}</Alert>}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Add as" value={newCompanyValues.addAs || 'client'} onChange={e => setNewCompanyValues(v => ({ ...v, addAs: e.target.value }))} sx={tfSx}>
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required label="Company Name" value={newCompanyValues.companyName} onChange={e => setNewCompanyValues(v => ({ ...v, companyName: e.target.value }))} error={Boolean(newCompanyErrors.companyName)} helperText={newCompanyErrors.companyName || ' '} sx={tfSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required label="Phone" value={newCompanyValues.phone} onChange={e => setNewCompanyValues(v => ({ ...v, phone: e.target.value }))} error={Boolean(newCompanyErrors.phone)} helperText={newCompanyErrors.phone || ' '} sx={tfSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Email" type="email" value={newCompanyValues.email} onChange={e => setNewCompanyValues(v => ({ ...v, email: e.target.value }))} error={Boolean(newCompanyErrors.email)} helperText={newCompanyErrors.email || ' '} sx={tfSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Country" value={newCompanyValues.country} onChange={e => setNewCompanyValues(v => ({ ...v, country: e.target.value }))} sx={tfSx} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}>
                {dropdowns.countries.map(c => <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select required label="City" value={newCompanyValues.city} onChange={e => setNewCompanyValues(v => ({ ...v, city: e.target.value }))} error={Boolean(newCompanyErrors.city)} helperText={newCompanyErrors.city || ' '} sx={tfSx} SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}>
                <MenuItem value="">Select city</MenuItem>
                {dropdowns.cities.map(c => <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth required label="Address" value={newCompanyValues.address} onChange={e => setNewCompanyValues(v => ({ ...v, address: e.target.value }))} error={Boolean(newCompanyErrors.address)} helperText={newCompanyErrors.address || ' '} sx={tfSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => { setAddCompanyDialogOpen(false); setNewCompanyErrors({}); }} size="large" sx={{ minWidth: 120, borderRadius: 2, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateCompany} disabled={savingCompany} size="large" sx={{ minWidth: 140, borderRadius: 2, fontWeight: 600 }}>
            {savingCompany ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ContactForm;
