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
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash, IconUserPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const INDUSTRY_TYPES = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance',
  'Construction', 'Education', 'Transportation & Logistics', 'Energy',
  'Real Estate', 'Hospitality', 'Agriculture', 'Environmental Services', 'Other',
];

const CONTACT_ROLES = ['Sales', 'Finance', 'HR', 'Operations', 'Technical', 'Management', 'Other'];

const validationSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  email: Yup.string().email('Invalid email').nullable(),
});

const SupplierForm = () => {
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
    firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '',
  });
  const [newContactErrors, setNewContactErrors] = useState({});

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

  useEffect(() => {
    fetchAllContacts();
    if (isEdit) fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupplier(id);
      if (response.success) {
        const s = response.data;
        setInitialValues({
          companyName: s.company_name || '',
          primaryContactId: s.primary_contact_id || null,
          industryType: s.industry_type || '',
          website: s.website || '',
          email: s.email || '',
          phone: s.phone || '',
          country: s.country || 'UAE',
          city: s.city || '',
          address: s.address || '',
          status: s.status || 'active',
          notes: s.notes || '',
        });
        setLinkedContacts(
          (s.contacts || []).map((ct) => ({
            contactId: ct.id,
            firstName: ct.first_name,
            lastName: ct.last_name,
            email: ct.email,
            phone: ct.phone,
            role: ct.SupplierContact?.role || '',
            isPrimary: ct.SupplierContact?.is_primary || false,
          }))
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load supplier');
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
        await apiService.updateSupplier(id, payload);
        setSuccess('Supplier updated successfully!');
      } else {
        await apiService.createSupplier(payload);
        setSuccess('Supplier created successfully!');
      }
      setTimeout(() => navigate('/erp/suppliers'), 1000);
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExistingContact = () => {
    if (!selectedContactToAdd) return;
    const already = linkedContacts.find((c) => c.contactId === selectedContactToAdd.id);
    if (already) {
      setError('This contact is already linked to this supplier.');
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
        setLinkedContacts((prev) => [
          ...prev,
          {
            contactId: newContact.id,
            firstName: newContact.first_name,
            lastName: newContact.last_name,
            email: newContact.email,
            phone: newContact.phone,
            role: contactRole,
            isPrimary: false,
          },
        ]);
        setNewContactValues({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '' });
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
      <PageContainer title={isEdit ? 'Edit Supplier' : 'Add Supplier'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Supplier' : 'Add Supplier'} description="Manage supplier details">
      <Box>
        <Box display="flex" alignItems="center" mb={3} gap={2}>
          <Button variant="outlined" startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/suppliers')}>
            Back
          </Button>
          <Typography variant="h4" fontWeight="600">
            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => (
            <form onSubmit={formikSubmit}>
              {/* Supplier Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>Supplier Information</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company Name *"
                        name="companyName"
                        value={values.companyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.companyName && Boolean(errors.companyName)}
                        helperText={touched.companyName && errors.companyName}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
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
                            label="Primary Contact Person"
                            placeholder="Select or search contact..."
                          />
                        )}
                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Industry Type"
                        name="industryType"
                        value={values.industryType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value="">None</MenuItem>
                        {INDUSTRY_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        placeholder="https://example.com"
                        value={values.website}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
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
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
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
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>Location Details</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Country"
                        name="country"
                        value={values.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Additional Contacts */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>Supplier Contacts</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Add multiple contacts per department (Sales, Finance, HR, etc.)
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<IconUserPlus />}
                      onClick={() => setAddContactDialogOpen(true)}
                    >
                      Add Contact
                    </Button>
                  </Box>

                  {linkedContacts.length === 0 ? (
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      <Typography variant="body2">
                        No contacts added yet. Click "Add Contact" to link contacts to this supplier.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Role / Department</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Remove</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {linkedContacts.map((c) => (
                            <TableRow key={c.contactId}>
                              <TableCell>
                                {c.firstName} {c.lastName}
                              </TableCell>
                              <TableCell>{c.email || '-'}</TableCell>
                              <TableCell>{c.phone || '-'}</TableCell>
                              <TableCell>
                                <TextField
                                  select
                                  size="small"
                                  value={c.role || ''}
                                  onChange={(e) => handleLinkedContactRoleChange(c.contactId, e.target.value)}
                                  sx={{ minWidth: 140 }}
                                >
                                  <MenuItem value="">No role</MenuItem>
                                  {CONTACT_ROLES.map((r) => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                  ))}
                                </TextField>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveLinkedContact(c.contactId)}
                                >
                                  <IconTrash size={16} />
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

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" size="large" onClick={() => navigate('/erp/suppliers')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>

      {/* Add Contact Dialog */}
      <Dialog open={addContactDialogOpen} onClose={() => setAddContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contact to Supplier</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
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
                  <TextField {...params} label="Select Contact" placeholder="Search contacts..." autoFocus />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role / Department"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              >
                <MenuItem value="">No role</MenuItem>
                {CONTACT_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconPlus />}
                onClick={() => {
                  setAddContactDialogOpen(false);
                  setNewContactDialogOpen(true);
                }}
              >
                + Add New Contact (not in list)
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddContactDialogOpen(false); setSelectedContactToAdd(null); setContactRole(''); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddExistingContact}
            disabled={!selectedContactToAdd}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Contact Creation Dialog */}
      <Dialog open={newContactDialogOpen} onClose={() => setNewContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Contact</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {newContactErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>{newContactErrors.submit}</Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name *"
                value={newContactValues.firstName}
                onChange={(e) => setNewContactValues((v) => ({ ...v, firstName: e.target.value }))}
                error={Boolean(newContactErrors.firstName)}
                helperText={newContactErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name *"
                value={newContactValues.lastName}
                onChange={(e) => setNewContactValues((v) => ({ ...v, lastName: e.target.value }))}
                error={Boolean(newContactErrors.lastName)}
                helperText={newContactErrors.lastName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContactValues.email}
                onChange={(e) => setNewContactValues((v) => ({ ...v, email: e.target.value }))}
                error={Boolean(newContactErrors.email)}
                helperText={newContactErrors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newContactValues.phone}
                onChange={(e) => setNewContactValues((v) => ({ ...v, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={newContactValues.jobTitle}
                onChange={(e) => setNewContactValues((v) => ({ ...v, jobTitle: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role / Department"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              >
                <MenuItem value="">No role</MenuItem>
                {CONTACT_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setNewContactDialogOpen(false); setNewContactErrors({}); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateAndAddContact} disabled={savingContact}>
            {savingContact ? 'Creating...' : 'Create & Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SupplierForm;
