import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Stack, Alert, Button, Paper, Snackbar, Typography, Divider, Link, Collapse, ButtonBase } from '@mui/material';
import { IconEdit, IconCheck, IconX, IconChevronDown, IconCopy } from '@tabler/icons-react';
import apiService from '../../../../../services/api';
import { useAuth } from '../../../../../context/AuthContext';
import ProfileHeader from './profile/ProfileHeader';
import CompensationSection, { compTotal } from './profile/CompensationSection';
import DocumentsTab from './profile/DocumentsTab';
import AssetsTab from './profile/AssetsTab';
import { HistoryTimeline, NotesSection } from './profile/ActivityTab';
import { PersonalLists, QualificationLists } from './profileLists';
import LeaveBalancesCard from './profile/LeaveBalancesCard';
import IdentityDocumentsSection, { IdentityCompactRows, IDENTITY_DOCS, findDocRow, currentIdentity } from './IdentityDocumentsSection';
import EmployeeFieldGrid, { useEmployeeLookups } from './EmployeeFieldGrid';
import {
  SECTIONS, displayFieldValue, valuesFromEmployee, diffValues,
} from './employeeSections';
import {
  SectionCard, LoadingBlock, expiryInfo, StatusChip, fmtDate, fmtMoney, tenureOf, humanize,
} from '../../components/HrUi';
import { IconAlertTriangle } from '@tabler/icons-react';

