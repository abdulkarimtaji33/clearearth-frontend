import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Stack, Alert, Button, Chip, Paper, Snackbar } from '@mui/material';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import apiService from '../../../../../services/api';
import { useAuth } from '../../../../../context/AuthContext';
import ProfileHeader from './profile/ProfileHeader';
import CompensationSection from './profile/CompensationSection';
import DocumentsTab from './profile/DocumentsTab';
import AssetsTab from './profile/AssetsTab';
import { HistoryTimeline, NotesSection } from './profile/ActivityTab';
import { PersonalLists, QualificationLists } from './profileLists';
import LeaveBalancesCard from './profile/LeaveBalancesCard';
import EmployeeFieldGrid, { useEmployeeLookups } from './EmployeeFieldGrid';
import {
  SECTIONS, displayFieldValue, valuesFromEmployee, diffValues,
} from './employeeSections';
import {
  SectionCard, DetailGrid, DetailItem, LoadingBlock, expiryInfo,
} from '../../components/HrUi';
import { IconAlertTriangle } from '@tabler/icons-react';

// Order = reading order on the page. Each is a key of SECTIONS.
const FIELD_SECTIONS = ['job', 'basic', 'contact', 'currentAddress', 'permanentAddress', 'identity', 'bank', 'settings'];
const ALL_FIELDS = FIELD_SECTIONS.flatMap((k) => SECTIONS[k].fields);

const NAV = [
  { id: 'sec-job', label: 'Job' },
  { id: 'sec-basic', label: 'Personal' },
  { id: 'sec-contact', label: 'Contact' },
  { id: 'sec-identity', label: 'IDs' },
  { id: 'sec-bank', label: 'Bank' },
  { id: 'sec-pay', label: 'Salary' },
  { id: 'sec-docs', label: 'Documents' },
  { id: 'sec-quals', label: 'Qualifications' },
  { id: 'sec-assets', label: 'Assets' },
  { id: 'sec-activity', label: 'Activity' },
];

const twoCol = { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, alignItems: 'start' };

const IDENTITY = [
  { label: 'Passport', expiry: 'passport_expiry_date' },
  { label: 'Emirates ID', expiry: 'emirates_id_expiry_date' },
  { label: 'UAE Visa', expiry: 'visa_expiry_date' },
  { label: 'Labour Card', expiry: 'labour_card_expiry_date' },
];

/**
 * HR view of one employee on a single scrolling page (no tabs).
 * Press Edit once: every field becomes an input, one Save button saves everything.
 */
