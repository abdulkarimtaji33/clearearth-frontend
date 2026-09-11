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
import { IconKey, IconUserCheck, IconTruckDelivery } from '@tabler/icons-react';

/**
 * Shared approval-request dialogs.
 *
 * Leads and deals keep the original PIN-or-request choice (showPinOption, default true).
 * Quotations and purchase orders no longer offer a PIN shortcut — pass showPinOption={false}
 * to render a single "send for approval" step, optionally collecting a requested pickup date.
 */
const ApprovalWorkflowDialogs = ({
  open,
  entityLabel = 'record',
  pinConfigured = false,
  showPinOption = true,
  showPickupDate = false,
  pickupDateLabel = 'Requested pickup date (optional)',
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
  const [pickupDate, setPickupDate] = useState('');

  const handleDecideLater = () => {
    setPinDialogOpen(false);
    setPin('');
    setPickupDate('');
    onDecideLater?.();
  };

  const handleApproveWithPin = async () => {
    if (!pin.trim()) return;
    await onApproveWithPin?.(pin.trim());
    setPin('');
    setPinDialogOpen(false);
  };

  const handleSendForApproval = async () => {
    await onRequestApproval?.(showPickupDate ? (pickupDate || null) : undefined);
  };

  const resolvedApproveLabel = approveButtonLabel || `Approve ${entityLabel}`;

  if (!showPinOption) {
    return (
      <Dialog
        open={open}
        onClose={() => !loading && handleDecideLater()}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" fontWeight={700}>Send for approval</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Your manager will review and approve this {entityLabel}.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {showPickupDate && (
            <TextField
              fullWidth
              type="date"
              label={pickupDateLabel}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <IconTruckDelivery size={18} style={{ marginRight: 8, opacity: 0.6 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDecideLater} disabled={loading} sx={{ borderRadius: 2 }}>
            {onDecideLater ? 'Decide later' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            startIcon={<IconUserCheck size={18} />}
            onClick={handleSendForApproval}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {loading ? 'Sending…' : 'Send for approval'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

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
              onClick={handleSendForApproval}
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
