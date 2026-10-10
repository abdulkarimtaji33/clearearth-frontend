import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Autocomplete, IconButton, Tooltip, Link,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconId, IconFiles, IconPlus, IconTrash, IconPaperclip, IconEdit, IconFileText, IconLicense, IconPlane,
  IconIdBadge2,
} from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../../services/api';
import {
  SectionCard, EmptyState, LoadingBlock, ExpiryChip, expiryInfo, inputSx, dialogPaperProps, fmtDate,
} from '../../../components/HrUi';

// The 4 always-present pinned identity documents; anything else is "Other".
export const PINNED_DOCUMENT_TYPES = [
  { name: 'Passport', icon: IconPlane },
  { name: 'Emirates ID', icon: IconId },
  { name: 'UAE Visa', icon: IconLicense },
  { name: 'Labour Card', icon: IconIdBadge2 },
];

const emptyIdentityDocValues = { documentNumber: '', issueDate: '', expiryDate: '' };

const DateField = ({ label, value, onChange }) => (
  <DatePicker
    label={label}
    value={value ? dayjs(value) : null}
    onChange={(nv) => onChange(nv ? nv.format('YYYY-MM-DD') : '')}
    slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
  />
);

const AttachButton = ({ file, setFile, hasExisting }) => (
  <Button variant="outlined" component="label" color="inherit" startIcon={<IconPaperclip size={16} />} sx={{ borderRadius: 2, borderStyle: 'dashed' }}>
    {file ? file.name : (hasExisting ? 'Replace attached file' : 'Attach file (optional)')}
    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
  </Button>
);

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
      <DialogTitle sx={{ fontWeight: 700 }}>{existingRow ? 'Edit' : 'Add'} {typeName}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            <TextField
              fullWidth label="Document number" value={values.documentNumber}
              onChange={(e) => setValues((v) => ({ ...v, documentNumber: e.target.value }))}
              sx={{ ...inputSx, gridColumn: '1 / -1' }}
            />
            <DateField label="Issue date" value={values.issueDate} onChange={(d) => setValues((v) => ({ ...v, issueDate: d }))} />
            <DateField label="Expiry date" value={values.expiryDate} onChange={(d) => setValues((v) => ({ ...v, expiryDate: d }))} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <AttachButton file={file} setFile={setFile} hasExisting={!!existingRow?.file_path} />
              {existingRow?.file_path && !file && (
                <Link href={apiService.getUploadUrl(existingRow.file_path)} target="_blank" rel="noopener noreferrer" variant="caption" display="block" mt={0.75}>
                  View current file
                </Link>
              )}
            </Box>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const IdentityDocumentCard = ({ base, typeName, icon: Icon, typeId, existingRow, onSaved }) => {
  const [open, setOpen] = useState(false);
  const info = expiryInfo(existingRow?.expiry_date);
  const accent = existingRow ? (info.tone === 'default' ? 'primary' : info.tone) : null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!existingRow || !window.confirm(`Remove the ${typeName} on file?`)) return;
    try {
      await apiService.deleteEmployeeChildRecord(base, 'documents', existingRow.id);
      onSaved();
    } catch (err) {
      window.alert(err.message || 'Failed to remove document');
    }
  };

  return (
    <Box sx={{
      position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2, height: '100%',
      display: 'flex', flexDirection: 'column', gap: 1.5,
      ...(!existingRow && { borderStyle: 'dashed', bgcolor: (t) => alpha(t.palette.text.primary, 0.015) }),
    }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
          bgcolor: (t) => (accent ? alpha(t.palette[accent].main, 0.12) : alpha(t.palette.text.primary, 0.05)),
          color: accent ? `${accent}.main` : 'text.disabled',
        }}
        >
          <Icon size={20} />
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700}>{typeName}</Typography>
          <Typography variant="body2" color={existingRow?.document_number ? 'text.primary' : 'text.disabled'} noWrap sx={{ fontFamily: existingRow?.document_number ? 'monospace' : undefined }}>
            {existingRow ? (existingRow.document_number || 'No number recorded') : 'Not on file'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          <Tooltip title={existingRow ? 'Edit' : 'Add'}>
            <span>
              <IconButton size="small" onClick={() => setOpen(true)} disabled={!typeId} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {existingRow ? <IconEdit size={16} /> : <IconPlus size={16} />}
              </IconButton>
            </span>
          </Tooltip>
          {existingRow && (
            <Tooltip title="Remove">
              <IconButton size="small" onClick={handleDelete} sx={{ border: '1px solid', borderColor: 'divider', '&:hover': { color: 'error.main' } }}>
                <IconTrash size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      {existingRow && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
          <Typography variant="caption" color="text.secondary">
            {existingRow.issue_date ? `Issued ${fmtDate(existingRow.issue_date)}` : 'Issue date —'}
            {' · '}
            {existingRow.expiry_date ? `Expires ${fmtDate(existingRow.expiry_date)}` : 'No expiry'}
          </Typography>
          <ExpiryChip expiry={existingRow.expiry_date} />
        </Stack>
      )}
      {existingRow?.file_path && (
        <Link href={apiService.getUploadUrl(existingRow.file_path)} target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <IconPaperclip size={13} /> View attachment
        </Link>
      )}
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

/** "Other Documents" — pick an existing document type or type a brand new one (freeSolo);
 * a new type is created via POST /hr/employees/document-types before the document is saved. */
const OtherDocumentsSection = ({ base, rows, documentTypes, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyOtherDocValues);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

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
      setListError(err.message || 'Failed to delete');
    }
  };

  return (
    <SectionCard
      icon={IconFiles}
      title="Other documents"
      subtitle={rows.length ? `${rows.length} on file` : 'Offer letters, contracts, certificates and more'}
      action={(
        <Button size="small" variant="outlined" startIcon={<IconPlus size={15} />} onClick={openForm} sx={{ borderRadius: 2 }}>
          Add document
        </Button>
      )}
    >
      {listError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{listError}</Alert>}
      {rows.length === 0 ? (
        <EmptyState compact icon={IconFiles} message="No other documents added yet." />
      ) : (
        <Stack spacing={1.25}>
          {rows.map((row) => (
            <Stack
              key={row.id} direction="row" spacing={1.75} alignItems="center"
              sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
                bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main',
              }}
              >
                <IconFileText size={18} />
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {typeNameById.get(row.document_type_id) || 'Document'}
                  {row.document_number && (
                    <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', ml: 1, fontFamily: 'monospace' }}>{row.document_number}</Box>
                  )}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="caption" color="text.secondary">
                    {[row.issue_date && `Issued ${fmtDate(row.issue_date)}`, row.expiry_date && `Expires ${fmtDate(row.expiry_date)}`].filter(Boolean).join(' · ') || 'No dates recorded'}
                  </Typography>
                  {row.file_path && (
                    <Link href={apiService.getUploadUrl(row.file_path)} target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                      <IconPaperclip size={13} /> Attachment
                    </Link>
                  )}
                </Stack>
              </Box>
              {row.expiry_date && <Box sx={{ display: { xs: 'none', sm: 'block' } }}><ExpiryChip expiry={row.expiry_date} /></Box>}
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ '&:hover': { color: 'error.main' } }}>
                  <IconTrash size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add document</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              <Autocomplete
                freeSolo
                options={documentTypes}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                value={values.documentTypeInput}
                onChange={(_, newVal) => setValues((v) => ({ ...v, documentTypeInput: newVal }))}
                onInputChange={(_, newInput, reason) => {
                  if (reason === 'input') setValues((v) => ({ ...v, documentTypeInput: newInput }));
                }}
                sx={{ gridColumn: '1 / -1' }}
                renderInput={(params) => (
                  <TextField
                    {...params} label="Document type" required
                    helperText="Pick an existing type or type a new one"
                    sx={inputSx}
                  />
                )}
              />
              <TextField
                fullWidth label="Document number" value={values.documentNumber}
                onChange={(e) => setValues((v) => ({ ...v, documentNumber: e.target.value }))}
                sx={{ ...inputSx, gridColumn: '1 / -1' }}
              />
              <DateField label="Issue date" value={values.issueDate} onChange={(d) => setValues((v) => ({ ...v, issueDate: d }))} />
              <DateField label="Expiry date" value={values.expiryDate} onChange={(d) => setValues((v) => ({ ...v, expiryDate: d }))} />
              <TextField
                fullWidth multiline rows={2} label="Notes" value={values.notes}
                onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                sx={{ ...inputSx, gridColumn: '1 / -1' }}
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <AttachButton file={file} setFile={setFile} />
              </Box>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
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

  if (loading) return <LoadingBlock />;

  const pinned = PINNED_DOCUMENT_TYPES.map(({ name, icon }) => {
    const type = documentTypes.find((t) => (t.name || '').toLowerCase() === name.toLowerCase());
    const row = type ? docs.find((d) => d.document_type_id === type.id) : null;
    return { name, icon, typeId: type?.id || null, row };
  });

  const pinnedTypeIds = new Set(pinned.map((p) => p.typeId).filter(Boolean));
  const otherDocs = docs.filter((d) => !pinnedTypeIds.has(d.document_type_id));
  const onFile = pinned.filter((p) => p.row).length;

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
      <SectionCard icon={IconId} title="Identity & compliance" subtitle={`${onFile} of ${pinned.length} documents on file`}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
          {pinned.map((p) => (
            <IdentityDocumentCard key={p.name} base={base} typeName={p.name} icon={p.icon} typeId={p.typeId} existingRow={p.row} onSaved={load} />
          ))}
        </Box>
      </SectionCard>
      <OtherDocumentsSection base={base} rows={otherDocs} documentTypes={documentTypes} onSaved={load} />
    </Stack>
  );
};

export default DocumentsTab;
