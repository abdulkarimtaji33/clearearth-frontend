import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box,
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
  orderCreatedLabel = 'A Service Order will be created.',
  listLabel = 'The quotation will be removed from the Quotation List.',
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
