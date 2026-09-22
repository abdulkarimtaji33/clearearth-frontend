import React, { useState } from 'react';
import { Box, Paper, Stack, Typography, Chip, Button, CircularProgress, Alert, TextField } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconTruck } from '@tabler/icons-react';

const STATUS_META = {
  pending: { label: 'Awaiting operations confirmation', color: 'warning' },
  confirmed: { label: 'Confirmed by operations', color: 'success' },
  reschedule_requested: { label: 'Reschedule requested by operations', color: 'error' },
};

/**
 * Shown on an approved quotation/purchase-order once a pickup date has been requested.
 * Operations confirms it or requests a reschedule; sales (the preparer) submits a new
 * date once a reschedule has been requested.
 */
const PickupDatePanel = ({ entity, isOperations, isPreparer, onConfirm, onRequestReschedule, onReschedule, loading, error }) => {
  const theme = useTheme();
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [newDate, setNewDate] = useState('');

  const status = entity.pickup_date_status || 'pending';
  const meta = STATUS_META[status] || STATUS_META.pending;
  const dateToShow = status === 'confirmed' ? (entity.confirmed_pickup_date || entity.requested_pickup_date) : entity.requested_pickup_date;

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        px: 2.5,
        py: 2,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.info.main, 0.04),
        borderColor: alpha(theme.palette.info.main, 0.25),
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <IconTruck size={20} />
        <Typography variant="subtitle2" fontWeight={700}>Pickup date: {dateToShow}</Typography>
        <Chip label={meta.label} size="small" color={meta.color} sx={{ fontWeight: 600 }} />
      </Stack>
      {status === 'reschedule_requested' && entity.pickup_reschedule_note && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Note from operations: {entity.pickup_reschedule_note}
        </Typography>
      )}

      {isOperations && status === 'pending' && (
        <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
          <Button size="small" variant="contained" color="success" disabled={loading} onClick={onConfirm}>
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Confirm pickup date'}
          </Button>
          {!showRescheduleInput ? (
            <Button size="small" variant="outlined" color="warning" disabled={loading} onClick={() => setShowRescheduleInput(true)}>
              Request reschedule
            </Button>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Reason (optional)"
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
              />
              <Button
                size="small"
                variant="contained"
                color="warning"
                disabled={loading}
                onClick={() => { onRequestReschedule(rescheduleNote); setShowRescheduleInput(false); setRescheduleNote(''); }}
              >
                Send
              </Button>
              <Button size="small" onClick={() => setShowRescheduleInput(false)}>Cancel</Button>
            </Stack>
          )}
        </Stack>
      )}

      {isPreparer && status === 'reschedule_requested' && (
        <Stack direction="row" spacing={1} mt={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            type="date"
            label="New pickup date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={loading || !newDate}
            onClick={() => { onReschedule(newDate); setNewDate(''); }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Submit new date'}
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default PickupDatePanel;
