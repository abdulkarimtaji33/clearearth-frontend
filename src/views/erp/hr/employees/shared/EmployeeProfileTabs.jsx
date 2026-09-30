import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Chip, CircularProgress, Alert, Stack, Tabs, Tab,
  Avatar, Divider, List, ListItem, ListItemText, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, Autocomplete, MenuItem,
} from '@mui/material';
import {
  IconLayoutDashboard, IconUser, IconMapPin, IconBriefcase, IconFileText, IconCash,
  IconBuildingBank, IconFiles, IconSchool, IconBulb, IconCertificate, IconHistory,
  IconUsers, IconPhoneCall, IconDeviceLaptop, IconNotes, IconUpload, IconPlus, IconTrash,
  IconDownload, IconPaperclip, IconEdit,
} from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../services/api';
import EntityListEditor from './EntityListEditor';
import ChangeRequestSection from './ChangeRequestSection';

const STATUS_COLORS = { active: 'success', onboarding: 'info', on_leave: 'warning', suspended: 'error', exited: 'default' };

const TAB_ICONS = {
  Overview: IconLayoutDashboard,
  Personal: IconUser,
  'Contact & Address': IconMapPin,
  Job: IconBriefcase,
  Contract: IconFileText,
  Compensation: IconCash,
  'Bank & Payroll IDs': IconBuildingBank,
  Documents: IconFiles,
  Qualifications: IconSchool,
  Skills: IconBulb,
  Certifications: IconCertificate,
  'Previous Employment': IconHistory,
  Dependents: IconUsers,
  'Emergency Contacts': IconPhoneCall,
  Assets: IconDeviceLaptop,
  History: IconHistory,
  Notes: IconNotes,
};

const Field = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
    <Typography variant="body1">{value || '-'}</Typography>
  </Box>
);

const TAB_LABELS_BASE = [
  'Overview', 'Personal', 'Contact & Address', 'Job', 'Contract', 'Compensation',
  'Bank & Payroll IDs', 'Documents', 'Qualifications', 'Skills', 'Certifications',
  'Previous Employment', 'Dependents', 'Emergency Contacts', 'Assets', 'History',
];

/**
 * Shared tabbed profile view used by both:
 *  - the self-service "My Profile" hub (mode="self", base=/hr/employees/me)
 *  - the HR-facing employee detail page (mode="hr", base=/hr/employees/:employeeId, plus a Notes tab)
 */
