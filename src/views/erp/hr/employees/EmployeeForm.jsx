import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Alert, AlertTitle, CircularProgress, Stack, Tabs, Tab,
  Checkbox, FormControlLabel, Autocomplete, RadioGroup, Radio, Avatar, Paper, Collapse,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  IconArrowLeft, IconUser, IconBriefcase, IconFiles, IconSchool, IconDeviceLaptop, IconUpload,
  IconCash, IconUserPlus, IconCheck,
} from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { SectionCard, inputSx } from '../components/HrUi';
import EmployeeFieldGrid, { useEmployeeLookups } from './shared/EmployeeFieldGrid';
import { SECTIONS, EMPTY_EMPLOYEE_VALUES } from './shared/employeeSections';
import { PersonalLists, QualificationLists } from './shared/profileLists';
import DocumentsTab from './shared/profile/DocumentsTab';
import AssetsTab from './shared/profile/AssetsTab';
import { draftBase, draftRecords, draftRemove, draftClear } from './shared/draftStore';

const TABS = [
  { key: 'personal', label: 'Personal', icon: IconUser },
  { key: 'employment', label: 'Employment', icon: IconBriefcase },
  { key: 'documents', label: 'Documents', icon: IconFiles },
  { key: 'qualifications', label: 'Qualifications', icon: IconSchool },
  { key: 'assets', label: 'Assets', icon: IconDeviceLaptop },
];

// Which tab holds each required core field, so a validation error can jump to it.
const FIELD_TAB = { firstName: 'personal', lastName: 'personal', dateOfJoining: 'employment' };

const ALL_FIELDS = Object.values(SECTIONS).flatMap((s) => s.fields);

const EMPTY_SALARY = {
  basicSalary: '', housingAllowance: '', otherAllowance: '', commissionEligible: false,
  paymentMethod: 'bank_transfer', effectiveFrom: dayjs().format('YYYY-MM-DD'),
};

const FormSection = ({ section, values, onChange, lookups, errors, children }) => {
  const def = SECTIONS[section];
  return (
    <SectionCard icon={def.icon} title={def.title} subtitle={def.subtitle}>
      <EmployeeFieldGrid fields={def.fields} values={values} onChange={onChange} lookups={lookups} errors={errors} />
      {children}
    </SectionCard>
  );
};

/**
 * Add Employee. Uses the same sections and tabs as the employee profile page, so everything that
 * can be edited later can be entered right here. Core fields are held in state; contacts,
 * dependents, qualifications, documents (with files) and assets are staged in the draft store and
 * stored together with the employee when HR presses Create.
 */
