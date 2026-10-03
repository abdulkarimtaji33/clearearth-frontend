import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Tooltip,
} from '@mui/material';
import { IconEdit, IconClockHour4 } from '@tabler/icons-react';
import apiService from '../../../../../services/api';
import {
  SectionCard, DetailGrid, DetailItem, StatusChip, fmtDate, humanize, inputSx, dialogPaperProps,
} from '../../components/HrUi';

const formatValue = (value, format) => {
  if (value === null || value === undefined || value === '') return '';
  if (format === 'date') return fmtDate(value);
  if (format === 'humanize') return humanize(value);
  return value;
};

/**
 * A profile section whose fields are editable only via the HR-approval change-request
 * workflow (POST /hr/employees/me/change-requests). Used for identity/contact/address/bank
 * fields the backend classifies as higher-risk. `editableFields` must be a subset of the
 * keys the backend's CHANGE_REQUEST_FIELD_MAP actually accepts, or the request will be
 * rejected with a 400. Field items may carry `format: 'date' | 'humanize'` for display.
 */
const ChangeRequestSection = ({
  title, subtitle, icon, employee, fieldGroup, editableFields, readOnlyFields = [], pendingRequests = [],
  onSubmitted, selfService = true, min,
}) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pendingKeys = new Set(
    (pendingRequests || [])
      .filter((r) => r.status === 'pending')
      .flatMap((r) => Object.keys(r.changes || {}))
  );

  const openDialog = () => {
    const initial = {};
    editableFields.forEach((f) => { initial[f.key] = employee[f.column] ?? ''; });
    setValues(initial);
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const changes = {};
      editableFields.forEach((f) => {
        const current = employee[f.column] ?? '';
        if (String(values[f.key] ?? '') !== String(current)) {
          changes[f.key] = values[f.key];
        }
      });
      if (!Object.keys(changes).length) {
        setError('No changes to submit');
        setSaving(false);
        return;
      }
      const res = await apiService.createMyChangeRequest({ fieldGroup, changes });
      if (res.success) {
        setSuccess('Change request submitted for HR approval');
        setTimeout(() => { setOpen(false); onSubmitted && onSubmitted(); }, 900);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit change request');
    } finally {
      setSaving(false);
    }
  };

  const canRequest = selfService && editableFields.length > 0;
  const hasPending = editableFields.some((f) => pendingKeys.has(f.key));

  return (
    <SectionCard
      icon={icon}
      title={title}
      subtitle={subtitle || (canRequest && readOnlyFields.length > 0 ? 'Some fields are HR-managed. Contact HR to change them.' : undefined)}
      action={canRequest && (
        <Button size="small" variant="outlined" startIcon={<IconEdit size={15} />} onClick={openDialog} sx={{ borderRadius: 2 }}>
          Request change
        </Button>
      )}
    >
      {hasPending && (
        <Alert icon={<IconClockHour4 size={18} />} severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Some changes are waiting for HR approval.
        </Alert>
      )}
      <DetailGrid min={min}>
        {[...editableFields, ...readOnlyFields].map((f) => (
          <DetailItem
            key={f.key || f.column}
            label={f.label}
            value={formatValue(employee[f.column], f.format)}
            hint={f.key && pendingKeys.has(f.key) ? (
              <Tooltip title="A change request for this field is awaiting HR approval">
                <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                  <StatusChip tone="warning" label="Pending approval" />
                </Box>
              </Tooltip>
            ) : undefined}
          />
        ))}
      </DetailGrid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Request a change</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            {title}. Changes take effect after HR approves them.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {editableFields.map((f) => (
              <TextField
                key={f.key}
                fullWidth
                label={f.label}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                sx={inputSx}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Submitting...' : 'Submit for approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
  );
};

export default ChangeRequestSection;
