import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Chip, Tooltip, Link,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconPlus, IconTrash, IconPaperclip, IconX } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../services/api';
import {
  SectionCard, EmptyState, LoadingBlock, StatusChip, fmtDate, humanize, inputSx, dialogPaperProps,
} from '../../components/HrUi';

const camelToSnake = (s) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

const emptyValues = (fields) => {
  const v = {};
  fields.forEach((f) => { v[f.key] = f.type === 'checkbox' ? false : ''; });
  return v;
};

const displayValue = (f, val) => {
  if (val === null || val === undefined || val === '') return '';
  if (f.type === 'date') return fmtDate(val);
  if (f.type === 'select') return humanize(val);
  return String(val);
};

/**
 * Generic list + add + delete editor for the small employee child-record entities
 * (emergency contacts, dependents, qualifications, skills, certifications, previous
 * employment). Shared between the self-service profile hub and the HR-facing employee
 * view — parameterized by `base` (either '/hr/employees/me' or `/hr/employees/:employeeId`)
 * and `entity` (the route segment).
 *
 * `fields` items: { key (camelCase, used for the create payload), label, type,
 * options?, required?, multiline? }. Row values are read back from the API response using
 * the snake_case column name (camelToSnake(key)) since Sequelize models here use
 * `underscored: true`. The first field is shown as the row title, the rest as meta.
 *
 * `variant="chips"` renders rows as removable chips (used for Skills).
 */
