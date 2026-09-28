import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, IconButton, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Chip, Divider,
} from '@mui/material';
import { IconPlus, IconTrash, IconPaperclip } from '@tabler/icons-react';
import apiService from '../../../../../services/api';

const camelToSnake = (s) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

const emptyValues = (fields) => {
  const v = {};
  fields.forEach((f) => { v[f.key] = f.type === 'checkbox' ? false : ''; });
  return v;
};

/**
 * Generic list + add + delete editor for the small employee child-record entities
 * (emergency contacts, dependents, qualifications, skills, certifications, previous
 * employment, documents). Shared between the self-service profile hub and the
 * HR-facing employee view — parameterized by `base` (either '/hr/employees/me' or
 * `/hr/employees/:employeeId`) and `entity` (the route segment).
 *
 * `fields` items: { key (camelCase, used for the create payload), label, type,
 * options?, required? }. Row values are read back from the API response using the
 * snake_case column name (camelToSnake(key)) since Sequelize models here use
 * `underscored: true`.
 */
const EntityListEditor = ({
  title,
  base,
  entity,
  fields,
  fileUpload = false,
  readOnly = false,
  highlightWhen, // optional: (row) => boolean, adds a "Primary" chip
  emptyMessage = 'None added yet.',
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() => emptyValues(fields));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    try {
      const missing = fields.find((f) => f.required && !values[f.key]);
      if (missing) throw new Error(`${missing.label} is required`);

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

  return (
    <Card sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {!readOnly && (
          <Button size="small" startIcon={<IconPlus size={16} />} onClick={openForm}>Add</Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <Stack spacing={1}>
          {rows.map((row) => (
            <Box key={row.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {fields.map((f) => {
                      const val = row[camelToSnake(f.key)];
                      if (val === null || val === undefined || val === '') return null;
                      return (
                        <Typography key={f.key} variant="body2">
                          <strong>{f.label}:</strong> {String(val)}
                        </Typography>
                      );
                    })}
                    {highlightWhen && highlightWhen(row) && <Chip size="small" color="primary" label="Primary" />}
                  </Stack>
                  {row.file_path && (
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <IconPaperclip size={13} />
                      <a href={apiService.getUploadUrl(row.file_path)} target="_blank" rel="noopener noreferrer">
                        View attached file
                      </a>
                    </Typography>
                  )}
                </Box>
                {!readOnly && (
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                    <IconTrash size={16} />
                  </IconButton>
                )}
              </Stack>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add {title}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            {fields.map((f) => {
              if (f.type === 'select') {
                return (
                  <TextField
                    key={f.key} select fullWidth label={f.label} required={f.required}
                    value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {(f.options || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                );
              }
              if (f.type === 'checkbox') {
                return (
                  <TextField
                    key={f.key} select fullWidth label={f.label}
                    value={values[f.key] ? 'true' : 'false'}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value === 'true' }))}
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </TextField>
                );
              }
              return (
                <TextField
                  key={f.key}
                  fullWidth
                  type={f.type || 'text'}
                  label={f.label}
                  required={f.required}
                  multiline={f.multiline}
                  rows={f.multiline ? 2 : undefined}
                  InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              );
            })}
            {fileUpload && (
              <Button variant="outlined" component="label">
                {file ? file.name : 'Attach file (optional)'}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EntityListEditor;
