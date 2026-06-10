import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  TextField,
} from '@mui/material';
import { IconKey, IconUserCheck } from '@tabler/icons-react';

/**
 * Shared approval choice + PIN dialogs for leads and deals.
 */
const ApprovalWorkflowDialogs = ({
  open,
  entityLabel = 'record',
  pinConfigured = false,
  loading = false,
  error = '',
  onClose,
  onDecideLater,
  onRequestApproval,
  onApproveWithPin,
  approveButtonLabel,
}) => {
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');

  const handleCloseAll = () => {
    setPinDialogOpen(false);
    setPin('');
    onClose?.();
  };

  const handleDecideLater = () => {
    setPinDialogOpen(false);
    setPin('');
    onDecideLater?.();
  };

  const handleApproveWithPin = async () => {
    if (!pin.trim()) return;
    await onApproveWithPin?.(pin.trim());
    setPin('');
    setPinDialogOpen(false);
  };

  const resolvedApproveLabel = approveButtonLabel || `Approve ${entityLabel}`;

  return (
    <>
      <Dialog
        open={open && !pinDialogOpen}
        onClose={() => !loading && handleDecideLater()}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" fontWeight={700}>Approve this {entityLabel}?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Approve now with the secret PIN, or send a request to your sales manager.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<IconKey size={18} />}
              onClick={() => setPinDialogOpen(true)}
              disabled={loading || !pinConfigured}
              sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
            >
              Enter secret PIN
            </Button>
            {!pinConfigured && (
              <Typography variant="caption" color="text.secondary">
                Approval PIN is not configured yet. Ask an administrator to set it in Company Settings, or request manager approval.
              </Typography>
            )}
            <Button
              variant="outlined"
              size="large"
              startIcon={<IconUserCheck size={18} />}
              onClick={onRequestApproval}
              disabled={loading}
              sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
            >
              {loading ? 'Requesting…' : 'Request manager approval'}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDecideLater} disabled={loading} sx={{ borderRadius: 2 }}>
            {onDecideLater ? 'Decide later' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={pinDialogOpen}
        onClose={() => !loading && setPinDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Enter approval PIN</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Secret PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            onKeyDown={(e) => e.key === 'Enter' && handleApproveWithPin()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setPinDialogOpen(false);
              setPin('');
            }}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Button variant="contained" onClick={handleApproveWithPin} disabled={loading || !pin.trim()} sx={{ borderRadius: 2 }}>
            {loading ? 'Approving…' : resolvedApproveLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApprovalWorkflowDialogs;
