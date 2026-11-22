import React from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, CircularProgress } from '@mui/material';

const Group = ({ title, items, color }) =>
  items.length === 0 ? null : (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color={`${color}.main`} gutterBottom>{title} ({items.length})</Typography>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {items.map((i) => <Chip key={i} size="small" label={i} color={color} variant="outlined" />)}
      </Stack>
    </Box>
  );

/** "Review changes" dialog shown before saving a role. */
const AccessDiffDialog = ({ open, onClose, onConfirm, saving, diff, roleName, affectedUsers }) => (
  <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Review changes to “{roleName}”</DialogTitle>
    <DialogContent dividers>
      {affectedUsers > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This affects <b>{affectedUsers}</b> user{affectedUsers === 1 ? '' : 's'} with this role. Changes apply immediately — open sessions refresh automatically.
        </Typography>
      )}
      <Group title="Permissions added" items={diff.added} color="success" />
      <Group title="Permissions removed" items={diff.removed} color="error" />
      <Group title="Data scope changed" items={diff.scopes} color="info" />
      <Group title="Field visibility changed" items={diff.fields} color="warning" />
      <Group title="Details changed" items={diff.details} color="default" />
      {diff.total === 0 && <Typography color="text.secondary">No changes.</Typography>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>Keep editing</Button>
      <Button onClick={onConfirm} variant="contained" disabled={saving || diff.total === 0} startIcon={saving ? <CircularProgress size={16} /> : null}>
        Confirm &amp; save
      </Button>
    </DialogActions>
  </Dialog>
);

export default AccessDiffDialog;
