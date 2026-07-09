import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';

/**
 * Confirms quotation approval — approved records move to Orders and leave the quotations list.
 */
const ApproveQuotationConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  entityLabel = 'quotation',
  ordersLabel = 'Orders',
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle fontWeight={700}>Approve {entityLabel}?</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Approving this {entityLabel} will move it to <strong>{ordersLabel}</strong> and remove it from the quotations list. This action cannot be undone from the quotations view.
      </DialogContentText>
      <DialogContentText sx={{ mt: 2 }}>
        Do you want to continue?
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>Cancel</Button>
      <Button onClick={onConfirm} color="success" variant="contained" disabled={loading} sx={{ borderRadius: 2 }}>
        {loading ? 'Approving…' : 'Yes, approve'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ApproveQuotationConfirmDialog;
