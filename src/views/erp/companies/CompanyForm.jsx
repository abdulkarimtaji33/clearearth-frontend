import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash, IconUserPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

// Clients: Name, Primary Contact, Country, City, Address, Email (required), Website (optional)
const validationSchema = Yup.object({
  companyName: Yup.string().trim().required('Company name is required'),
  primaryContactId: Yup.number().nullable().required('Primary contact is required'),
  country: Yup.string().trim().required('Country is required'),
  city: Yup.string().trim().required('City is required'),
  address: Yup.string().trim().required('Address is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  website: Yup.string().url('Invalid URL').nullable().transform((v) => v || null),
});

const contactValidationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').nullable(),
});

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contacts, setContacts] = useState([]);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [selectedContactToAdd, setSelectedContactToAdd] = useState(null);
  const [contactRole, setContactRole] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [newContactValues, setNewContactValues] = useState({
    firstName: '', lastName: '', email: '', phone: '', designation: '', department: '',
  });
  const [newContactErrors, setNewContactErrors] = useState({});
  const setFieldValueRef = useRef(null);
  
  // Dropdown states
  const [dropdowns, setDropdowns] = useState({
    designations: [],
    industryTypes: [],
    cities: [],
    countries: [],
    contactRoles: [],
  });

  const [initialValues, setInitialValues] = useState({
    companyName: '',
    primaryContactId: null,
    industryType: '',
    website: '',
    email: '',
    phone: '',
    country: 'UAE',
    city: '',
    address: '',
    status: 'active',
    notes: '',
  });

  const isEdit = Boolean(id);

  const fetchAllContacts = useCallback(async () => {
    try {
      const response = await apiService.getContacts({ pageSize: 500 });
      if (response.success) {
        setContacts(Array.isArray(response.data) ? response.data : []);
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
          contactRoles: response.data.contact_roles || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllContacts();
    fetchDropdowns();
    if (isEdit) fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompany(id);
      if (response.success) {
        const c = response.data;
        setInitialValues({
          companyName: c.company_name || '',
          primaryContactId: c.primary_contact_id || null,
          industryType: c.industry_type || '',
          website: c.website || '',
          email: c.email || '',
          phone: c.phone || '',
          country: c.country || 'UAE',
          city: c.city || '',
          address: c.address || '',
          status: c.status || 'active',
          notes: c.notes || '',
        });
        setLinkedContacts(
          (c.contacts || []).map((ct) => ({
            contactId: ct.id,
            firstName: ct.first_name,
            lastName: ct.last_name,
            email: ct.email,
            phone: ct.phone,
            role: ct.CompanyContact?.role || '',
            isPrimary: ct.CompanyContact?.is_primary || false,
          }))
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      const payload = {
        ...values,
        primaryContactId: values.primaryContactId || null,
        contacts: linkedContacts.map((c) => ({
          contactId: c.contactId,
          role: c.role,
          isPrimary: c.isPrimary,
        })),
      };

      if (isEdit) {
        await apiService.updateCompany(id, payload);
        setSuccess('Company updated successfully!');
      } else {
        await apiService.createCompany(payload);
        setSuccess('Company created successfully!');
      }
      setTimeout(() => navigate('/erp/companies'), 1000);
    } catch (err) {
      // Display detailed validation errors
      let errorMessage = err.message || 'Failed to save company';
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

  const handleAddExistingContact = () => {
    if (!selectedContactToAdd) return;
    const already = linkedContacts.find((c) => c.contactId === selectedContactToAdd.id);
    if (already) {
      setError('This contact is already linked to this company.');
      setAddContactDialogOpen(false);
      return;
    }
    setLinkedContacts((prev) => [
      ...prev,
      {
        contactId: selectedContactToAdd.id,
        firstName: selectedContactToAdd.first_name,
        lastName: selectedContactToAdd.last_name,
        email: selectedContactToAdd.email,
        phone: selectedContactToAdd.phone,
        role: contactRole,
        isPrimary: false,
      },
    ]);
    setSelectedContactToAdd(null);
    setContactRole('');
    setAddContactDialogOpen(false);
  };

  const handleCreateAndAddContact = async () => {
    try {
      const errors = {};
      if (!newContactValues.firstName) errors.firstName = 'Required';
      if (!newContactValues.lastName) errors.lastName = 'Required';
      if (newContactValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactValues.email)) {
        errors.email = 'Invalid email';
      }
      setNewContactErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSavingContact(true);
      const response = await apiService.createContact(newContactValues);
      if (response.success || response.data) {
        const newContact = response.data;
        setContacts((prev) => [...prev, newContact]);
        const newLinked = {
          contactId: newContact.id,
          firstName: newContact.first_name,
          lastName: newContact.last_name,
          email: newContact.email,
          phone: newContact.phone,
          role: contactRole,
          isPrimary: true,
        };
        setLinkedContacts((prev) => [...prev.map((c) => ({ ...c, isPrimary: false })), newLinked]);
        setFieldValueRef.current?.('primaryContactId', newContact.id);
        setNewContactValues({ firstName: '', lastName: '', email: '', phone: '', designation: '', department: '' });
        setContactRole('');
        setNewContactDialogOpen(false);
        setAddContactDialogOpen(false);
      }
    } catch (err) {
      setNewContactErrors({ submit: err.message || 'Failed to create contact' });
    } finally {
      setSavingContact(false);
    }
  };

  const handleRemoveLinkedContact = (contactId) => {
    setLinkedContacts((prev) => prev.filter((c) => c.contactId !== contactId));
  };

  const handleLinkedContactRoleChange = (contactId, role) => {
    setLinkedContacts((prev) =>
      prev.map((c) => (c.contactId === contactId ? { ...c, role } : c))
    );
  };

  if (loading && isEdit) {
    return (
      <PageContainer title={isEdit ? 'Edit Company' : 'Add Company'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Company' : 'Add Company'} description="Manage company details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/companies')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Company' : 'Add New Company'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update company information' : 'Create a new company in the system'}
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
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => {
            setFieldValueRef.current = setFieldValue;
            return (
            <form onSubmit={formikSubmit}>
              {/* Company Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Company Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Basic company details and contact information
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        name="companyName"
                        placeholder="Required"
                        value={values.companyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.companyName && Boolean(errors.companyName)}
                        helperText={touched.companyName ? errors.companyName : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="Required"
                        value={values.email || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email ? errors.email : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box position="relative">
                        <Autocomplete
                          fullWidth
                          options={contacts}
                          getOptionLabel={(opt) =>
                            typeof opt === 'object'
                              ? `${opt.first_name} ${opt.last_name}${opt.email ? ` (${opt.email})` : ''}`
                              : ''
                          }
                          value={contacts.find((c) => c.id === values.primaryContactId) || null}
                          onChange={(_, val) => setFieldValue('primaryContactId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Primary Contact"
                              placeholder="Required - Select or search contact..."
                              error={touched.primaryContactId && Boolean(errors.primaryContactId)}
                              helperText={touched.primaryContactId ? errors.primaryContactId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{
                            style: { maxHeight: '300px' }
                          }}
                          sx={{
                            '& .MuiAutocomplete-inputRoot': {
                              minWidth: '280px',
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
                            onClick={() => setNewContactDialogOpen(true)}
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Country"
                        name="country"
                        value={values.country || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.country && Boolean(errors.country)}
                        helperText={touched.country ? errors.country : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 350 }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">Select Country</MenuItem>
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
                        name="city"
                        value={values.city || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.city && Boolean(errors.city)}
                        helperText={touched.city ? errors.city : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              style: { maxHeight: 350 }
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        placeholder="Required"
                        value={values.address || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.address && Boolean(errors.address)}
                        helperText={touched.address ? errors.address : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        placeholder="Optional - https://example.com"
                        value={values.website || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.website && Boolean(errors.website)}
                        helperText={touched.website ? errors.website : ' '}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Additional Contacts */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        Company Contacts
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Add multiple contacts per department (Sales, Finance, HR, etc.)
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<IconUserPlus size={20} />}
                      onClick={() => setAddContactDialogOpen(true)}
                      sx={{ minWidth: '160px', borderRadius: 2, fontWeight: 600 }}
                    >
                      Add Contact
                    </Button>
                  </Stack>

                  {linkedContacts.length === 0 ? (
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 6,
                        textAlign: 'center',
                        color: 'text.secondary',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <Typography variant="body1" fontWeight={500}>
                        No contacts added yet
                      </Typography>
                      <Typography variant="body2" mt={1}>
                        Click "Add Contact" to link contacts to this company
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem', py: 2 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem', py: 2 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem', py: 2 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem', py: 2, minWidth: 220 }}>Role / Department</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9375rem', py: 2, width: 100 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {linkedContacts.map((c, index) => (
                            <TableRow key={c.contactId} hover>
                              <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {c.firstName} {c.lastName}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {c.email || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {c.phone || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <TextField
                                  select
                                  size="small"
                                  value={c.role || ''}
                                  onChange={(e) => handleLinkedContactRoleChange(c.contactId, e.target.value)}
                                  fullWidth
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                  SelectProps={{
                                    MenuProps: {
                                      PaperProps: {
                                        style: { maxHeight: 250 }
                                      }
                                    }
                                  }}
                                >
                                  <MenuItem value="">No role</MenuItem>
                                  {dropdowns.contactRoles.map((r) => (
                                    <MenuItem key={r.id} value={r.value}>{r.display_name}</MenuItem>
                                  ))}
                                </TextField>
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveLinkedContact(c.contactId)}
                                  sx={{ '&:hover': { backgroundColor: 'error.lighter' } }}
                                >
                                  <IconTrash size={18} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={() => navigate('/erp/companies')}
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
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Company' : 'Create Company'}
                </Button>
              </Stack>
            </form>
          );}}
        </Formik>
      </Box>

      {/* Add Contact Dialog */}
      <Dialog 
        open={addContactDialogOpen} 
        onClose={() => setAddContactDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
          <Typography variant="h4" fontWeight={700}>Add Contact to Company</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Select an existing contact or create a new one
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={contacts}
                getOptionLabel={(opt) =>
                  typeof opt === 'object'
                    ? `${opt.first_name} ${opt.last_name}${opt.email ? ` – ${opt.email}` : ''}`
                    : ''
                }
                value={selectedContactToAdd}
                onChange={(_, val) => setSelectedContactToAdd(val)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Contact" 
                    placeholder="Search contacts..." 
                    autoFocus 
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                ListboxProps={{ style: { maxHeight: 300 } }}
                sx={{
                  '& .MuiAutocomplete-inputRoot': {
                    minWidth: '300px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role / Department"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }
                }}
              >
                <MenuItem value="">No role</MenuItem>
                {dropdowns.contactRoles.map((r) => (
                  <MenuItem key={r.id} value={r.value}>{r.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  setAddContactDialogOpen(false);
                  setNewContactDialogOpen(true);
                }}
                size="large"
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                + Add New Contact (not in list)
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
          <Button 
            onClick={() => { setAddContactDialogOpen(false); setSelectedContactToAdd(null); setContactRole(''); }}
            size="large"
            sx={{ minWidth: '120px', borderRadius: 2, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddExistingContact}
            disabled={!selectedContactToAdd}
            size="large"
            sx={{ minWidth: '150px', borderRadius: 2, fontWeight: 600 }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Contact Creation Dialog */}
      <Dialog 
        open={newContactDialogOpen} 
        onClose={() => setNewContactDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
          <Typography variant="h4" fontWeight={700}>Create New Contact</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Add a new contact and link to this company
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {newContactErrors.submit && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{newContactErrors.submit}</Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newContactValues.firstName}
                onChange={(e) => setNewContactValues((v) => ({ ...v, firstName: e.target.value }))}
                error={Boolean(newContactErrors.firstName)}
                helperText={newContactErrors.firstName}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newContactValues.lastName}
                onChange={(e) => setNewContactValues((v) => ({ ...v, lastName: e.target.value }))}
                error={Boolean(newContactErrors.lastName)}
                helperText={newContactErrors.lastName}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContactValues.email}
                onChange={(e) => setNewContactValues((v) => ({ ...v, email: e.target.value }))}
                error={Boolean(newContactErrors.email)}
                helperText={newContactErrors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newContactValues.phone}
                onChange={(e) => setNewContactValues((v) => ({ ...v, phone: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Designation"
                value={newContactValues.designation}
                onChange={(e) => setNewContactValues((v) => ({ ...v, designation: e.target.value }))}
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
                {dropdowns.designations.map((d) => (
                  <MenuItem key={d.id} value={d.value}>{d.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                placeholder="e.g. Sales, Finance"
                value={newContactValues.department}
                onChange={(e) => setNewContactValues((v) => ({ ...v, department: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role / Department for this Company"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }
                }}
              >
                <MenuItem value="">No role</MenuItem>
                {dropdowns.contactRoles.map((r) => (
                  <MenuItem key={r.id} value={r.value}>{r.display_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
          <Button 
            onClick={() => { setNewContactDialogOpen(false); setNewContactErrors({}); }}
            size="large"
            sx={{ minWidth: '120px', borderRadius: 2, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateAndAddContact} 
            disabled={savingContact}
            size="large"
            sx={{ minWidth: '160px', borderRadius: 2, fontWeight: 600 }}
          >
            {savingContact ? 'Creating...' : 'Create & Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default CompanyForm;