const EmployeeDetailPage = ({ employeeId }) => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('hr.employees.manage');
  const base = `/hr/employees/${employeeId}`;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [hrSalaryHistory, setHrSalaryHistory] = useState([]);
  const [hrSalaryLoaded, setHrSalaryLoaded] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState('');

  const lookups = useEmployeeLookups(employeeId, editing);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await apiService.getHrEmployee(employeeId);
      if (res.success) setEmployee(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load employee record');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const refreshSalary = useCallback(() => apiService.getHrSalaryStructureHistory(employeeId)
    .then((res) => { if (res.success) setHrSalaryHistory(res.data || []); })
    .catch(() => {})
    .finally(() => setHrSalaryLoaded(true)), [employeeId]);

  useEffect(() => { load(); refreshSalary(); }, [load, refreshSalary]);
  useEffect(() => {
    apiService.getHrEmployeeHistory(employeeId)
      .then((res) => { if (res.success) setHistory(res.data || []); })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [employeeId]);

  const startEdit = () => {
    setValues(valuesFromEmployee(ALL_FIELDS, employee));
    setFormError('');
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setFormError(''); };

  const save = async () => {
    const missing = ALL_FIELDS.find((f) => f.required && !values[f.key]);
    if (missing) { setFormError(`${missing.label} is required`); return; }
    const patch = diffValues(ALL_FIELDS, employee, values);
    if (!Object.keys(patch).length) { setEditing(false); return; }
    setSaving(true);
    setFormError('');
    try {
      await apiService.updateHrEmployee(employee.id, patch);
      await load();
      setEditing(false);
      setToast('Saved');
    } catch (err) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoUploading(true);
      setActionError('');
      const res = await apiService.uploadHrEmployeePhoto(employeeId, file);
      if (res.success) load();
    } catch (err) {
      setActionError(err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDownload = useCallback(async (kind) => {
    setDownloading(kind);
    setActionError('');
    try {
      if (kind === 'info') await apiService.downloadHrEmployeeInfoPdf(employeeId);
      if (kind === 'certificate') await apiService.downloadSalaryCertificatePdf(employeeId);
      if (kind === 'slip') await apiService.downloadSalarySlipPdf(employeeId);
    } catch (err) {
      setActionError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading('');
    }
  }, [employeeId]);

  const activeSalary = hrSalaryHistory.find((s) => s.is_active);
  const documentActions = useMemo(() => {
    const list = [{ key: 'info', label: 'Employee info', hint: 'PDF summary of this record' }];
    if (activeSalary) {
      list.push({ key: 'certificate', label: 'Salary certificate', hint: 'Based on the active salary' });
      list.push({ key: 'slip', label: 'Salary slip', hint: 'Based on the active salary' });
    }
    return list.map((a) => ({ ...a, loading: downloading === a.key, onClick: () => handleDownload(a.key) }));
  }, [activeSalary, downloading, handleDownload]);

  if (loading) return <LoadingBlock py={10} />;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!employee) return null;

  const flagged = IDENTITY
    .map((d) => ({ ...d, info: expiryInfo(employee[d.expiry]) }))
    .filter((d) => d.info.state === 'expired' || d.info.state === 'expiring');

  const sectionId = (key) => ({ job: 'sec-job', basic: 'sec-basic', contact: 'sec-contact', identity: 'sec-identity', bank: 'sec-bank' }[key]);

  // One card per field-section: shows values, or inputs while editing.
  const renderSection = (key, min = 220) => {
    const def = SECTIONS[key];
    return (
      <SectionCard key={key} id={sectionId(key)} icon={def.icon} title={def.title} subtitle={def.subtitle} sx={{ scrollMarginTop: 90 }}>
        {editing ? (
          <EmployeeFieldGrid
            fields={def.fields} values={values} lookups={lookups} min={min}
            onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
          />
        ) : (
          <DetailGrid min={min}>
            {def.fields.filter((f) => f.type !== 'textarea' || displayFieldValue(f, employee)).map((f) => (
              <DetailItem key={f.key} label={f.type === 'switch' ? 'Salary visible to employee' : f.label} value={displayFieldValue(f, employee)} />
            ))}
          </DetailGrid>
        )}
      </SectionCard>
    );
  };

  const anchor = (id, node) => <Box id={id} sx={{ scrollMarginTop: 90 }}>{node}</Box>;

  return (
    <Box sx={{ pb: editing ? 10 : 0 }}>
      <ProfileHeader
        employee={employee}
        photoUrl={employee.profile_photo ? apiService.getUploadUrl(employee.profile_photo) : null}
        photoUploading={photoUploading}
        onPhotoUpload={canEdit ? handlePhotoUpload : undefined}
        documentActions={documentActions}
        actions={canEdit && !editing && (
          <Button variant="contained" startIcon={<IconEdit size={17} />} onClick={startEdit} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Edit details
          </Button>
        )}
      />

      {actionError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}

      {flagged.length > 0 && (
        <Alert severity={flagged.some((d) => d.info.state === 'expired') ? 'error' : 'warning'} icon={<IconAlertTriangle size={20} />} sx={{ mb: 2.5, borderRadius: 2.5 }}>
          {flagged.map((d) => `${d.label}: ${d.info.label.toLowerCase()}`).join(' · ')}
        </Alert>
      )}

      {editing && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5 }}>
          Edit mode — change anything below, then press <b>Save changes</b> at the bottom.
        </Alert>
      )}

      {/* Quick jump */}
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mb={2.5}>
        {NAV.map((n) => (
          <Chip
            key={n.id} label={n.label} size="small" variant="outlined" clickable
            onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>

      <Stack spacing={2.5}>
        {renderSection('job', 200)}
        {renderSection('basic')}
        {renderSection('contact')}
        <Box sx={twoCol}>
          {renderSection('currentAddress', 160)}
          {renderSection('permanentAddress', 160)}
        </Box>
        {renderSection('identity')}
        {renderSection('bank')}
        {renderSection('settings')}

        {anchor('sec-pay', (
          <Stack spacing={2.5}>
            <CompensationSection
              isSelf={false} employee={employee} employeeId={employeeId}
              salaryHistory={null} hrSalaryHistory={hrSalaryHistory} hrSalaryLoaded={hrSalaryLoaded}
              onSaved={refreshSalary}
            />
            <LeaveBalancesCard employeeId={employee.id} isSelf={false} />
          </Stack>
        ))}

        {anchor('sec-docs', <DocumentsTab base={base} />)}
        {anchor('sec-quals', (
          <Stack spacing={2.5}>
            <PersonalLists base={base} />
            <QualificationLists base={base} />
          </Stack>
        ))}
        {anchor('sec-assets', <AssetsTab isSelf={false} base={base} employeeId={employeeId} />)}
        {anchor('sec-activity', (
          <Box sx={twoCol}>
            <HistoryTimeline history={history} loading={!historyLoaded} />
            <NotesSection employeeId={employeeId} />
          </Box>
        ))}
      </Stack>

      {editing && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200, px: { xs: 2, md: 4 }, py: 1.5,
            borderTop: '1px solid', borderColor: 'divider', borderRadius: 0,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" sx={{ maxWidth: 1400, mx: 'auto' }}>
            {formError && <Alert severity="error" sx={{ py: 0, mr: 'auto', borderRadius: 2 }}>{formError}</Alert>}
            <Button color="inherit" startIcon={<IconX size={16} />} onClick={cancelEdit} disabled={saving} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" startIcon={<IconCheck size={16} />} onClick={save} disabled={saving} sx={{ borderRadius: 2, fontWeight: 700 }}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </Stack>
        </Paper>
      )}

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
};

export default EmployeeDetailPage;
