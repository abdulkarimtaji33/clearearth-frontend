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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').nullable(),
  phone: Yup.string().required('Phone is required'),
});

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [newCompanyValues, setNewCompanyValues] = useState({
    companyName: '', email: '', phone: '', country: 'UAE', city: '', address: '', industryType: '', website: '',
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState({});
  const [formikSetFieldValue, setFormikSetFieldValue] = useState(null);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  
  const [dropdowns, setDropdowns] = useState({
    designations: [],
    industryTypes: [],
    cities: [],
    countries: [],
  });

  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    companyId: null,
    phone: '',
    email: '',
    mobile: '',
    jobTitle: '',
    status: 'active',
    contactType: '',
    notes: '',
  });

  const isEdit = Boolean(id);

  const fetchAllCompanies = useCallback(async () => {
    try {
      const response = await apiService.getCompanies({ pageSize: 500 });
      if (response.success) {
        setCompanies(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({
          designations: response.data.designations || [],
          industryTypes: response.data.industry_types || [],
          cities: response.data.uae_cities || [],
          countries: response.data.countries || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllCompanies();
    fetchDropdowns();
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
          designation: c.designation || '',
          department: c.department || '',
          companyId: c.company_id || null,
          phone: c.phone || '',
          email: c.email || '',
          mobile: c.mobile || '',
          jobTitle: c.job_title || '',
          status: c.status || 'active',
          contactType: c.contact_type || '',
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
        const payload = { ...values };
        if (createdCompanyId) {
          payload.setAsPrimaryContact = true;
        }
        await apiService.createContact(payload);
        setSuccess('Contact created successfully!');
      }
      setTimeout(() => navigate('/erp/contacts'), 1000);
    } catch (err) {
      let errorMessage = err.message || 'Failed to save contact';
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
      console.error('Validation Error Details:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const errors = {};
      if (!newCompanyValues.companyName) errors.companyName = 'Required';
      if (newCompanyValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCompanyValues.email)) {
        errors.email = 'Invalid email';
      }
      setNewCompanyErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSavingCompany(true);
      const response = await apiService.createCompany(newCompanyValues);
      if (response.success || response.data) {
        const newCompany = response.data;
        setCompanies((prev) => [...prev, newCompany]);
        setCreatedCompanyId(newCompany.id);
        if (formikSetFieldValue) {
          formikSetFieldValue('companyId', newCompany.id);
        }
        setNewCompanyValues({ companyName: '', email: '', phone: '', country: 'UAE', city: '', address: '', industryType: '', website: '' });
        setAddCompanyDialogOpen(false);
        return newCompany.id;
      }
    } catch (err) {
      setNewCompanyErrors({ submit: err.message || 'Failed to create company' });
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
    <PageContainer
      title={isEdit ? 'Edit Contact' : 'Add Contact'}
      description="Manage contact details"
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/contacts')}
            sx={{ borderRadius: 2 }}
          >
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
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => {
            if (!formikSetFieldValue) setFormikSetFieldValue(() => setFieldValue);
            return (
            <form onSubmit={formikSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Personal Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Basic details about the contact person
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.firstName && Boolean(errors.firstName)}
                        helperText={touched.firstName && errors.firstName}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.lastName && Boolean(errors.lastName)}
                        helperText={touched.lastName && errors.lastName}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        select
                        label="Contact Type"
                        name="contactType"
                        value={values.contactType || ''}
                        onChange={handleChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="clients">Clients</MenuItem>
                        <MenuItem value="vendors">Vendors</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone && errors.phone}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Designation"
                        name="designation"
                        value={values.designation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 350 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {dropdowns.designations.map((d) => (
                          <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>
                        ))}
                      </TextField>
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object' ? opt.company_name || '' : ''
                          }
                          value={companies.find((c) => c.id === values.companyId) || null}
                          onChange={(_, val) => setFieldValue('companyId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company (Optional)"
                              placeholder="Select or search company..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{
                            style: { maxHeight: '300px' }
                          }}
                          sx={{
                            '& .MuiAutocomplete-inputRoot': {
                              minWidth: '300px',
                            }
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 12,
                            backgroundColor: 'background.paper',
                            px: 1,
                            zIndex: 1,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => setAddCompanyDialogOpen(true)}
                            sx={{ 
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              minWidth: 'auto',
                              px: 0.5,
                              py: 0,
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              }
                            }}
                          >
                            + Add New
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Contact Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Phone numbers and email addresses
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 250 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notes"
                        name="notes"
                        placeholder="Add any additional notes or comments..."
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/contacts')}
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
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
                </Button>
              </Stack>
            </form>
            );
          }}
        </Formik>
      </Box>

      {/* Add Company Dialog */}
      <Dialog 
        open={addCompanyDialogOpen} 
        onClose={() => setAddCompanyDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
          <Typography variant="h4" fontWeight={700}>Add New Company</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Create a new company to link with this contact
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {newCompanyErrors.submit && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{newCompanyErrors.submit}</Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={newCompanyValues.companyName}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, companyName: e.target.value }))}
                error={Boolean(newCompanyErrors.companyName)}
                helperText={newCompanyErrors.companyName}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCompanyValues.email}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, email: e.target.value }))}
                error={Boolean(newCompanyErrors.email)}
                helperText={newCompanyErrors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newCompanyValues.phone}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, phone: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Industry Type"
                value={newCompanyValues.industryType}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, industryType: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }
                }}
              >
                <MenuItem value="">None</MenuItem>
                {dropdowns.industryTypes.map((t) => (
                  <MenuItem key={t.id} value={t.value}>{t.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Country"
                value={newCompanyValues.country}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, country: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 250 }
                    }
                  }
                }}
              >
                {dropdowns.countries.map((c) => (
                  <MenuItem key={c.id} value={c.value}>{c.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="City"
                value={newCompanyValues.city}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, city: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }
                }}
              >
                <MenuItem value="">Select City</MenuItem>
                {dropdowns.cities.map((city) => (
                  <MenuItem key={city.id} value={city.value}>{city.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Details"
                value={newCompanyValues.address}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, address: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                placeholder="https://example.com"
                value={newCompanyValues.website}
                onChange={(e) => setNewCompanyValues((v) => ({ ...v, website: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
          <Button 
            onClick={() => { setAddCompanyDialogOpen(false); setNewCompanyErrors({}); }}
            size="large"
            sx={{ minWidth: '120px', borderRadius: 2, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCompany} 
            disabled={savingCompany}
            size="large"
            sx={{ minWidth: '160px', borderRadius: 2, fontWeight: 600 }}
          >
            {savingCompany ? 'Creating...' : 'Create Company'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ContactForm;
