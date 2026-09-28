import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Chip, CircularProgress, Alert, Stack, Tabs, Tab,
  Avatar, Divider, List, ListItem, ListItemText, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import apiService from '../../../../../services/api';
import EntityListEditor from './EntityListEditor';
import ChangeRequestSection from './ChangeRequestSection';

const STATUS_COLORS = { active: 'success', onboarding: 'info', on_leave: 'warning', suspended: 'error', exited: 'default' };

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

  // Lazy-load per-tab data only when that tab is first visited
  useEffect(() => {
    if (!employee) return;
    const labels = TAB_LABELS_BASE;
    const label = labels[tab];
    if (label === 'Compensation') {
      if (isSelf && !salaryHistory) {
        apiService.getMySalaryHistory().then((res) => { if (res.success) setSalaryHistory(res.data); }).catch(() => {});
      } else if (!isSelf && hrSalaryHistory.length === 0) {
        apiService.getHrSalaryStructureHistory(employeeId).then((res) => { if (res.success) setHrSalaryHistory(res.data || []); }).catch(() => {});
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

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return null;

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  const photoUrl = employee.profile_photo ? apiService.getUploadUrl(employee.profile_photo) : null;
  const labels = isSelf ? TAB_LABELS_BASE : [...TAB_LABELS_BASE, 'Notes'];

  return (
    <Box>
      <Card sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Avatar src={photoUrl} sx={{ width: 64, height: 64 }}>{fullName.slice(0, 1)}</Avatar>
          <Box flex={1}>
            <Typography variant="h5" fontWeight={700}>{fullName || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">{employee.employee_code}</Typography>
          </Box>
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
        {labels.map((l) => <Tab key={l} label={l} />)}
      </Tabs>

      {labels[tab] === 'Overview' && (
        <Card sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><Field label="Employee Code" value={employee.employee_code} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Job Title" value={employee.designation?.display_name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Department" value={employee.department?.name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Manager" value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Joining Date" value={employee.date_of_joining} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Employment Type" value={employee.employment_type} /></Grid>
          </Grid>
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
        <Card sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><Field label="Department" value={employee.department?.name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Designation" value={employee.designation?.display_name} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Manager" value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null} /></Grid>
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
        <Card sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary">Contract details coming soon.</Typography>
        </Card>
      )}

      {labels[tab] === 'Compensation' && (
        <CompensationTab isSelf={isSelf} employee={employee} salaryHistory={salaryHistory} hrSalaryHistory={hrSalaryHistory} />
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
        <Card sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary">No assets assigned. Asset tracking is not available yet.</Typography>
        </Card>
      )}

      {labels[tab] === 'History' && (
        <Card sx={{ p: 2.5 }}>
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

const CompensationTab = ({ isSelf, employee, salaryHistory, hrSalaryHistory }) => {
  if (isSelf) {
    if (employee.salaryVisible === false) {
      return (
        <Card sx={{ p: 2.5 }}>
          <Alert severity="info">Your compensation details are managed by HR and not shown here.</Alert>
        </Card>
      );
    }
    const active = employee.activeSalaryStructure;
    return (
      <Card sx={{ p: 2.5 }}>
        {active ? (
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={3}><Field label="Basic" value={active.basic_salary} /></Grid>
            <Grid item xs={6} sm={3}><Field label="Housing" value={active.housing_allowance} /></Grid>
            <Grid item xs={6} sm={3}><Field label="Transport" value={active.transport_allowance} /></Grid>
            <Grid item xs={6} sm={3}><Field label="Other" value={active.other_allowance} /></Grid>
          </Grid>
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
                  primary={`Basic: ${s.basic_salary} · Effective from ${s.effective_from}`}
                  secondary={`Housing: ${s.housing_allowance || 0}, Transport: ${s.transport_allowance || 0}, Other: ${s.other_allowance || 0}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    );
  }

  // HR mode: always visible (the visibility flag only restricts the employee's own view)
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" mb={1}>Salary Structure History</Typography>
      {hrSalaryHistory.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No salary structure on record.</Typography>
      ) : (
        <List dense>
          {hrSalaryHistory.map((s) => (
            <ListItem key={s.id} divider>
              <ListItemText
                primary={`Basic: ${s.basic_salary} · Effective from ${s.effective_from}${s.is_active ? ' (active)' : ''}`}
                secondary={`Housing: ${s.housing_allowance || 0}, Transport: ${s.transport_allowance || 0}, Other: ${s.other_allowance || 0}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
};

const DocumentsTab = ({ base }) => (
  <Box>
    <Alert severity="info" sx={{ mb: 2 }}>
      There is no document-type lookup endpoint on the backend yet — enter the numeric Document Type ID
      supplied by HR (a proper dropdown will be wired up once that endpoint exists).
    </Alert>
    <EntityListEditor
      title="Documents" base={base} entity="documents" fileUpload
      fields={[
        { key: 'documentTypeId', label: 'Document Type ID', type: 'number', required: true },
        { key: 'documentNumber', label: 'Document Number' },
        { key: 'issueDate', label: 'Issue Date', type: 'date' },
        { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
        { key: 'notes', label: 'Notes', multiline: true },
      ]}
    />
  </Box>
);

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
    <Card sx={{ p: 2.5 }}>
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

export default EmployeeProfileTabs;
