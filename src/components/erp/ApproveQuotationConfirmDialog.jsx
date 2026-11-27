import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, TextField,
} from '@mui/material';
import PickupRequestFields, { missingPickupRequestFields } from './PickupRequestFields';

/**
 * Confirms quotation approval — approved records move to Orders and leave the quotations list.
 * An optional pickup date can be set here; approving does NOT revert the record to pending
 * approval — operations then confirms (or requests a reschedule of) that date.
 */
const ApproveQuotationConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  entityLabel = 'quotation',
  orderCreatedLabel = 'A Service Order will be created.',
  listLabel = 'The quotation will be removed from the Quotation List.',
  pickupDate = '',
  onPickupDateChange,
  pickupNote = '',
  onPickupNoteChange,
  requestSource = null,
  requestEnabled = false,
  onRequestEnabledChange,
  pickupRequest = null,
  onPickupRequestChange,
}) => {
  const missing = requestSource ? (pickupRequest ? missingPickupRequestFields(pickupRequest) : ['Pickup / delivery request']) : [];
  const handleRequestChange = (v) => {
    onPickupRequestChange?.(v);
    onPickupDateChange?.(v?.requestDate || '');
    onPickupNoteChange?.(v?.additionalNotes || '');
  };
  return (
  <Dialog open={open} onClose={onClose} maxWidth={requestSource ? 'md' : 'sm'} fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle fontWeight={700}>Approve {entityLabel}?</DialogTitle>
    <DialogContent>
      <DialogContentText component="div">
        Once you approve this quotation:
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
          <li>{orderCreatedLabel}</li>
          <li>{listLabel}</li>
          <li>The quotation can no longer be edited or reverted.</li>
        </Box>
      </DialogContentText>
      {requestSource && (
        <PickupRequestFields
          sourceType={requestSource.type}
          sourceId={requestSource.id}
          enabled={requestEnabled}
          onEnabledChange={onRequestEnabledChange}
          value={pickupRequest}
          onChange={handleRequestChange}
        />
      )}
      {!requestSource && onPickupDateChange && (
        <TextField
          fullWidth
          type="date"
          label="Requested pickup date (optional)"
          value={pickupDate || ''}
          onChange={(e) => onPickupDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="Operations will confirm this date, or request a reschedule."
          sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}
      {!requestSource && onPickupNoteChange && (
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Note for operations (optional)"
          value={pickupNote || ''}
          onChange={(e) => onPickupNoteChange(e.target.value)}
          placeholder="Important information to share with operations"
          sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}
      <DialogContentText sx={{ mt: 2 }}>
        Do you want to continue?
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>Cancel</Button>
      <Button onClick={onConfirm} color="success" variant="contained" disabled={loading || missing.length > 0} title={missing.length ? `Required: ${missing.join(', ')}` : undefined} sx={{ borderRadius: 2 }}>
        {loading ? 'Approving…' : 'Yes, approve'}
      </Button>
    </DialogActions>
  </Dialog>
  );
};

export default ApproveQuotationConfirmDialog;