const EmployeeProfileTabs = ({ mode = 'self', employeeId }) => {
  const isSelf = mode === 'self';
  const base = isSelf ? '/hr/employees/me' : `/hr/employees/${employeeId}`;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState(null); // self mode: { salaryVisible, history }
  const [hrSalaryHistory, setHrSalaryHistory] = useState([]); // hr mode: array
  const [history, setHistory] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const empRes = isSelf ? await apiService.getMyEmployeeRecord() : await apiService.getHrEmployee(employeeId);
      if (empRes.success) setEmployee(empRes.data);

      if (isSelf) {
        const [reqRes] = await Promise.all([apiService.listMyChangeRequests()]);
        if (reqRes.success) setPendingRequests(reqRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employee record');
    } finally {
      setLoading(false);
    }
  }, [isSelf, employeeId]);

  useEffect(() => { load(); }, [load]);

  const refreshHrSalaryHistory = useCallback(() => {
    if (isSelf) return Promise.resolve();
    return apiService.getHrSalaryStructureHistory(employeeId).then((res) => { if (res.success) setHrSalaryHistory(res.data || []); }).catch(() => {});
  }, [isSelf, employeeId]);

  // Lazy-load per-tab data only when that tab is first visited
  useEffect(() => {
    if (!employee) return;
    const labels = TAB_LABELS_BASE;
    const label = labels[tab];
    if (label === 'Compensation') {
      if (isSelf && !salaryHistory) {
        apiService.getMySalaryHistory().then((res) => { if (res.success) setSalaryHistory(res.data); }).catch(() => {});
      } else if (!isSelf && hrSalaryHistory.length === 0) {
        refreshHrSalaryHistory();
      }
    }
    if (label === 'History' && history.length === 0) {
      const call = isSelf ? apiService.getMyEmployeeHistory() : apiService.getHrEmployeeHistory(employeeId);
      call.then((res) => { if (res.success) setHistory(res.data || []); }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, employee]);

  const refreshAfterChangeRequest = () => {
    load();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const res = isSelf
        ? await apiService.uploadMyEmployeePhoto(file)
        : await apiService.uploadHrEmployeePhoto(employeeId, file);
      if (res.success) load();
    } catch {
      // silently ignore — photo upload is a non-critical enhancement here
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return null;

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  const photoUrl = employee.profile_photo ? apiService.getUploadUrl(employee.profile_photo) : null;
  const labels = isSelf ? TAB_LABELS_BASE : [...TAB_LABELS_BASE, 'Notes'];

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Box position="relative">
            <Avatar src={photoUrl} sx={{ width: 64, height: 64 }}>{fullName.slice(0, 1)}</Avatar>
          </Box>
          <Box flex={1}>
            <Typography variant="h5" fontWeight={700}>{fullName || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">{employee.employee_code}</Typography>
          </Box>
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<IconUpload size={16} />}
            disabled={photoUploading}
            sx={{ borderRadius: 2 }}
          >
            {photoUploading ? 'Uploading...' : 'Update Photo'}
            <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
          </Button>
          <Chip label={(employee.employment_status || '').replace('_', ' ')} color={STATUS_COLORS[employee.employment_status] || 'default'} />
        </Stack>
      </Card>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {labels.map((l) => {
          const Icon = TAB_ICONS[l];
          return (
            <Tab
              key={l}
              label={l}
              icon={Icon ? <Icon size={18} /> : undefined}
              iconPosition="start"
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 600 }}
            />
          );
        })}
      </Tabs>

      {labels[tab] === 'Overview' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <EmployeeInfoPdfButton isSelf={isSelf} employeeId={employeeId} />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><Field label="Employee Code" value={employee.employee_code} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Job Title" value={employee.designation?.display_name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Department" value={employee.department?.name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Reporting Manager" value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Joining Date" value={employee.date_of_joining} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Employment Type" value={employee.employment_type} /></Grid>
          </Grid>
          {!isSelf && <SalaryFormsSection employeeId={employeeId} />}
        </Card>
      )}

      {labels[tab] === 'Personal' && (
        <ChangeRequestSection
          title="Personal"
          employee={employee}
          fieldGroup="personal"
          selfService={isSelf}
          editableFields={[
            { key: 'legalFullName', column: 'legal_full_name', label: 'Legal Full Name' },
            { key: 'preferredName', column: 'preferred_name', label: 'Preferred Name' },
            { key: 'firstName', column: 'first_name', label: 'First Name' },
            { key: 'lastName', column: 'last_name', label: 'Last Name' },
          ]}
          readOnlyFields={[
            { column: 'middle_name', label: 'Middle Name' },
            { column: 'date_of_birth', label: 'Date of Birth' },
            { column: 'marital_status', label: 'Marital Status' },
            { column: 'religion', label: 'Religion' },
            { column: 'blood_group', label: 'Blood Group' },
            { column: 'gender', label: 'Gender' },
            { column: 'nationality', label: 'Nationality' },
            { column: 'national_id', label: 'National ID' },
            { column: 'passport_number', label: 'Passport Number' },
          ]}
          pendingRequests={pendingRequests}
          onSubmitted={refreshAfterChangeRequest}
        />
      )}

      {labels[tab] === 'Contact & Address' && (
        <Stack spacing={2}>
          <ChangeRequestSection
            title="Contact"
            employee={employee}
            fieldGroup="contact"
            selfService={isSelf}
            editableFields={[
              { key: 'personalEmail', column: 'personal_email', label: 'Personal Email' },
              { key: 'personalPhone', column: 'personal_phone', label: 'Personal Phone' },
            ]}
            readOnlyFields={[
              { column: 'work_email', label: 'Work Email' },
              { column: 'work_phone', label: 'Work Phone' },
            ]}
            pendingRequests={pendingRequests}
            onSubmitted={refreshAfterChangeRequest}
          />
          <ChangeRequestSection
            title="Current Address"
            employee={employee}
            fieldGroup="address"
            selfService={isSelf}
            editableFields={[
              { key: 'currentAddressLine1', column: 'current_address_line1', label: 'Address Line 1' },
              { key: 'currentAddressCity', column: 'current_address_city', label: 'City' },
              { key: 'currentAddressEmirate', column: 'current_address_emirate', label: 'Emirate/State' },
              { key: 'currentAddressCountry', column: 'current_address_country', label: 'Country' },
              { key: 'currentAddressPostal', column: 'current_address_postal', label: 'Postal Code' },
            ]}
            pendingRequests={pendingRequests}
            onSubmitted={refreshAfterChangeRequest}
          />
          <ChangeRequestSection
            title="Permanent Address"
            employee={employee}
            fieldGroup="address"
            selfService={isSelf}
            editableFields={[
              { key: 'permanentAddressLine1', column: 'permanent_address_line1', label: 'Address Line 1' },
              { key: 'permanentAddressCity', column: 'permanent_address_city', label: 'City' },
              { key: 'permanentAddressEmirate', column: 'permanent_address_emirate', label: 'Emirate/State' },
              { key: 'permanentAddressCountry', column: 'permanent_address_country', label: 'Country' },
              { key: 'permanentAddressPostal', column: 'permanent_address_postal', label: 'Postal Code' },
            ]}
            pendingRequests={pendingRequests}
            onSubmitted={refreshAfterChangeRequest}
          />
        </Stack>
      )}

      {labels[tab] === 'Job' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><Field label="Department" value={employee.department?.name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Designation" value={employee.designation?.display_name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Reporting Manager" value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Work Location" value={employee.workLocation?.name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Employment Type" value={employee.employment_type} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Employment Status" value={employee.employment_status} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Joining Date" value={employee.date_of_joining} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Probation Start" value={employee.probation_start} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Probation End" value={employee.probation_end} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Confirmation Date" value={employee.confirmation_date} /></Grid>
          </Grid>
        </Card>
      )}

      {labels[tab] === 'Contract' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="body2" color="text.secondary">Contract details coming soon.</Typography>
        </Card>
      )}

      {labels[tab] === 'Compensation' && (
        <CompensationTab
          isSelf={isSelf} employee={employee} employeeId={employeeId}
          salaryHistory={salaryHistory} hrSalaryHistory={hrSalaryHistory}
          onSaved={refreshHrSalaryHistory}
        />
      )}

      {labels[tab] === 'Bank & Payroll IDs' && (
        <ChangeRequestSection
          title="Bank & Payroll IDs"
          employee={employee}
          fieldGroup="bank"
          selfService={isSelf}
          editableFields={[
            { key: 'bankName', column: 'bank_name', label: 'Bank Name' },
            { key: 'bankAccountNumber', column: 'bank_account_number', label: 'Bank Account Number' },
            { key: 'bankIban', column: 'bank_iban', label: 'IBAN' },
          ]}
          readOnlyFields={[
            { column: 'labour_card_no', label: 'Labour Card No.' },
            { column: 'mol_person_id', label: 'MOL Person ID' },
            { column: 'wps_person_code', label: 'WPS Person Code' },
            { column: 'tax_id', label: 'Tax ID' },
            { column: 'payment_method_detail', label: 'Payment Method Detail' },
            { column: 'routing_code', label: 'Routing Code' },
          ]}
          pendingRequests={pendingRequests}
          onSubmitted={refreshAfterChangeRequest}
        />
      )}

      {labels[tab] === 'Documents' && (
        <DocumentsTab base={base} />
      )}

      {labels[tab] === 'Qualifications' && (
        <EntityListEditor
          title="Qualifications" base={base} entity="qualifications" fileUpload
          fields={[
            { key: 'degree', label: 'Degree', required: true },
            { key: 'institution', label: 'Institution' },
            { key: 'year', label: 'Year', type: 'number' },
            { key: 'grade', label: 'Grade' },
          ]}
        />
      )}

      {labels[tab] === 'Skills' && (
        <EntityListEditor
          title="Skills" base={base} entity="skills"
          fields={[
            { key: 'skillName', label: 'Skill', required: true },
            {
              key: 'proficiencyLevel', label: 'Proficiency', type: 'select',
              options: ['beginner', 'intermediate', 'advanced', 'expert'].map((v) => ({ value: v, label: v })),
            },
          ]}
        />
      )}

      {labels[tab] === 'Certifications' && (
        <EntityListEditor
          title="Certifications" base={base} entity="certifications" fileUpload
          fields={[
            { key: 'name', label: 'Certification Name', required: true },
            { key: 'issuer', label: 'Issuer' },
            { key: 'certificateNumber', label: 'Certificate Number' },
            { key: 'issueDate', label: 'Issue Date', type: 'date' },
            { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
          ]}
        />
      )}

      {labels[tab] === 'Previous Employment' && (
        <EntityListEditor
          title="Previous Employment" base={base} entity="previous-employment"
          fields={[
            { key: 'companyName', label: 'Company Name', required: true },
            { key: 'jobTitle', label: 'Job Title' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'endDate', label: 'End Date', type: 'date' },
            { key: 'reasonForLeaving', label: 'Reason for Leaving', multiline: true },
          ]}
        />
      )}

      {labels[tab] === 'Dependents' && (
        <EntityListEditor
          title="Dependents" base={base} entity="dependents"
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'relationship', label: 'Relationship' },
            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
            { key: 'idNumber', label: 'ID Number' },
            { key: 'notes', label: 'Notes', multiline: true },
          ]}
        />
      )}

      {labels[tab] === 'Emergency Contacts' && (
        <EntityListEditor
          title="Emergency Contacts" base={base} entity="emergency-contacts"
          highlightWhen={(row) => !!row.is_primary}
          maxItems={3}
          maxItemsMessage="Maximum of 3 emergency contacts."
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'relationship', label: 'Relationship' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'isPrimary', label: 'Primary Contact', type: 'checkbox' },
          ]}
        />
      )}

      {labels[tab] === 'Assets' && (
        <AssetsTab isSelf={isSelf} base={base} employeeId={employeeId} />
      )}

      {labels[tab] === 'History' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No history recorded yet.</Typography>
          ) : (
            <List>
              {history.map((h) => (
                <ListItem key={h.id} divider>
                  <ListItemText
                    primary={`${(h.event_type || '').replace('_', ' ')} — ${h.field_name || ''}`}
                    secondary={
                      <>
                        {h.old_value || h.new_value ? `${h.old_value ?? '-'} → ${h.new_value ?? '-'}` : null}
                        {h.reason ? ` (${h.reason})` : ''}
                        <br />
                        {h.effective_date || h.created_at}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      )}

      {!isSelf && labels[tab] === 'Notes' && (
        <NotesTab employeeId={employeeId} />
      )}
    </Box>
  );
};

/** Sum of the 3 visible compensation fields, folding in transport_allowance silently so
 * a legacy non-zero value still counts toward the displayed total without a dedicated
 * input for it. */
const compTotal = (s) => (
  (parseFloat(s?.basic_salary) || 0)
  + (parseFloat(s?.housing_allowance) || 0)
  + (parseFloat(s?.transport_allowance) || 0)
  + (parseFloat(s?.other_allowance) || 0)
);

const CompensationSummaryGrid = ({ active }) => (
  <Grid container spacing={2} mb={2}>
    <Grid item xs={6} sm={3}><Field label="Basic Salary" value={active.basic_salary} /></Grid>
    <Grid item xs={6} sm={3}><Field label="Housing Allowance" value={active.housing_allowance} /></Grid>
    <Grid item xs={6} sm={3}><Field label="Supplement Allowance" value={active.other_allowance} /></Grid>
    <Grid item xs={6} sm={3}><Field label="Total Amount" value={compTotal(active)} /></Grid>
  </Grid>
);

const emptySalaryEditValues = { basicSalary: '', housingAllowance: '', otherAllowance: '', effectiveFrom: new Date().toISOString().slice(0, 10) };

/** HR-only edit dialog for the Compensation tab — Basic/Housing/Supplement, with a
 * live-computed read-only Total. Saves through the existing effective-dated
 * salary-structure endpoint (closes the prior active row, opens a new one). Transport
 * allowance is intentionally not shown here and is always sent as 0 on save, per the
 * relabeled field set (Basic Salary, Housing Allowance, Supplement Allowance, Total Amount). */
const CompensationEditDialog = ({ open, onClose, employeeId, onSaved }) => {
  const [values, setValues] = useState(emptySalaryEditValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setValues(emptySalaryEditValues); setError(''); } }, [open]);

  const liveTotal = (parseFloat(values.basicSalary) || 0) + (parseFloat(values.housingAllowance) || 0) + (parseFloat(values.otherAllowance) || 0);

  const submit = async () => {
    setError('');
    if (!values.basicSalary || parseFloat(values.basicSalary) <= 0) {
      setError('Basic Salary is required and must be greater than zero');
      return;
    }
    if (!values.effectiveFrom) {
      setError('Effective From date is required');
      return;
    }
    setSaving(true);
    try {
      await apiService.setHrSalaryStructure(employeeId, {
        basicSalary: parseFloat(values.basicSalary),
        housingAllowance: parseFloat(values.housingAllowance) || 0,
        transportAllowance: 0,
        otherAllowance: parseFloat(values.otherAllowance) || 0,
        effectiveFrom: values.effectiveFrom,
      });
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save compensation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Compensation</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" label="Basic Salary" required
                value={values.basicSalary}
                onChange={(e) => setValues((v) => ({ ...v, basicSalary: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" label="Housing Allowance"
                value={values.housingAllowance}
                onChange={(e) => setValues((v) => ({ ...v, housingAllowance: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" label="Supplement Allowance"
                value={values.otherAllowance}
                onChange={(e) => setValues((v) => ({ ...v, otherAllowance: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Effective From"
                value={values.effectiveFrom ? dayjs(values.effectiveFrom) : null}
                onChange={(newValue) => setValues((v) => ({ ...v, effectiveFrom: newValue ? newValue.format('YYYY-MM-DD') : '' }))}
                slotProps={{ textField: { fullWidth: true, required: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth label="Total Amount" value={liveTotal.toFixed(2)} disabled
                helperText="Basic + Housing + Supplement, updates live"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CompensationTab = ({ isSelf, employee, employeeId, salaryHistory, hrSalaryHistory, onSaved }) => {
  const [editOpen, setEditOpen] = useState(false);

  if (isSelf) {
    if (employee.salaryVisible === false) {
      return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
          <Alert severity="info">Your compensation details are managed by HR and not shown here.</Alert>
        </Card>
      );
    }
    const active = employee.activeSalaryStructure;
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
        {active ? (
          <CompensationSummaryGrid active={active} />
        ) : (
          <Typography variant="body2" color="text.secondary" mb={2}>No active salary structure on record.</Typography>
        )}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" mb={1}>History</Typography>
        {!salaryHistory ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>
        ) : (salaryHistory.history || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">No salary history.</Typography>
        ) : (
          <List dense>
            {salaryHistory.history.map((s) => (
              <ListItem key={s.id} divider>
                <ListItemText
                  primary={`Basic Salary: ${s.basic_salary} · Effective from ${s.effective_from}`}
                  secondary={`Housing Allowance: ${s.housing_allowance || 0}, Supplement Allowance: ${s.other_allowance || 0}, Total Amount: ${compTotal(s).toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    );
  }

  // HR mode: always visible (the visibility flag only restricts the employee's own view), editable.
  const activeHr = hrSalaryHistory.find((s) => s.is_active);
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>Compensation</Typography>
        <Button size="small" startIcon={<IconEdit size={16} />} onClick={() => setEditOpen(true)}>Edit</Button>
      </Box>
      {activeHr ? <CompensationSummaryGrid active={activeHr} /> : (
        <Typography variant="body2" color="text.secondary" mb={2}>No active salary structure on record.</Typography>
      )}
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" mb={1}>Salary Structure History</Typography>
      {hrSalaryHistory.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No salary structure on record.</Typography>
      ) : (
        <List dense>
          {hrSalaryHistory.map((s) => (
            <ListItem key={s.id} divider>
              <ListItemText
                primary={`Basic Salary: ${s.basic_salary} · Effective from ${s.effective_from}${s.is_active ? ' (active)' : ''}`}
                secondary={`Housing Allowance: ${s.housing_allowance || 0}, Supplement Allowance: ${s.other_allowance || 0}, Total Amount: ${compTotal(s).toFixed(2)}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <CompensationEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        employeeId={employeeId}
        onSaved={onSaved}
      />
    </Card>
  );
};

const EmployeeInfoPdfButton = ({ isSelf, employeeId }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      if (isSelf) await apiService.downloadMyEmployeeInfoPdf();
      else await apiService.downloadHrEmployeeInfoPdf(employeeId);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack alignItems="flex-end">
      <Button
        size="small" variant="outlined" startIcon={<IconDownload size={16} />}
        onClick={handleDownload} disabled={downloading} sx={{ borderRadius: 2 }}
      >
        {downloading ? 'Downloading...' : 'Download Employee Info (PDF)'}
      </Button>
      {error && <Typography variant="caption" color="error" mt={0.5}>{error}</Typography>}
    </Stack>
  );
};

// -- Documents tab: 4 always-present pinned identity documents + freeform "Other" ---
const PINNED_DOCUMENT_TYPE_NAMES = ['Passport', 'Emirates ID', 'UAE Visa', 'Labour Card'];

const emptyIdentityDocValues = { documentNumber: '', issueDate: '', expiryDate: '' };

const IdentityDocumentDialog = ({ open, onClose, base, typeName, typeId, existingRow, onSaved }) => {
  const [values, setValues] = useState(emptyIdentityDocValues);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues({
      documentNumber: existingRow?.document_number || '',
      issueDate: existingRow?.issue_date || '',
      expiryDate: existingRow?.expiry_date || '',
    });
    setFile(null);
    setError('');
  }, [open, existingRow]);

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('documentTypeId', typeId);
      fd.append('documentNumber', values.documentNumber || '');
      fd.append('issueDate', values.issueDate || '');
      fd.append('expiryDate', values.expiryDate || '');
      if (file) fd.append('file', file);
      if (existingRow) {
        await apiService.updateEmployeeChildRecord(base, 'documents', existingRow.id, fd);
      } else {
        await apiService.createEmployeeChildRecord(base, 'documents', fd);
      }
      onClose();
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{typeName}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={12}>
              <TextField
                fullWidth label="Document Number" value={values.documentNumber}
                onChange={(e) => setValues((v) => ({ ...v, documentNumber: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Issuance Date"
                value={values.issueDate ? dayjs(values.issueDate) : null}
                onChange={(nv) => setValues((v) => ({ ...v, issueDate: nv ? nv.format('YYYY-MM-DD') : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Expiration Date"
                value={values.expiryDate ? dayjs(values.expiryDate) : null}
                onChange={(nv) => setValues((v) => ({ ...v, expiryDate: nv ? nv.format('YYYY-MM-DD') : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
            </Grid>
            <Grid size={12}>
              <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
                {file ? file.name : (existingRow?.file_path ? 'Replace attached file' : 'Attach file (optional)')}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
              {existingRow?.file_path && !file && (
                <Typography variant="caption" display="block" mt={0.5}>
                  <a href={apiService.getUploadUrl(existingRow.file_path)} target="_blank" rel="noopener noreferrer">View current file</a>
                </Typography>
              )}
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const IdentityDocumentCard = ({ base, typeName, typeId, existingRow, onSaved }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>{typeName}</Typography>
          {existingRow ? (
            <>
              <Typography variant="body2">No.: {existingRow.document_number || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Issued: {existingRow.issue_date || '-'} &middot; Expires: {existingRow.expiry_date || '-'}
              </Typography>
              {existingRow.file_path && (
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
                  <IconPaperclip size={13} />
                  <a href={apiService.getUploadUrl(existingRow.file_path)} target="_blank" rel="noopener noreferrer">View attached file</a>
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">Not on file</Typography>
          )}
        </Box>
        <Button size="small" onClick={() => setOpen(true)} disabled={!typeId}>
          {existingRow ? 'Edit' : 'Add'}
        </Button>
      </Stack>
      {typeId && (
        <IdentityDocumentDialog
          open={open} onClose={() => setOpen(false)} base={base}
          typeName={typeName} typeId={typeId} existingRow={existingRow}
          onSaved={onSaved}
        />
      )}
    </Box>
  );
};

const emptyOtherDocValues = { documentTypeInput: null, documentNumber: '', issueDate: '', expiryDate: '', notes: '' };

/** "Other Documents" — HR can pick an existing document type or type a brand new one
 * (freeSolo Autocomplete); a new type is created transparently via POST
 * /hr/employees/document-types before the document itself is saved. */
const OtherDocumentsSection = ({ base, rows, documentTypes, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyOtherDocValues);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const typeNameById = new Map(documentTypes.map((t) => [t.id, t.name]));

  const openForm = () => {
    setValues(emptyOtherDocValues);
    setFile(null);
    setError('');
    setOpen(true);
  };

  const submit = async () => {
    setError('');
    const input = values.documentTypeInput;
    const typeName = (typeof input === 'string' ? input : input?.name || '').trim();
    if (!typeName) { setError('Document type is required'); return; }
    setSaving(true);
    try {
      let typeId = typeof input === 'object' && input ? input.id : null;
      if (!typeId) {
        const existing = documentTypes.find((t) => (t.name || '').toLowerCase() === typeName.toLowerCase());
        if (existing) {
          typeId = existing.id;
        } else {
          const createRes = await apiService.createEmployeeDocumentType(typeName);
          typeId = createRes.data?.id;
        }
      }
      const fd = new FormData();
      fd.append('documentTypeId', typeId);
      if (values.documentNumber) fd.append('documentNumber', values.documentNumber);
      if (values.issueDate) fd.append('issueDate', values.issueDate);
      if (values.expiryDate) fd.append('expiryDate', values.expiryDate);
      if (values.notes) fd.append('notes', values.notes);
      if (file) fd.append('file', file);
      await apiService.createEmployeeChildRecord(base, 'documents', fd);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await apiService.deleteEmployeeChildRecord(base, 'documents', id);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>Other Documents</Typography>
        <Button size="small" startIcon={<IconPlus size={16} />} onClick={openForm}>Add</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">None added yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {rows.map((row) => (
            <Box key={row.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                  <Typography variant="body2">
                    <strong>{typeNameById.get(row.document_type_id) || 'Document'}:</strong> {row.document_number || '-'}
                    {row.issue_date ? ` · Issued ${row.issue_date}` : ''}
                    {row.expiry_date ? ` · Expires ${row.expiry_date}` : ''}
                  </Typography>
                  {row.file_path && (
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <IconPaperclip size={13} />
                      <a href={apiService.getUploadUrl(row.file_path)} target="_blank" rel="noopener noreferrer">View attached file</a>
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                  <IconTrash size={16} />
                </IconButton>
              </Stack>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Document</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} mt={0.5}>
              <Grid size={12}>
                <Autocomplete
                  freeSolo
                  options={documentTypes}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                  value={values.documentTypeInput}
                  onChange={(_, newVal) => setValues((v) => ({ ...v, documentTypeInput: newVal }))}
                  onInputChange={(_, newInput, reason) => {
                    if (reason === 'input') setValues((v) => ({ ...v, documentTypeInput: newInput }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params} label="Document Type" required
                      helperText="Pick an existing type or type a new one"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth label="Document Number" value={values.documentNumber}
                  onChange={(e) => setValues((v) => ({ ...v, documentNumber: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Issue Date"
                  value={values.issueDate ? dayjs(values.issueDate) : null}
                  onChange={(nv) => setValues((v) => ({ ...v, issueDate: nv ? nv.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Expiry Date"
                  value={values.expiryDate ? dayjs(values.expiryDate) : null}
                  onChange={(nv) => setValues((v) => ({ ...v, expiryDate: nv ? nv.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth multiline rows={2} label="Notes" value={values.notes}
                  onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={12}>
                <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
                  {file ? file.name : 'Attach file (optional)'}
                  <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const DocumentsTab = ({ base }) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [typesRes, docsRes] = await Promise.all([
        apiService.getEmployeeDocumentTypes(),
        apiService.listEmployeeChildRecords(base, 'documents'),
      ]);
      if (typesRes.success) setDocumentTypes(typesRes.data || []);
      if (docsRes.success) setDocs(docsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>;

  const pinned = PINNED_DOCUMENT_TYPE_NAMES.map((name) => {
    const type = documentTypes.find((t) => (t.name || '').toLowerCase() === name.toLowerCase());
    const row = type ? docs.find((d) => d.document_type_id === type.id) : null;
    return { name, typeId: type?.id || null, row };
  });

  const pinnedTypeIds = new Set(pinned.map((p) => p.typeId).filter(Boolean));
  const otherDocs = docs.filter((d) => !pinnedTypeIds.has(d.document_type_id));

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Identity &amp; Compliance Documents</Typography>
        <Stack spacing={1.5}>
          {pinned.map((p) => (
            <IdentityDocumentCard key={p.name} base={base} typeName={p.name} typeId={p.typeId} existingRow={p.row} onSaved={load} />
          ))}
        </Stack>
      </Card>

      <OtherDocumentsSection base={base} rows={otherDocs} documentTypes={documentTypes} onSaved={load} />
    </Stack>
  );
};

const NotesTab = ({ employeeId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getEmployeeNotes(employeeId);
      if (res.success) setNotes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiService.createEmployeeNote(employeeId, text.trim());
      setText('');
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>Notes</Typography>
        <Button size="small" onClick={() => setOpen(true)}>Add Note</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
      ) : (
        <List>
          {notes.map((n) => (
            <ListItem key={n.id} divider>
              <ListItemText
                primary={n.note_text}
                secondary={`User #${n.created_by ?? '-'} · ${n.created_at ? new Date(n.created_at).toLocaleString() : ''}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={4} value={text} onChange={(e) => setText(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const ASSET_STATUS_COLORS = { assigned: 'primary', returned: 'default' };

const emptyAssetValues = { assetType: '', assetName: '', serialNumber: '', assignedDate: '', conditionNotes: '' };

/**
 * IT Asset tracking tab. HR mode gets full CRUD (assign / mark returned / delete) plus
 * the IT Asset Form and Handover Form PDF downloads; self mode is read-only (mirrors the
 * GET /hr/employees/me/assets self-service endpoint).
 */
const AssetsTab = ({ isSelf, base, employeeId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyAssetValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [downloading, setDownloading] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listEmployeeChildRecords(base, 'assets');
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const openForm = () => {
    setValues(emptyAssetValues);
    setFormError('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (!values.assetType || !values.assetName) throw new Error('Asset Type and Asset Name are required');
      const res = await apiService.createEmployeeChildRecord(base, 'assets', values);
      if (res.success) {
        setOpen(false);
        load();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReturned = async (id) => {
    if (!window.confirm('Mark this asset as returned?')) return;
    try {
      await apiService.markEmployeeAssetReturned(employeeId, id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to update asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset record?')) return;
    try {
      await apiService.deleteEmployeeChildRecord(base, 'assets', id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete asset');
    }
  };

  const handleDownload = async (kind) => {
    setDownloading(kind);
    setError('');
    try {
      if (kind === 'asset-form') await apiService.downloadItAssetFormPdf(employeeId);
      if (kind === 'handover-form') await apiService.downloadHandoverFormPdf(employeeId);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading('');
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
        <Typography variant="subtitle1" fontWeight={700}>IT Assets</Typography>
        {!isSelf && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" startIcon={<IconPlus size={16} />} onClick={openForm}>Assign Asset</Button>
            <Button
              size="small" variant="outlined"
              onClick={() => handleDownload('asset-form')}
              disabled={downloading === 'asset-form'}
            >
              {downloading === 'asset-form' ? 'Preparing...' : 'Download IT Asset Form'}
            </Button>
            <Button
              size="small" variant="outlined"
              onClick={() => handleDownload('handover-form')}
              disabled={downloading === 'handover-form'}
            >
              {downloading === 'handover-form' ? 'Preparing...' : 'Download Handover Form'}
            </Button>
          </Stack>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No assets assigned.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Serial Number</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Status</TableCell>
              {!isSelf && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.asset_type || '-'}</TableCell>
                <TableCell>{row.asset_name || '-'}</TableCell>
                <TableCell>{row.serial_number || '-'}</TableCell>
                <TableCell>{row.assigned_date || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.status} color={ASSET_STATUS_COLORS[row.status] || 'default'} />
                </TableCell>
                {!isSelf && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {row.status === 'assigned' && (
                        <Button size="small" onClick={() => handleMarkReturned(row.id)}>Mark Returned</Button>
                      )}
                      <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Asset</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Asset Type" required placeholder="e.g. Laptop, Phone, SIM Card, Access Card"
                value={values.assetType} onChange={(e) => setValues((v) => ({ ...v, assetType: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Asset Name" required placeholder="e.g. Dell Latitude 5420"
                value={values.assetName} onChange={(e) => setValues((v) => ({ ...v, assetName: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Serial Number"
                value={values.serialNumber} onChange={(e) => setValues((v) => ({ ...v, serialNumber: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="date" label="Assigned Date" InputLabelProps={{ shrink: true }}
                value={values.assignedDate} onChange={(e) => setValues((v) => ({ ...v, assignedDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Condition Notes"
                value={values.conditionNotes} onChange={(e) => setValues((v) => ({ ...v, conditionNotes: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

/**
 * HR-only Salary Certificate / Salary Slip generation buttons — placed on the Overview
 * tab (rather than Compensation) to avoid colliding with concurrent work on the
 * Compensation tab layout. Only rendered once an active salary structure is confirmed
 * to exist, per the requirement that these actions are hidden without one.
 */
const SalaryFormsSection = ({ employeeId }) => {
  const [hasActiveSalary, setHasActiveSalary] = useState(false);
  const [checked, setChecked] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiService.getHrSalaryStructureHistory(employeeId)
      .then((res) => {
        if (cancelled) return;
        const history = res.success ? (res.data || []) : [];
        setHasActiveSalary(history.some((s) => s.is_active));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [employeeId]);

  const handleDownload = async (kind) => {
    setDownloading(kind);
    setError('');
    try {
      if (kind === 'certificate') await apiService.downloadSalaryCertificatePdf(employeeId);
      if (kind === 'slip') await apiService.downloadSalarySlipPdf(employeeId);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading('');
    }
  };

  if (!checked || !hasActiveSalary) return null;

  return (
    <Box mt={2}>
      <Divider sx={{ mb: 2 }} />
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          size="small" variant="outlined"
          onClick={() => handleDownload('certificate')} disabled={downloading === 'certificate'}
        >
          {downloading === 'certificate' ? 'Preparing...' : 'Generate Salary Certificate'}
        </Button>
        <Button
          size="small" variant="outlined"
          onClick={() => handleDownload('slip')} disabled={downloading === 'slip'}
        >
          {downloading === 'slip' ? 'Preparing...' : 'Generate Salary Slip'}
        </Button>
      </Stack>
    </Box>
  );
};

export default EmployeeProfileTabs;