const EntityListEditor = ({
  title,
  subtitle,
  base,
  entity,
  fields,
  fileUpload = false,
  readOnly = false,
  highlightWhen, // optional: (row) => boolean, adds a "Primary" chip
  emptyMessage = 'None added yet.',
  icon, // optional: icon component for the card header and empty state
  maxItems, // optional: hides "Add" once rows.length reaches this
  maxItemsMessage = 'Maximum number of entries reached.',
  variant = 'list',
  addLabel = 'Add',
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() => emptyValues(fields));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [missingKey, setMissingKey] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listEmployeeChildRecords(base, entity);
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [base, entity]);

  useEffect(() => { load(); }, [load]);

  const openForm = () => {
    setValues(emptyValues(fields));
    setFile(null);
    setFormError('');
    setMissingKey('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    setMissingKey('');
    try {
      const missing = fields.find((f) => f.required && !values[f.key]);
      if (missing) { setMissingKey(missing.key); throw new Error(`${missing.label} is required`); }

      let payload;
      if (fileUpload) {
        const fd = new FormData();
        fields.forEach((f) => {
          if (values[f.key] !== '' && values[f.key] !== undefined && values[f.key] !== null) {
            fd.append(f.key, values[f.key]);
          }
        });
        if (file) fd.append('file', file);
        payload = fd;
      } else {
        payload = { ...values };
      }
      const res = await apiService.createEmployeeChildRecord(base, entity, payload);
      if (res.success) {
        setOpen(false);
        load();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await apiService.deleteEmployeeChildRecord(base, entity, id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const atMax = typeof maxItems === 'number' && rows.length >= maxItems;
  const [titleField, ...metaFields] = fields.filter((f) => f.type !== 'checkbox');
  const Icon = icon;

  const renderList = () => (
    <Stack spacing={1.25}>
      {rows.map((row) => {
        const heading = displayValue(titleField, row[camelToSnake(titleField.key)]) || '—';
        const meta = metaFields
          .filter((f) => !f.multiline)
          .map((f) => ({ f, v: displayValue(f, row[camelToSnake(f.key)]) }))
          .filter(({ v }) => v);
        const longText = metaFields
          .filter((f) => f.multiline)
          .map((f) => ({ f, v: displayValue(f, row[camelToSnake(f.key)]) }))
          .filter(({ v }) => v);
        return (
          <Stack
            key={row.id}
            direction="row"
            spacing={1.75}
            alignItems="flex-start"
            sx={{
              p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider',
              transition: 'background-color .15s',
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.03) },
              '&:hover .row-actions': { opacity: 1 },
            }}
          >
            {Icon && (
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
                bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main',
              }}
              >
                <Icon size={18} />
              </Box>
            )}
            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={700}>{heading}</Typography>
                {highlightWhen && highlightWhen(row) && <StatusChip tone="primary" label="Primary" />}
              </Stack>
              {meta.length > 0 && (
                <Stack direction="row" flexWrap="wrap" useFlexGap columnGap={2} rowGap={0.25} mt={0.5}>
                  {meta.map(({ f, v }) => (
                    <Typography key={f.key} variant="caption" color="text.secondary">
                      <Box component="span" sx={{ color: 'text.disabled' }}>{f.label}</Box>
                      {'  '}
                      <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{v}</Box>
                    </Typography>
                  ))}
                </Stack>
              )}
              {longText.map(({ f, v }) => (
                <Typography key={f.key} variant="body2" color="text.secondary" mt={0.75} sx={{ whiteSpace: 'pre-wrap' }}>{v}</Typography>
              ))}
              {row.file_path && (
                <Link
                  href={apiService.getUploadUrl(row.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  variant="caption"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75, fontWeight: 600 }}
                >
                  <IconPaperclip size={13} /> View attachment
                </Link>
              )}
            </Box>
            {!readOnly && (
              <Tooltip title="Delete">
                <IconButton
                  className="row-actions"
                  size="small"
                  onClick={() => handleDelete(row.id)}
                  sx={{ opacity: { xs: 1, md: 0.35 }, transition: 'opacity .15s', '&:hover': { color: 'error.main' } }}
                >
                  <IconTrash size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      })}
    </Stack>
  );

  const renderChips = () => (
    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
      {rows.map((row) => {
        const label = displayValue(titleField, row[camelToSnake(titleField.key)]);
        const level = metaFields.map((f) => displayValue(f, row[camelToSnake(f.key)])).filter(Boolean).join(' · ');
        return (
          <Chip
            key={row.id}
            label={(
              <span>
                <strong>{label}</strong>
                {level && <Box component="span" sx={{ color: 'text.secondary', ml: 0.75 }}>{level}</Box>}
              </span>
            )}
            onDelete={readOnly ? undefined : () => handleDelete(row.id)}
            deleteIcon={<IconX size={14} />}
            sx={{
              height: 32, borderRadius: 2, px: 0.5,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.2),
            }}
          />
        );
      })}
    </Stack>
  );

  return (
    <SectionCard
      icon={icon}
      title={title}
      subtitle={subtitle || (!loading && rows.length > 0 ? `${rows.length} ${rows.length === 1 ? 'record' : 'records'}` : undefined)}
      action={!readOnly && !atMax && (
        <Button size="small" variant="outlined" startIcon={<IconPlus size={15} />} onClick={openForm} sx={{ borderRadius: 2 }}>
          {addLabel}
        </Button>
      )}
    >
      {atMax && <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>{maxItemsMessage}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      {loading ? (
        <LoadingBlock py={3} />
      ) : rows.length === 0 ? (
        <EmptyState compact icon={icon} message={emptyMessage} />
      ) : variant === 'chips' ? renderChips() : renderList()}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add {title.replace(/s$/, '').toLowerCase()}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              {fields.map((f) => {
                const span = f.multiline ? { gridColumn: '1 / -1' } : undefined;
                if (f.type === 'select') {
                  return (
                    <TextField
                      key={f.key}
                      select fullWidth label={f.label} required={f.required}
                      error={missingKey === f.key}
                      helperText={missingKey === f.key ? `${f.label} is required` : ''}
                      value={values[f.key]}
                      onChange={(e) => { setValues((v) => ({ ...v, [f.key]: e.target.value })); if (missingKey === f.key) setMissingKey(''); }}
                      sx={{ ...inputSx, ...span }}
                    >
                      {(f.options || []).map((o) => <MenuItem key={o.value} value={o.value}>{humanize(o.label)}</MenuItem>)}
                    </TextField>
                  );
                }
                if (f.type === 'checkbox') {
                  return (
                    <TextField
                      key={f.key}
                      select fullWidth label={f.label}
                      value={values[f.key] ? 'true' : 'false'}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value === 'true' }))}
                      sx={inputSx}
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </TextField>
                  );
                }
                if (f.type === 'date') {
                  return (
                    <DatePicker
                      key={f.key}
                      label={f.label}
                      value={values[f.key] ? dayjs(values[f.key]) : null}
                      onChange={(newValue) => setValues((v) => ({ ...v, [f.key]: newValue ? newValue.format('YYYY-MM-DD') : '' }))}
                      slotProps={{ textField: { fullWidth: true, required: f.required, sx: inputSx } }}
                    />
                  );
                }
                return (
                  <TextField
                    key={f.key}
                    fullWidth
                    type={f.type || 'text'}
                    label={f.label}
                    required={f.required}
                    error={missingKey === f.key}
                    helperText={missingKey === f.key ? `${f.label} is required` : ''}
                    multiline={f.multiline}
                    rows={f.multiline ? 3 : undefined}
                    value={values[f.key]}
                    onChange={(e) => { setValues((v) => ({ ...v, [f.key]: e.target.value })); if (missingKey === f.key) setMissingKey(''); }}
                    sx={{ ...inputSx, ...span }}
                  />
                );
              })}
              {fileUpload && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Button variant="outlined" component="label" color="inherit" startIcon={<IconPaperclip size={16} />} sx={{ borderRadius: 2, borderStyle: 'dashed' }}>
                    {file ? file.name : 'Attach file (optional)'}
                    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
  );
};

export default EntityListEditor;
