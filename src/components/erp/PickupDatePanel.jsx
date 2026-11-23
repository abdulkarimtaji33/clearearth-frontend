import React, { useState, useEffect } from 'react';
import { Box, Paper, Stack, Typography, Chip, Button, CircularProgress, Alert, TextField } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconTruck } from '@tabler/icons-react';
import apiService from '../../services/api';

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
const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : '-');
const TRUCK_LABELS = { '1_ton': '1 ton', '3_ton': '3 ton', '10_ton': '10 ton', trailer: 'Trailer', reefer: 'Reefer', lowbed_trailer: 'Lowbed trailer' };
const PACKING = { unpacked: 'Unpacked', packed: 'Packed', palletized: 'Palletized' };
const SERVICE = { service: 'Service', purchase: 'Purchase', free_of_charge: 'Free of charge' };

const RequestDetails = ({ r }) => {
  const rows = [
    ['Company', r.companyName], ['Contact person', r.contactPerson], ['Contact no.', r.contactPhone], ['Email', r.contactEmail],
    ['Date', r.requestDate], ['Time', r.requestTime],
    ['Location', r.locationType === 'free_zone' ? 'Free zone' : r.locationType === 'main_land' ? 'Main land' : '-'],
    ['Address', r.locationAddress], ['Gate pass required', yn(r.gatePassRequired)],
    ['Service type', SERVICE[r.serviceType] || r.serviceType], ['Type of material', r.materialType], ['Total weight / quantity', r.totalWeight],
    ['Truck required', (r.truckRequired || []).map((t) => TRUCK_LABELS[t] || t).join(', ')],
    ['Packing type', PACKING[r.packingType] || r.packingType],
    ['Labor required', r.laborRequired ? `Yes${r.laborCount ? ` (${r.laborCount})` : ''}` : yn(r.laborRequired)],
    ['WDS no.', r.wdsNumber], ['WDS type', r.wdsFoodType === 'food' ? 'Food' : r.wdsFoodType === 'non_food' ? 'Non food' : ''],
    ['DM inspection required', yn(r.dmInspectionRequired)],
    ['Pick up note required', yn(r.pickupNoteRequired)], ['GRN required', yn(r.grnRequired)],
    ['Certificates', (r.certificateLabels || []).join(', ')],
    ['Additional notes', r.additionalNotes], ['Requested by', r.requestedBy],
  ];
  return (
    <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 0.75 }}>
      {rows.map(([k, v]) => (
        <Box key={k} sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>{k}</Typography>
          <Typography variant="body2" fontWeight={600}>{v || '-'}</Typography>
        </Box>
      ))}
    </Box>
  );
};

const PickupDatePanel = ({ entity, isOperations, isPreparer, onConfirm, onRequestReschedule, onReschedule, loading, error, label = 'Pickup', requestSource = null }) => {
  const [request, setRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  useEffect(() => {
    let alive = true;
    if (requestSource?.id) {
      apiService.getPickupRequest(requestSource.type, requestSource.id)
        .then((res) => { if (alive) setRequest(res?.data ?? res ?? null); })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [requestSource?.type, requestSource?.id, entity?.pickup_date_status]);
  const typeLabel = request?.requestType === 'delivery' ? 'Delivery' : label;

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
        <Typography variant="subtitle2" fontWeight={700}>{typeLabel} date: {dateToShow}</Typography>
        <Chip label={meta.label} size="small" color={meta.color} sx={{ fontWeight: 600 }} />
      </Stack>
      {request && (
        <Box mt={0.5}>
          <Button size="small" onClick={() => setShowRequest((v) => !v)} sx={{ px: 0 }}>
            {showRequest ? 'Hide' : 'View'} {typeLabel.toLowerCase()} request details
          </Button>
          {showRequest && <RequestDetails r={request} />}
        </Box>
      )}
      {entity.request_note && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Note from sales: {entity.request_note}
        </Typography>
      )}
      {status === 'reschedule_requested' && entity.pickup_reschedule_note && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Note from operations: {entity.pickup_reschedule_note}
        </Typography>
      )}

      {isOperations && status === 'pending' && (
        <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
          <Button size="small" variant="contained" color="success" disabled={loading} onClick={onConfirm}>
            {loading ? <CircularProgress size={16} color="inherit" /> : `Confirm ${typeLabel.toLowerCase()} date`}
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
            label={`New ${label.toLowerCase()} date`}
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
