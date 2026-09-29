import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Grid, Stack, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Tooltip,
} from '@mui/material';
import { IconEdit } from '@tabler/icons-react';
import apiService from '../../../../../services/api';

const Field = ({ label, value, pending }) => (
  <Box mb={1.5}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
      {pending && (
        <Tooltip title="A change request for this field is awaiting HR approval">
          <Chip size="small" color="warning" label="Pending HR approval" sx={{ height: 18, fontSize: 11 }} />
        </Tooltip>
      )}
    </Stack>
    <Typography variant="body1">{value || '-'}</Typography>
  </Box>
);

/**
 * A profile section whose fields are editable only via the HR-approval change-request
 * workflow (POST /hr/employees/me/change-requests). Used for identity/contact/address/bank
 * fields the backend classifies as higher-risk. `editableFields` must be a subset of the
 * keys the backend's CHANGE_REQUEST_FIELD_MAP actually accepts, or the request will be
 * rejected with a 400.
 */
const ChangeRequestSection = ({
  title, employee, fieldGroup, editableFields, readOnlyFields = [], pendingRequests = [], onSubmitted, selfService = true,
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

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {selfService && editableFields.length > 0 && (
          <Button size="small" startIcon={<IconEdit size={16} />} onClick={openDialog}>Request Change</Button>
        )}
      </Box>
      <Grid container spacing={2}>
        {editableFields.map((f) => (
          <Grid item xs={12} sm={6} key={f.key}>
            <Field label={f.label} value={employee[f.column]} pending={pendingKeys.has(f.key)} />
          </Grid>
        ))}
        {readOnlyFields.map((f) => (
          <Grid item xs={12} sm={6} key={f.column}>
            <Field label={f.label} value={employee[f.column]} pending={false} />
          </Grid>
        ))}
      </Grid>
      {readOnlyFields.length > 0 && selfService && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Fields above without a &quot;Request Change&quot; option are HR-managed — contact HR to update them.
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Request changes — {title}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Changes here require HR approval before they take effect.
          </Typography>
          <Grid container spacing={2}>
            {editableFields.map((f) => (
              <Grid size={{ xs: 12, sm: 6 }} key={f.key}>
                <TextField
                  fullWidth
                  label={f.label}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Submitting...' : 'Submit for approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ChangeRequestSection;
