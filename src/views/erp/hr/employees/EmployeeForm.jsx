import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, Alert, CircularProgress,
  Stack, Grid, Tabs, Tab, Divider, Checkbox, FormControlLabel,
  Autocomplete, RadioGroup, Radio, FormLabel, Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  IconArrowLeft, IconUser, IconMapPin, IconBriefcase, IconCash, IconBuildingBank,
  IconUpload, IconNotes, IconUserPlus, IconId,
} from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '',
  managerId: '', employmentType: 'full_time', dateOfJoining: '', gender: '', dateOfBirth: '',
  nationality: '', nationalId: '', passportNumber: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', bankName: '', bankAccountNumber: '', bankIban: '', notes: '',
  profilePhoto: '',
  passportIssueDate: '', passportExpiryDate: '', emiratesIdNumber: '', emiratesIdIssueDate: '', emiratesIdExpiryDate: '', visaNumber: '', visaIssueDate: '', visaExpiryDate: '', labourCardNo: '', labourCardIssueDate: '', labourCardExpiryDate: '',
};

const textFieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <Box mb={3}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {Icon && (
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main',
          }}
        >
          <Icon size={22} />
        </Box>
      )}
      <Box minWidth={0}>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    <Divider sx={{ mt: 2.5 }} />
  </Box>
);

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [salary, setSalary] = useState({ basicSalary: '', housingAllowance: '', transportAllowance: '', otherAllowance: '', commissionEligible: false, paymentMethod: 'bank_transfer', effectiveFrom: new Date().toISOString().slice(0, 10) });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');

  // Login mode for a NEW employee: 'none' (no login), 'new' (create a fresh login account),
  // 'existing' (link this employee record to an already-existing user login).
  const [loginMode, setLoginMode] = useState('none');
  const [loginRoleId, setLoginRoleId] = useState('');
  const [roles, setRoles] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState(null);

  const load = useCallback(async () => {
    try {
      const [deptRes, desigRes, empRes, rolesRes, usersRes] = await Promise.all([
        apiService.getHrDepartments({ pageSize: 200 }),
        apiService.getEmployeeDesignations(),
        apiService.getHrEmployees({ pageSize: 200 }),
        apiService.getRoles({ pageSize: 200 }),
        isEdit ? Promise.resolve(null) : apiService.getUsers({ pageSize: 200, unlinked: true }),
      ]);
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (desigRes.success) setDesignations(desigRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
      if (rolesRes.success) setRoles(rolesRes.data || []);
      if (usersRes && usersRes.success) setUnlinkedUsers(usersRes.data || []);

      if (isEdit) {
        const res = await apiService.getHrEmployee(id);
        if (res.success) {
          const e = res.data;
          setForm({
            firstName: e.first_name || '', lastName: e.last_name || '', email: e.email || '', phone: e.phone || '',
            departmentId: e.department_id || '', designationId: e.designation_id || '', managerId: e.manager_id || '',
            employmentType: e.employment_type || 'full_time', dateOfJoining: e.date_of_joining || '',
            gender: e.gender || '', dateOfBirth: e.date_of_birth || '', nationality: e.nationality || '',
            nationalId: e.national_id || '', passportNumber: e.passport_number || '', address: e.address || '',
            emergencyContactName: e.emergency_contact_name || '', emergencyContactPhone: e.emergency_contact_phone || '',
            bankName: e.bank_name || '', bankAccountNumber: e.bank_account_number || '', bankIban: e.bank_iban || '', notes: e.notes || '',
            profilePhoto: e.profile_photo || '',
            passportIssueDate: e.passport_issue_date || '', passportExpiryDate: e.passport_expiry_date || '',
            emiratesIdNumber: e.emirates_id_number || '', emiratesIdIssueDate: e.emirates_id_issue_date || '', emiratesIdExpiryDate: e.emirates_id_expiry_date || '',
            visaNumber: e.visa_number || '', visaIssueDate: e.visa_issue_date || '', visaExpiryDate: e.visa_expiry_date || '',
            labourCardNo: e.labour_card_no || '', labourCardIssueDate: e.labour_card_issue_date || '', labourCardExpiryDate: e.labour_card_expiry_date || '',
          });
          if (e.profile_photo) setPhotoPreviewUrl(apiService.getUploadUrl(e.profile_photo));
        }
        const salRes = await apiService.getHrSalaryStructureHistory(id);
        if (salRes.success && salRes.data?.length) {
          const active = salRes.data.find((s) => s.is_active) || salRes.data[0];
          setSalary({
            basicSalary: active.basic_salary, housingAllowance: active.housing_allowance, transportAllowance: active.transport_allowance,
            otherAllowance: active.other_allowance, commissionEligible: !!active.commission_eligible, paymentMethod: active.payment_method,
            effectiveFrom: active.effective_from,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      setError('');
      const res = await apiService.uploadHrEmployeePhoto(id, file);
      if (res.success && res.data?.path) {
        setForm((f) => ({ ...f, profilePhoto: res.data.path }));
        setPhotoPreviewUrl(res.data.url || apiService.getUploadUrl(res.data.path));
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let employeeId = id;
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });

      if (isEdit) {
        await apiService.updateHrEmployee(id, payload);
      } else {
        if (loginMode === 'new') {
          if (!payload.email || !loginRoleId) {
            throw new Error('Email and role are required to create a login account');
          }
          payload.createLoginAccount = true;
          payload.roleId = loginRoleId;
        } else if (loginMode === 'existing') {
          if (!selectedExistingUser) {
            throw new Error('Select a user to link to this employee');
          }
          payload.existingUserId = selectedExistingUser.id;
        }
        const res = await apiService.createHrEmployee(payload);
        employeeId = res.data?.id;
      }

      if (employeeId && salary.basicSalary) {
        await apiService.setHrSalaryStructure(employeeId, {
          basicSalary: parseFloat(salary.basicSalary),
          housingAllowance: parseFloat(salary.housingAllowance) || 0,
          // Transport Allowance has no input in this form (relabeled field set is
          // Basic/Housing/Supplement/Total) — any legacy value is intentionally not
          // carried forward; a saved-here structure always has transportAllowance = 0.
          transportAllowance: 0,
          otherAllowance: parseFloat(salary.otherAllowance) || 0,
          commissionEligible: salary.commissionEligible,
          paymentMethod: salary.paymentMethod,
          effectiveFrom: salary.effectiveFrom,
        });
      }

      setSuccess('Employee saved successfully');
      // Land on the employee's full profile (documents, emergency contacts,
      // qualifications, etc. all live there, not on this create/edit form) so
      // HR can immediately continue filling in the rest of the record.
      setTimeout(() => navigate(isEdit ? '/erp/hr/employees' : `/erp/hr/employees/view/${employeeId}`), 800);
    } catch (err) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;

  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();

  return (
    <PageContainer title={isEdit ? 'Edit Employee' : 'New Employee'} description="Employee form">
      <Box sx={{ maxWidth: 'min(1400px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/hr/employees')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>{isEdit ? 'Edit Employee' : 'New Employee'}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update employee profile and job details' : 'Create a new employee record'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Profile" />
            <Tab label="Salary Structure" />
          </Tabs>
        </Card>

        <form onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {tab === 0 && (
              <>
                {/* Basic Information */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconUser} title="Basic Information" subtitle="Name, photo, and personal identifiers" />

                    <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                      <Avatar src={photoPreviewUrl} sx={{ width: 72, height: 72 }}>
                        {fullName.slice(0, 1) || <IconUser size={28} />}
                      </Avatar>
                      <Box>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          startIcon={<IconUpload size={16} />}
                          disabled={photoUploading || !isEdit}
                          sx={{ borderRadius: 2 }}
                        >
                          {photoUploading ? 'Uploading...' : 'Photo (optional)'}
                          <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                        </Button>
                        {!isEdit && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            Save the employee first, then upload a photo.
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} sx={textFieldSx}>
                          <MenuItem value="">-</MenuItem>
                          {['male', 'female', 'other'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <DatePicker
                          label="Date of Birth"
                          value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
                          onChange={(newValue) => setForm({ ...form, dateOfBirth: newValue ? newValue.format('YYYY-MM-DD') : null })}
                          slotProps={{ textField: { fullWidth: true, sx: textFieldSx } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="National ID" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} sx={textFieldSx} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconId} title="Identity Documents" subtitle="Passport, Emirates ID, visa and labour card" />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Passport Number" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Passport Issue Date" InputLabelProps={{ shrink: true }} value={form.passportIssueDate} onChange={(e) => setForm({ ...form, passportIssueDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Passport Expiry Date" InputLabelProps={{ shrink: true }} value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Emirates ID Number" value={form.emiratesIdNumber} onChange={(e) => setForm({ ...form, emiratesIdNumber: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Emirates ID Issue Date" InputLabelProps={{ shrink: true }} value={form.emiratesIdIssueDate} onChange={(e) => setForm({ ...form, emiratesIdIssueDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Emirates ID Expiry Date" InputLabelProps={{ shrink: true }} value={form.emiratesIdExpiryDate} onChange={(e) => setForm({ ...form, emiratesIdExpiryDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Visa Number" value={form.visaNumber} onChange={(e) => setForm({ ...form, visaNumber: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Visa Issue Date" InputLabelProps={{ shrink: true }} value={form.visaIssueDate} onChange={(e) => setForm({ ...form, visaIssueDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Visa Expiry Date" InputLabelProps={{ shrink: true }} value={form.visaExpiryDate} onChange={(e) => setForm({ ...form, visaExpiryDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Labour Card Number" value={form.labourCardNo} onChange={(e) => setForm({ ...form, labourCardNo: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Labour Card Issue Date" InputLabelProps={{ shrink: true }} value={form.labourCardIssueDate} onChange={(e) => setForm({ ...form, labourCardIssueDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth type="date" label="Labour Card Expiry Date" InputLabelProps={{ shrink: true }} value={form.labourCardExpiryDate} onChange={(e) => setForm({ ...form, labourCardExpiryDate: e.target.value })} sx={textFieldSx} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Contact & Address */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconMapPin} title="Contact & Address" subtitle="Home address and emergency contact" />
                    <Grid container spacing={3}>
                      <Grid size={12}>
                        <TextField fullWidth multiline rows={2} label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} sx={textFieldSx} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Job Details */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconBriefcase} title="Job Details" subtitle="Department, reporting line, and employment terms" />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} sx={textFieldSx}>
                          <MenuItem value="">None</MenuItem>
                          {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth label="Designation" value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })} sx={textFieldSx}>
                          <MenuItem value="">None</MenuItem>
                          {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.display_name}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth label="Reporting Manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} sx={textFieldSx}>
                          <MenuItem value="">None</MenuItem>
                          {employees.filter((e) => String(e.id) !== id).map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth label="Employment Type" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} sx={textFieldSx}>
                          {['full_time', 'part_time', 'contract', 'intern'].map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="Date of Joining"
                          value={form.dateOfJoining ? dayjs(form.dateOfJoining) : null}
                          onChange={(newValue) => setForm({ ...form, dateOfJoining: newValue ? newValue.format('YYYY-MM-DD') : null })}
                          slotProps={{ textField: { fullWidth: true, required: true, sx: textFieldSx } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Bank & Payroll */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconBuildingBank} title="Bank & Payroll" subtitle="Bank account details used for salary payment" />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} sx={textFieldSx} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="IBAN" value={form.bankIban} onChange={(e) => setForm({ ...form, bankIban: e.target.value })} sx={textFieldSx} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <SectionHeading icon={IconNotes} title="Notes" />
                    <TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} sx={textFieldSx} />
                  </CardContent>
                </Card>

                {/* Login access (new employee only) */}
                {!isEdit && (
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                      <SectionHeading icon={IconUserPlus} title="Login Access" subtitle="Optionally grant this employee a login to the system" />
                      <FormLabel component="legend" sx={{ mb: 1 }}>Login access</FormLabel>
                      <RadioGroup
                        row
                        value={loginMode}
                        onChange={(e) => { setLoginMode(e.target.value); setSelectedExistingUser(null); }}
                        sx={{ mb: 3 }}
                      >
                        <FormControlLabel value="none" control={<Radio />} label="No login" />
                        <FormControlLabel value="new" control={<Radio />} label="Create new login" />
                        <FormControlLabel value="existing" control={<Radio />} label="Link existing user" />
                      </RadioGroup>

                      {loginMode === 'new' && (
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              select fullWidth required label="Role" value={loginRoleId}
                              onChange={(e) => setLoginRoleId(e.target.value)}
                              helperText="A temporary password will be generated for this login"
                              sx={textFieldSx}
                            >
                              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.display_name || r.name}</MenuItem>)}
                            </TextField>
                          </Grid>
                        </Grid>
                      )}

                      {loginMode === 'existing' && (
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                              fullWidth
                              options={unlinkedUsers}
                              getOptionLabel={(opt) =>
                                typeof opt === 'object'
                                  ? `${opt.first_name || ''} ${opt.last_name || ''}`.trim() + (opt.email ? ` (${opt.email})` : '')
                                  : ''
                              }
                              value={selectedExistingUser}
                              onChange={(_, val) => {
                                setSelectedExistingUser(val);
                                if (val) {
                                  setForm((f) => ({
                                    ...f,
                                    email: f.email || val.email || '',
                                    phone: f.phone || val.phone || '',
                                  }));
                                }
                              }}
                              isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Existing user"
                                  placeholder="Search users with no employee record yet..."
                                  helperText="Only users not already linked to an employee are shown"
                                  sx={textFieldSx}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tab === 1 && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <SectionHeading icon={IconCash} title="Compensation" subtitle="Setting a new salary structure closes any prior active one automatically" />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Basic Salary" type="number" required value={salary.basicSalary} onChange={(e) => setSalary({ ...salary, basicSalary: e.target.value })} sx={textFieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Housing Allowance" type="number" value={salary.housingAllowance} onChange={(e) => setSalary({ ...salary, housingAllowance: e.target.value })} sx={textFieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Supplement Allowance" type="number" value={salary.otherAllowance} onChange={(e) => setSalary({ ...salary, otherAllowance: e.target.value })} sx={textFieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField select fullWidth label="Payment Method" value={salary.paymentMethod} onChange={(e) => setSalary({ ...salary, paymentMethod: e.target.value })} sx={textFieldSx}>
                        {['bank_transfer', 'cash', 'cheque'].map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <DatePicker
                        label="Effective From"
                        value={salary.effectiveFrom ? dayjs(salary.effectiveFrom) : null}
                        onChange={(newValue) => setSalary({ ...salary, effectiveFrom: newValue ? newValue.format('YYYY-MM-DD') : null })}
                        slotProps={{ textField: { fullWidth: true, sx: textFieldSx } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth label="Total Amount" disabled
                        value={(
                          (parseFloat(salary.basicSalary) || 0)
                          + (parseFloat(salary.housingAllowance) || 0)
                          + (parseFloat(salary.otherAllowance) || 0)
                        ).toFixed(2)}
                        helperText="Basic + Housing + Supplement, updates live"
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid size={12}>
                      <FormControlLabel control={<Checkbox checked={salary.commissionEligible} onChange={(e) => setSalary({ ...salary, commissionEligible: e.target.checked })} />} label="Commission eligible" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </LocalizationProvider>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/erp/hr/employees')}
              sx={{ minWidth: '140px', borderRadius: 2, fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              sx={{ minWidth: '180px', borderRadius: 2, fontWeight: 600 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </form>
      </Box>
    </PageContainer>
  );
};

export default EmployeeForm;