const EmployeeForm = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const draftKey = useRef(`new-${Date.now()}`);
  const base = draftBase(draftKey.current);

  const [tab, setTab] = useState('personal');
  const [values, setValues] = useState(EMPTY_EMPLOYEE_VALUES);
  const [errors, setErrors] = useState({});
  const [salary, setSalary] = useState(EMPTY_SALARY);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [failures, setFailures] = useState([]);
  const [createdId, setCreatedId] = useState(null);
  const done = useRef({ salary: false, photo: false });

  const lookups = useEmployeeLookups();

  // Login for the new employee: none | new account | link an existing user.
  const [loginMode, setLoginMode] = useState('none');
  const [loginRoleId, setLoginRoleId] = useState('');
  const [roles, setRoles] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState(null);

  useEffect(() => {
    if (hasPermission('roles.read')) apiService.getRoles({ pageSize: 200 }).then((r) => setRoles(r.data || [])).catch(() => {});
    if (hasPermission('users.read')) apiService.getUsers({ pageSize: 200, unlinked: true }).then((r) => setUnlinkedUsers(r.data || [])).catch(() => {});
    return () => draftClear(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : ''), [photoFile]);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const setValue = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const found = {};
    ALL_FIELDS.forEach((f) => { if (f.required && !values[f.key]) found[f.key] = `${f.label} is required`; });
    if (loginMode === 'new' && (!values.email || !loginRoleId)) {
      setError('Email and role are required to create a login account');
      setTab('employment');
      return false;
    }
    if (loginMode === 'existing' && !selectedExistingUser) {
      setError('Select a user to link to this employee');
      setTab('employment');
      return false;
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      setTab(FIELD_TAB[first] || 'personal');
      setError('Please fill in the required fields.');
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = {};
    ALL_FIELDS.forEach((f) => {
      const v = values[f.key];
      if (f.type === 'switch') payload[f.key] = !!v;
      else if (v !== '' && v !== undefined && v !== null) payload[f.key] = v;
    });
    if (loginMode === 'new') { payload.createLoginAccount = true; payload.roleId = loginRoleId; }
    if (loginMode === 'existing') payload.existingUserId = selectedExistingUser.id;
    return payload;
  };

  const handleSave = async () => {
    setError('');
    setFailures([]);
    if (!createdId && !validate()) return;
    setSaving(true);
    try {
      let id = createdId;
      if (!id) {
        const res = await apiService.createHrEmployee(buildPayload());
        id = res.data?.id;
        setCreatedId(id);
      }

      // The employee exists now; everything below is retryable without creating a duplicate.
      const failed = [];
      if (!done.current.salary && salary.basicSalary) {
        try {
          await apiService.setHrSalaryStructure(id, {
            basicSalary: parseFloat(salary.basicSalary),
            housingAllowance: parseFloat(salary.housingAllowance) || 0,
            transportAllowance: 0,
            otherAllowance: parseFloat(salary.otherAllowance) || 0,
            commissionEligible: salary.commissionEligible,
            paymentMethod: salary.paymentMethod,
            effectiveFrom: salary.effectiveFrom,
          });
          done.current.salary = true;
        } catch (err) { failed.push({ label: 'Salary structure', message: err.message }); }
      }
      if (!done.current.photo && photoFile) {
        try { await apiService.uploadHrEmployeePhoto(id, photoFile); done.current.photo = true; } catch (err) { failed.push({ label: 'Profile photo', message: err.message }); }
      }
      for (const rec of draftRecords(base)) {
        try {
          await apiService.createEmployeeChildRecord(`/hr/employees/${id}`, rec.entity, rec.payload);
          draftRemove(base, rec.id);
        } catch (err) {
          failed.push({ label: `${rec.entity.replace(/-/g, ' ')} (${rec.row.name || rec.row.degree || rec.row.asset_name || rec.row.skill_name || rec.row.company_name || 'item'})`, message: err.message });
        }
      }

      if (failed.length) {
        setFailures(failed);
      } else {
        draftClear(base);
        navigate(`/erp/hr/employees/view/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
  const locked = !!createdId; // core fields were already stored; further edits happen on the profile

  const coreProps = { values, onChange: setValue, lookups, errors };

  return (
    <PageContainer title="New Employee" description="Add an employee">
      <Box sx={{ maxWidth: 'min(1400px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 }, pb: 12 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={20} />} onClick={() => navigate('/erp/hr/employees')} sx={{ borderRadius: 2 }}>
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>New employee</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Fill in whatever you have across the tabs. Everything is saved together when you press Create employee.
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Collapse in={failures.length > 0}>
          <Alert
            severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}
            action={<Button color="inherit" size="small" onClick={() => navigate(`/erp/hr/employees/view/${createdId}`)}>Open employee</Button>}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Employee created, but {failures.length} {failures.length === 1 ? 'item' : 'items'} could not be saved</AlertTitle>
            {failures.map((f) => <div key={f.label}>{f.label}: {f.message}</div>)}
            Press “Retry remaining items” to try again. Items that already saved will not be duplicated.
          </Alert>
        </Collapse>
        {locked && failures.length === 0 && (
          <Alert severity="success" icon={<IconCheck size={20} />} sx={{ mb: 2.5, borderRadius: 2 }}>Employee created.</Alert>
        )}

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2.5 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 1.5 }}>
            {TABS.map((t) => <Tab key={t.key} value={t.key} icon={<t.icon size={18} />} iconPosition="start" label={t.label} sx={{ minHeight: 56 }} />)}
          </Tabs>
        </Paper>

        <Box sx={locked ? { pointerEvents: 'none', opacity: 0.6, display: ['personal', 'employment'].includes(tab) ? 'block' : 'none' } : undefined}>
          {tab === 'personal' && (
            <Stack spacing={2.5}>
              <SectionCard icon={IconUser} title="Photo">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={photoPreview} sx={{ width: 72, height: 72 }}>{fullName.slice(0, 1) || <IconUser size={28} />}</Avatar>
                  <Button component="label" variant="outlined" size="small" startIcon={<IconUpload size={16} />} sx={{ borderRadius: 2 }}>
                    {photoFile ? 'Change photo' : 'Upload photo (optional)'}
                    <input type="file" accept="image/*" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                  </Button>
                </Stack>
              </SectionCard>
              <FormSection section="basic" {...coreProps} />
              <FormSection section="contact" {...coreProps} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, alignItems: 'start' }}>
                <FormSection section="currentAddress" {...coreProps} />
                <FormSection section="permanentAddress" {...coreProps} />
              </Box>
              <FormSection section="identity" {...coreProps} />
            </Stack>
          )}

          {tab === 'employment' && (
            <Stack spacing={2.5}>
              <FormSection section="job" {...coreProps} />
              <SectionCard icon={IconCash} title="Compensation" subtitle="Starting salary structure (optional)">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                    <TextField fullWidth label="Basic salary" type="number" value={salary.basicSalary} onChange={(e) => setSalary({ ...salary, basicSalary: e.target.value })} sx={inputSx} />
                    <TextField fullWidth label="Housing allowance" type="number" value={salary.housingAllowance} onChange={(e) => setSalary({ ...salary, housingAllowance: e.target.value })} sx={inputSx} />
                    <TextField fullWidth label="Supplement allowance" type="number" value={salary.otherAllowance} onChange={(e) => setSalary({ ...salary, otherAllowance: e.target.value })} sx={inputSx} />
                    <TextField select fullWidth label="Payment method" value={salary.paymentMethod} onChange={(e) => setSalary({ ...salary, paymentMethod: e.target.value })} sx={inputSx}>
                      {['bank_transfer', 'cash', 'cheque'].map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
                    </TextField>
                    <DatePicker
                      label="Effective from"
                      value={salary.effectiveFrom ? dayjs(salary.effectiveFrom) : null}
                      onChange={(nv) => setSalary({ ...salary, effectiveFrom: nv && nv.isValid() ? nv.format('YYYY-MM-DD') : '' })}
                      slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                    />
                    <TextField
                      fullWidth label="Total" disabled sx={inputSx} helperText="Basic + housing + supplement"
                      value={((parseFloat(salary.basicSalary) || 0) + (parseFloat(salary.housingAllowance) || 0) + (parseFloat(salary.otherAllowance) || 0)).toFixed(2)}
                    />
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <FormControlLabel control={<Checkbox checked={salary.commissionEligible} onChange={(e) => setSalary({ ...salary, commissionEligible: e.target.checked })} />} label="Commission eligible" />
                    </Box>
                  </Box>
                </LocalizationProvider>
              </SectionCard>
              <FormSection section="bank" {...coreProps} />
              <FormSection section="settings" {...coreProps} />
              <SectionCard icon={IconUserPlus} title="Login access" subtitle="Optionally give this employee a login to the system">
                <RadioGroup row value={loginMode} onChange={(e) => { setLoginMode(e.target.value); setSelectedExistingUser(null); }} sx={{ mb: 2 }}>
                  <FormControlLabel value="none" control={<Radio />} label="No login" />
                  <FormControlLabel value="new" control={<Radio />} label="Create new login" />
                  <FormControlLabel value="existing" control={<Radio />} label="Link existing user" />
                </RadioGroup>
                {loginMode === 'new' && (
                  <TextField
                    select required label="Role" value={loginRoleId} onChange={(e) => setLoginRoleId(e.target.value)}
                    helperText="Uses the Email field above. A temporary password will be generated."
                    sx={{ ...inputSx, minWidth: 280 }}
                  >
                    {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.display_name || r.name}</MenuItem>)}
                  </TextField>
                )}
                {loginMode === 'existing' && (
                  <Autocomplete
                    sx={{ maxWidth: 420 }}
                    options={unlinkedUsers}
                    getOptionLabel={(o) => (typeof o === 'object' ? `${o.first_name || ''} ${o.last_name || ''}`.trim() + (o.email ? ` (${o.email})` : '') : '')}
                    value={selectedExistingUser}
                    onChange={(_, val) => {
                      setSelectedExistingUser(val);
                      if (val) setValues((v) => ({ ...v, email: v.email || val.email || '', phone: v.phone || val.phone || '' }));
                    }}
                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Existing user" helperText="Only users not already linked to an employee are shown" sx={inputSx} />
                    )}
                  />
                )}
              </SectionCard>
            </Stack>
          )}
        </Box>

        {tab === 'personal' && <Box mt={2.5}><PersonalLists base={base} /></Box>}
        {tab === 'documents' && <DocumentsTab base={base} />}
        {tab === 'qualifications' && <QualificationLists base={base} />}
        {tab === 'assets' && <AssetsTab isSelf={false} base={base} employeeId={null} />}

        <Paper
          elevation={6}
          sx={{
            position: 'sticky', bottom: 12, zIndex: 10, mt: 3, px: 2.5, py: 1.5, borderRadius: 3,
            display: 'flex', justifyContent: 'flex-end', gap: 1.5,
            border: '1px solid', borderColor: 'divider', bgcolor: (t) => alpha(t.palette.background.paper, 0.97),
          }}
        >
          <Button color="inherit" onClick={() => navigate('/erp/hr/employees')} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, minWidth: 190, fontWeight: 600 }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : createdId ? 'Retry remaining items' : 'Create employee'}
          </Button>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default EmployeeForm;
