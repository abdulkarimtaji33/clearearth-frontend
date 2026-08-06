import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconArrowLeft,
  IconBuilding,
  IconCamera,
  IconCheck,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconPlayerPlay,
  IconTruck,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';
import useUnitsOfMeasure from '../../../hooks/useUnitsOfMeasure';

const CONDITIONS = ['Good', 'Fair', 'Poor', 'Damaged'];

const STATUS_STEPS = [
  { key: 'not_started', label: 'Start', icon: <IconPlayerPlay size={16} /> },
  { key: 'in_progress', label: 'In Progress', icon: <IconTruck size={16} /> },
  { key: 'completed', label: 'Picked Up', icon: <IconCheck size={16} /> },
];

const statusStepIndex = (status) => {
  if (status === 'in_progress') return 1;
  if (status === 'completed') return 2;
  return 0;
};

// ── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {icon}
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
};

// ── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
    <Typography variant="body2" color="text.disabled" sx={{ minWidth: 110, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value || '—'}
    </Typography>
  </Box>
);

// ── Photo thumbnail ───────────────────────────────────────────────────────────
const PhotoThumb = ({ src, onRemove, size = 90 }) => (
  <Box sx={{ position: 'relative', flexShrink: 0 }}>
    <Box
      component="img"
      src={src}
      sx={{ width: size, height: size, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'block' }}
    />
    {onRemove && (
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: '#fff', width: 22, height: 22, '&:hover': { bgcolor: 'error.dark' } }}
      >
        <IconX size={12} />
      </IconButton>
    )}
  </Box>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const DriverPickupTaskView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // form state
  const [quantity, setQuantity] = useState('');
  const [uom, setUom] = useState('');
  const [uomOptions, setUomOptions] = useState([]);
  // `uom` holds the raw catalog value (submitted with the pickup); resolve it to the
  // display name only where it is shown to the driver.
  const { format: formatUomValue } = useUnitsOfMeasure();
  const uomLabel = formatUomValue(uom, '');
  const [condition, setCondition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [newPhotos, setNewPhotos] = useState([]); // { file, preview }
  const [pickupDate, setPickupDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  const [acting, setActing] = useState(null);
  const [actionErr, setActionErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPickup = async () => {
    try {
      setLoading(true);
      setFetchErr('');
      const res = await apiService.getDriverPickup(taskId);
      if (!res.success) throw new Error(res.message || 'Failed to load pickup');
      const data = res.data;
      setPickup(data);
      // pre-fill from inspection request or existing confirmed values
      if (data.pickupQuantity) setQuantity(data.pickupQuantity);
      else if (data.material?.quantity) setQuantity(String(data.material.quantity));
      setUom(data.pickupUom || data.uom || data.material?.unit || '');
      if (data.pickupCondition) setCondition(data.pickupCondition);
      if (data.notes) setRemarks(data.notes);
    } catch (e) {
      setFetchErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickup();
    apiService.getAllDropdowns().then((res) => {
      if (res?.success) setUomOptions(res.data?.units_of_measure || []);
    }).catch(() => {});
  }, [taskId]);

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewPhotos((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeNewPhoto = (idx) => {
    setNewPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleStart = async () => {
    try {
      setActing('start');
      setActionErr('');
      await apiService.startDriverPickup(taskId);
      await fetchPickup();
    } catch (e) {
      setActionErr(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleConfirm = async () => {
    try {
      setActing('confirm');
      setActionErr('');
      const formData = new FormData();
      if (quantity) formData.append('quantity', quantity);
      if (uom) formData.append('uom', uom);
      if (condition) formData.append('condition', condition);
      if (remarks) formData.append('remarks', remarks);
      newPhotos.forEach(({ file }) => formData.append('photos', file));
      await apiService.completeDriverPickupWithData(taskId, formData);
      setNewPhotos([]);
      setSuccessMsg('Pickup confirmed successfully!');
      await fetchPickup();
    } catch (e) {
      setActionErr(e.message);
    } finally {
      setActing(null);
    }
  };

  const driverName = user
    ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.username || user.email
    : '—';

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchErr) {
    return (
      <Box sx={{ maxWidth: 580, mx: 'auto', p: 2 }}>
        <Button startIcon={<IconArrowLeft />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{fetchErr}</Alert>
      </Box>
    );
  }

  if (!pickup) return null;

  const stepIndex = statusStepIndex(pickup.taskStatus);
  const isCompleted = pickup.taskStatus === 'completed';
  const canEdit = !isCompleted;
  const existingPhotos = pickup.files || [];
  const address = [
    pickup.deal?.company?.address,
    pickup.deal?.company?.city,
    pickup.deal?.company?.country,
  ].filter(Boolean).join(', ');

  return (
    <Box sx={{ maxWidth: 580, mx: 'auto', pb: 4 }}>
      {/* Back + title */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <IconArrowLeft size={20} />
        </IconButton>
        <Typography variant="h5" fontWeight={800}>
          Pickup Task
        </Typography>
      </Stack>

      {/* Assignment card */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, mb: 2 }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Assigned Task
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mt={0.25}>
              <Typography variant="h6" fontWeight={800}>
                {pickup.workOrderId != null ? `WO-${pickup.workOrderId}` : pickup.deal?.deal_number ? `ORD-${pickup.deal.deal_number}` : 'Pickup task'}
              </Typography>
              <Chip
                label={isCompleted ? 'Collected' : pickup.taskStatus === 'in_progress' ? 'In Progress' : 'Pending'}
                size="small"
                color={isCompleted ? 'success' : pickup.taskStatus === 'in_progress' ? 'warning' : 'default'}
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Stack>
            {pickup.deal?.company?.name && (
              <Typography variant="body2" fontWeight={600} mt={0.25}>
                {pickup.deal.company.name}
              </Typography>
            )}
            {address && (
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.25}>
                <IconMapPin size={13} color={theme.palette.text.disabled} />
                <Typography variant="caption" color="text.secondary">{address}</Typography>
              </Stack>
            )}
          </Box>
          <Box flexShrink={0}>
            <Typography variant="caption" color="text.disabled">Assigned On</Typography>
            <Typography variant="body2" fontWeight={600}>
              {pickup.startDate
                ? new Date(`${pickup.startDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Start Pickup button — only when not started */}
      {pickup.taskStatus === 'not_started' && (
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={acting === 'start' ? <CircularProgress size={18} color="inherit" /> : <IconPlayerPlay size={20} />}
          disabled={!!acting}
          onClick={handleStart}
          sx={{ mb: 2, borderRadius: 2.5, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
        >
          {acting === 'start' ? 'Starting…' : 'Start Pickup'}
        </Button>
      )}

      {/* Progress stepper */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', px: 2, py: 2, mb: 2 }}>
        <Stepper activeStep={stepIndex} alternativeLabel>
          {STATUS_STEPS.map((step, idx) => (
            <Step key={step.key} completed={idx < stepIndex}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: idx <= stepIndex
                        ? idx < stepIndex ? 'success.main' : 'primary.main'
                        : alpha(theme.palette.text.disabled, 0.15),
                      color: idx <= stepIndex ? '#fff' : theme.palette.text.disabled,
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                <Typography variant="caption" fontWeight={idx === stepIndex ? 700 : 400} color={idx === stepIndex ? 'primary' : 'text.secondary'}>
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Material Details */}
      {(pickup.material || uom) && (
        <Section icon={<IconTruck size={16} color={theme.palette.primary.main} />} title="Material Details">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {pickup.material?.materialType && (
              <Box flex={1} minWidth={120}>
                <Typography variant="caption" color="text.disabled">Material Type</Typography>
                <Typography variant="body2" fontWeight={700}>{pickup.material.materialType}</Typography>
              </Box>
            )}
            {pickup.material?.quantity != null && pickup.material.quantity !== '' && (
              <Box minWidth={100}>
                <Typography variant="caption" color="text.disabled">Expected Qty</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {pickup.material.quantity}{uomLabel ? ` ${uomLabel}` : ''}
                </Typography>
              </Box>
            )}
            {uom && (
              <Box minWidth={80}>
                <Typography variant="caption" color="text.disabled">UOM</Typography>
                <Typography variant="body2" fontWeight={700}>{uomLabel}</Typography>
              </Box>
            )}
            {pickup.material?.specification && (
              <Box flex={1} minWidth={120}>
                <Typography variant="caption" color="text.disabled">Specification</Typography>
                <Typography variant="body2" fontWeight={700}>{pickup.material.specification}</Typography>
              </Box>
            )}
          </Stack>
        </Section>
      )}

      {/* Pickup Location */}
      {pickup.deal && (
        <Section icon={<IconMapPin size={16} color={theme.palette.primary.main} />} title="Pickup Location">
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" fontWeight={600} flex={1}>
              {address || pickup.deal.pickup_location || '—'}
            </Typography>
            {pickup.deal.pickup_location && (
              <Button
                variant="outlined"
                size="small"
                endIcon={<IconNavigation size={14} />}
                component="a"
                href={pickup.deal.pickup_location}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                View on Map
              </Button>
            )}
          </Stack>
          {(pickup.deal.pickup_contact_name || pickup.deal.pickup_contact_number) && (
            <Stack direction="row" spacing={1} mt={1.5}>
              {pickup.deal.pickup_contact_number && (
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  component="a"
                  href={`tel:${pickup.deal.pickup_contact_number}`}
                  startIcon={<IconPhone size={14} />}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {pickup.deal.pickup_contact_name || pickup.deal.pickup_contact_number}
                </Button>
              )}
            </Stack>
          )}
        </Section>
      )}

      {/* Quantity & Condition */}
      <Section icon={<IconBuilding size={16} color={theme.palette.primary.main} />} title="Quantity & Condition">
        <Stack direction="row" spacing={2}>
          <TextField
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!canEdit}
            size="small"
            sx={{ flex: 1 }}
            required
          />
          <TextField
            select
            label="UOM"
            value={uom}
            onChange={(e) => setUom(e.target.value)}
            disabled={!canEdit}
            size="small"
            sx={{ minWidth: 100, maxWidth: 120 }}
          >
            {(uomOptions.length > 0
              ? uomOptions
              : ['kg', 'ton', 'MT', 'liter', 'm3', 'pcs', 'bag', 'drum'].map((v) => ({ value: v, display_name: v }))
            ).map((u) => (
              <MenuItem key={u.value ?? u} value={u.value ?? u}>{u.display_name ?? u}</MenuItem>
            ))}
          </TextField>
          <FormControl size="small" sx={{ minWidth: 130 }} required>
            <InputLabel>Condition</InputLabel>
            <Select
              label="Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              disabled={!canEdit}
            >
              {CONDITIONS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Section>

      {/* Photos */}
      <Section icon={<IconCamera size={16} color={theme.palette.primary.main} />} title="Photos">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="caption" color="text.secondary">
            {existingPhotos.length + newPhotos.length} photo{existingPhotos.length + newPhotos.length !== 1 ? 's' : ''}
          </Typography>
          {canEdit && (
            <Button
              size="small"
              startIcon={<IconCamera size={14} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Add Photos
            </Button>
          )}
        </Stack>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleAddPhotos}
        />
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {existingPhotos.map((photo) => (
            <PhotoThumb key={photo.id} src={apiService.getUploadUrl(photo.imageUrl)} />
          ))}
          {newPhotos.map((photo, idx) => (
            <PhotoThumb key={idx} src={photo.preview} onRemove={() => removeNewPhoto(idx)} />
          ))}
          {canEdit && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 90,
                height: 90,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'text.disabled',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                transition: 'all 0.18s',
              }}
            >
              <IconCamera size={22} />
              <Typography variant="caption" mt={0.5} fontWeight={600}>Add More</Typography>
            </Box>
          )}
        </Stack>
      </Section>

      {/* Remarks */}
      <Section icon={<IconBuilding size={16} color={theme.palette.primary.main} />} title="Remarks">
        <TextField
          multiline
          minRows={3}
          fullWidth
          placeholder="Add remarks about this pickup…"
          value={remarks}
          onChange={(e) => { if (e.target.value.length <= 250) setRemarks(e.target.value); }}
          disabled={!canEdit}
          size="small"
          inputProps={{ maxLength: 250 }}
          helperText={`${remarks.length}/250`}
        />
      </Section>

      {/* Pickup Confirmation */}
      <Section icon={<IconCheck size={16} color={theme.palette.primary.main} />} title="Pickup Confirmation">
        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <Typography variant="caption" color="text.disabled">Picked Up By</Typography>
            <Typography variant="body2" fontWeight={700}>{driverName}</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>Pickup Date & Time</Typography>
            <TextField
              type="datetime-local"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              disabled={!canEdit}
              size="small"
              fullWidth
              inputProps={{ style: { fontSize: '0.82rem' } }}
            />
          </Box>
        </Stack>
      </Section>

      {/* Feedback */}
      {actionErr && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{actionErr}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}

      <Divider sx={{ mb: 2 }} />

      {/* Confirm Pickup / Already collected */}
      {isCompleted ? (
        <Paper
          elevation={0}
          sx={{ p: 2.5, borderRadius: 3, border: '2px solid', borderColor: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05), display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCheck size={22} color="#fff" />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="success.main">Pickup Confirmed</Typography>
            <Typography variant="caption" color="text.secondary">This task has been marked as collected</Typography>
          </Box>
        </Paper>
      ) : (
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          startIcon={acting === 'confirm' ? <CircularProgress size={20} color="inherit" /> : <IconCheck size={22} />}
          disabled={!!acting}
          onClick={handleConfirm}
          sx={{ borderRadius: 3, py: 2, fontWeight: 800, fontSize: '1.05rem', boxShadow: `0 4px 18px ${alpha(theme.palette.success.main, 0.3)}` }}
        >
          {acting === 'confirm' ? 'Saving…' : 'Confirm Pickup'}
          {!acting && (
            <Typography variant="caption" display="block" sx={{ opacity: 0.85, lineHeight: 1, mt: 0.25, fontSize: '0.72rem', fontWeight: 500 }}>
              Update status to "Picked Up"
            </Typography>
          )}
        </Button>
      )}
    </Box>
  );
};

export default DriverPickupTaskView;