// Order = reading order on the page. Each is a key of SECTIONS.
const FIELD_SECTIONS = ['job', 'basic', 'contact', 'currentAddress', 'permanentAddress', 'identity', 'bank', 'settings'];
const ALL_FIELDS = FIELD_SECTIONS.flatMap((k) => SECTIONS[k].fields);

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
  const [docTypes, setDocTypes] = useState([]);
  const [docs, setDocs] = useState([]);
  const [idFiles, setIdFiles] = useState({});
  const [showEmpty, setShowEmpty] = useState(false);
  const [errors, setErrors] = useState({});
  const [openSecs, setOpenSecs] = useState({}); // collapsible secondary sections
  const [docsVersion, setDocsVersion] = useState(0);

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

  const refreshDocs = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        apiService.getEmployeeDocumentTypes(),
        apiService.listEmployeeChildRecords(base, 'documents'),
      ]);
      if (t.success) setDocTypes(t.data || []);
      if (d.success) setDocs(d.data || []);
    } catch { /* section shows employee-record data only */ }
    setDocsVersion((v) => v + 1);
  }, [base]);

  useEffect(() => { load(); refreshSalary(); refreshDocs(); }, [load, refreshSalary, refreshDocs]);
  useEffect(() => {
    apiService.getHrEmployeeHistory(employeeId)
      .then((res) => { if (res.success) setHistory(res.data || []); })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [employeeId]);

  const startEdit = () => {
    const initial = valuesFromEmployee(ALL_FIELDS, employee);
    // If the number/dates only exist on the uploaded document, bring them in so one Save syncs both.
    IDENTITY_DOCS.forEach((def) => {
      const cur = currentIdentity(def, employee, findDocRow(def, docTypes, docs).row);
      initial[def.number] = cur.number;
      initial[def.issue] = cur.issue;
      initial[def.expiry] = cur.expiry;
    });
    setValues(initial);
    setIdFiles({});
    setErrors({});
    setFormError('');
    setEditing(true);
  };
  const cancelEdit = () => {
    if (changeCount > 0 && !window.confirm('Discard your unsaved changes?')) return;
    setEditing(false); setFormError(''); setErrors({});
  };

  const save = async () => {
    const nextErrors = {};
    ALL_FIELDS.forEach((f) => {
      const v = String(values[f.key] ?? '').trim();
      if (f.required && !v) nextErrors[f.key] = `${f.label} is required`;
      else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) nextErrors[f.key] = 'Enter a valid email address';
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError(`Please fix ${Object.keys(nextErrors).length} highlighted field(s)`);
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    const patch = diffValues(ALL_FIELDS, employee, values);
    setSaving(true);
    setFormError('');
    try {
      if (Object.keys(patch).length) await apiService.updateHrEmployee(employee.id, patch);
      // Keep the uploaded-document rows in step with the ID numbers/dates (and upload new scans).
      for (const def of IDENTITY_DOCS) {
        const { typeId, row } = findDocRow(def, docTypes, docs);
        if (!typeId) continue;
        const num = values[def.number] || '';
        const issue = values[def.issue] || '';
        const expiry = values[def.expiry] || '';
        const file = idFiles[def.type];
        const fileBack = idFiles[`${def.type}:back`];
        const changed = file || fileBack
          || (row ? ((row.document_number || '') !== num || String(row.issue_date || '').slice(0, 10) !== issue || String(row.expiry_date || '').slice(0, 10) !== expiry)
            : !!(num || issue || expiry));
        if (!changed) continue;
        const fd = new FormData();
        fd.append('documentTypeId', typeId);
        fd.append('documentNumber', num);
        fd.append('issueDate', issue);
        fd.append('expiryDate', expiry);
        if (file) fd.append('file', file);
        if (fileBack) fd.append('fileBack', fileBack);
        if (row) await apiService.updateEmployeeChildRecord(base, 'documents', row.id, fd);
        else await apiService.createEmployeeChildRecord(base, 'documents', fd);
      }
      await Promise.all([load(), refreshDocs()]);
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

  const changeCount = (editing && employee)
    ? Object.keys(diffValues(ALL_FIELDS, employee, values)).length + Object.values(idFiles).filter(Boolean).length
    : 0;

  if (loading) return <LoadingBlock py={10} />;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!employee) return null;

  const flagged = IDENTITY
    .map((d) => ({ ...d, info: expiryInfo(employee[d.expiry]) }))
    .filter((d) => d.info.state === 'expired' || d.info.state === 'expiring');

  const sectionId = (key) => ({ job: 'sec-job', basic: 'sec-basic', contact: 'sec-contact', bank: 'sec-bank' }[key]);

  // Compact "label  value" rows for one field-group; inputs while editing.
  const renderGroup = (key) => {
    const def = SECTIONS[key];
    const rows = def.fields
      .map((f) => ({ f, text: displayFieldValue(f, employee) }));
    const visible = editing || showEmpty ? rows : rows.filter(({ text }) => text !== '' && text !== null && text !== undefined);
    return (
      <Box key={key} id={sectionId(key)} sx={{ scrollMarginTop: 90, mb: 2.5 }}>
        <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: '0.08em', display: 'block', mb: 0.5 }}>
          {def.title}
        </Typography>
        {editing ? (
          <EmployeeFieldGrid
            fields={def.fields} values={values} lookups={lookups} min={190}
            onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
          />
        ) : (
          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dotted' }} />}>
            {visible.length === 0 && <Typography variant="body2" color="text.disabled" py={0.75}>Nothing recorded</Typography>}
            {visible.map(({ f, text }) => (
              <Stack key={f.key} direction="row" spacing={2} py={0.7} alignItems="baseline">
                <Typography variant="body2" fontWeight={700} sx={{ width: { xs: 120, sm: 170 }, flexShrink: 0 }}>
                  {f.type === 'switch' ? 'Salary visible to employee' : f.label}
                </Typography>
                <Typography variant="body2" color={text ? 'text.primary' : 'text.disabled'} sx={{ wordBreak: 'break-word', minWidth: 0 }}>
                  {text || '—'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  const idStates = IDENTITY.map((d) => expiryInfo(employee[d.expiry]).state);
  const idsValid = idStates.filter((x) => x === 'valid').length;
  const package_ = activeSalary ? compTotal(activeSalary) : 0;
  const statCell = (label, node) => (
    <Box sx={{ flex: '1 1 180px', px: 2.5, py: 1.75, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Box mt={0.5}>{node}</Box>
    </Box>
  );

  const setField = (k, v) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  const copyCurrentAddress = () => setValues((prev) => ({
    ...prev,
    permanentAddressLine1: prev.currentAddressLine1,
    permanentAddressCity: prev.currentAddressCity,
    permanentAddressEmirate: prev.currentAddressEmirate,
    permanentAddressCountry: prev.currentAddressCountry,
    permanentAddressPostal: prev.currentAddressPostal,
  }));

  // Edit mode: one clear card per topic, roomy 3-column fields.
  const editCard = (key, extra = {}) => {
    const def = SECTIONS[key];
    return (
      <SectionCard key={key} id={sectionId(key)} icon={def.icon} title={def.title} subtitle={def.subtitle} sx={{ scrollMarginTop: 90 }} action={extra.action}>
        <EmployeeFieldGrid
          fields={def.fields} values={values} lookups={lookups} errors={errors} min={extra.min || 250}
          onChange={setField}
        />
      </SectionCard>
    );
  };

  const anchor = (id, node) => <Box id={id} sx={{ scrollMarginTop: 90 }}>{node}</Box>;

  // Secondary sections are folded away by default to keep the page short.
  const fold = (id, title, subtitle, node) => (
    <Paper id={id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', scrollMarginTop: 90 }}>
      <ButtonBase
        onClick={() => setOpenSecs((o) => ({ ...o, [id]: !o[id] }))}
        sx={{ width: '100%', px: 2.5, py: 1.75, justifyContent: 'space-between', textAlign: 'left' }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <IconChevronDown size={20} style={{ transform: openSecs[id] ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </ButtonBase>
      <Collapse in={!!openSecs[id]} unmountOnExit>
        <Box sx={{ p: 2.5, pt: 0.5 }}>{node}</Box>
      </Collapse>
    </Paper>
  );


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

      <Stack spacing={2.5}>
        {editing ? (
          <>
            {editCard('job')}
            {editCard('basic')}
            {editCard('contact')}
            <Box sx={twoCol}>
              {editCard('currentAddress', { min: 200 })}
              {editCard('permanentAddress', {
                min: 200,
                action: (
                  <Button size="small" variant="outlined" startIcon={<IconCopy size={15} />} onClick={copyCurrentAddress} sx={{ borderRadius: 2 }}>
                    Same as current
                  </Button>
                ),
              })}
            </Box>
        <IdentityDocumentsSection
          id="sec-ids"
          employee={employee}
          editing={editing}
          values={values}
          onChange={setField}
          files={idFiles}
          onFile={(type, f, side) => setIdFiles((prev) => ({ ...prev, [side === 'back' ? `${type}:back` : type]: f }))}
          docTypes={docTypes}
          docs={docs}
        />
            {editCard('bank')}
            {editCard('settings')}
          </>
        ) : (
          <>
        {/* At-a-glance strip */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Stack direction="row" flexWrap="wrap" divider={<Divider orientation="vertical" flexItem />}>
            {statCell('Status', <StatusChip status={employee.employment_status} />)}
            {statCell('Tenure', <Typography fontWeight={700}>{tenureOf(employee.date_of_joining) || '—'}{employee.date_of_joining ? <Typography component="span" variant="caption" color="text.secondary"> · since {fmtDate(employee.date_of_joining)}</Typography> : null}</Typography>)}
            {statCell('Type', <Typography fontWeight={700}>{humanize(employee.employment_type) || '—'}</Typography>)}
            {statCell('Monthly package', <Typography fontWeight={700} color="primary.main">{package_ ? fmtMoney(package_) : '—'}</Typography>)}
            {statCell('ID documents', <Typography fontWeight={700}>{idsValid}/{IDENTITY.length} valid</Typography>)}
          </Stack>
        </Paper>

        {/* All core details in one card, two columns */}
        <SectionCard
          title="Employee details"
          action={!editing && (
            <Link component="button" type="button" underline="hover" variant="body2" fontWeight={600} onClick={() => setShowEmpty((v) => !v)}>
              {showEmpty ? 'Hide empty fields' : 'Show empty fields'}
            </Link>
          )}
          contentSx={{ pt: 1.5 }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, columnGap: 6, alignItems: 'start' }}>
            <Box>
              {renderGroup('job')}
              {renderGroup('basic')}
              {renderGroup('settings')}
            </Box>
            <Box>
              {renderGroup('contact')}
              {renderGroup('currentAddress')}
              {renderGroup('permanentAddress')}
              {renderGroup('bank')}
            </Box>
          </Box>
          <Box id="sec-ids" sx={{ mt: 1, scrollMarginTop: 90 }}>
            <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: '0.08em', display: 'block', mb: 0.5 }}>
              ID documents
            </Typography>
            <IdentityCompactRows employee={employee} docTypes={docTypes} docs={docs} />
          </Box>
        </SectionCard>

          </>
        )}
        <DocumentsTab key={docsVersion} base={base} hidePinned />

        {anchor('sec-pay', (
          <Box sx={twoCol}>
            <CompensationSection
              isSelf={false} employee={employee} employeeId={employeeId}
              salaryHistory={null} hrSalaryHistory={hrSalaryHistory} hrSalaryLoaded={hrSalaryLoaded}
              onSaved={refreshSalary}
            />
            <LeaveBalancesCard employeeId={employee.id} isSelf={false} />
          </Box>
        ))}

        {fold('sec-quals', 'Family & qualifications', 'Emergency contacts, dependents, education, certifications, skills, previous jobs', (
          <Stack spacing={2.5}>
            <PersonalLists base={base} />
            <QualificationLists base={base} />
          </Stack>
        ))}
        {fold('sec-assets', 'Assets', 'Company equipment issued to this employee', (
          <AssetsTab isSelf={false} base={base} employeeId={employeeId} />
        ))}
        {fold('sec-activity', 'Activity & notes', 'Change history and private HR notes', (
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
            <Typography variant="body2" color={changeCount ? 'warning.main' : 'text.secondary'} fontWeight={600} sx={{ mr: 'auto' }}>
              {changeCount ? `${changeCount} unsaved change${changeCount > 1 ? 's' : ''}` : 'Editing — no changes yet'}
            </Typography>
            {formError && <Alert severity="error" sx={{ py: 0, borderRadius: 2 }}>{formError}</Alert>}
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
