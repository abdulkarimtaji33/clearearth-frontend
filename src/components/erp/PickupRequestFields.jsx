import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Stack, Typography, TextField, ToggleButtonGroup, ToggleButton, Switch, Chip,
  Grid, MenuItem, CircularProgress, Alert, Paper, Button, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconUser, IconCalendarEvent, IconPackage, IconTruck, IconChecklist, IconCertificate, IconNotes, IconPhoto, IconX,
} from '@tabler/icons-react';
import apiService from '../../services/api';

export const TRUCKS = [
  ['1_ton', '1 ton'], ['3_ton', '3 ton'], ['10_ton', '10 ton'], ['trailer', 'Trailer'],
  ['reefer', 'Reefer'], ['lowbed_trailer', 'Lowbed trailer'],
];
export const CERTIFICATES = [
  ['green_certificate', 'Green certificate'],
  ['destruction_report_evidence', 'Destruction report with evidence'],
  ['certificate_of_destruction', 'Certificate of destruction'],
  ['certificate_of_appreciation', 'Certificate of appreciation'],
  ['certificate_of_data_destruction', 'Certificate of data destruction'],
  ['carbon_footprint', 'Carbon footprint'],
];

const REQUIRED = [
  ['companyName', 'Company name'], ['contactPerson', 'Contact person'], ['contactPhone', 'Contact number'],
  ['requestDate', 'Date'], ['requestTime', 'Time'], ['locationType', 'Location'], ['serviceType', 'Service type'],
  ['materialType', 'Type of material'], ['totalWeight', 'Total weight / quantity'], ['packingType', 'Packing type'],
  ['requestedBy', 'Requested by'],
];

/** Missing required fields of a request, as a list of labels. */
export const missingPickupRequestFields = (v) => {
  if (!v) return [];
  const out = REQUIRED.filter(([k]) => !String(v[k] ?? '').trim()).map(([, l]) => l);
  if (!(v.truckRequired || []).length) out.push('Truck required');
  const yn = { laborRequired: 'Labor required', pickupNoteRequired: 'Pick up note requirement', grnRequired: 'GRN requirement' };
  Object.keys(yn).forEach((k) => {
    if (v[k] === null || v[k] === undefined) out.push(yn[k]);
  });
  return out;
};

const Card = ({ icon, title, children }) => {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
      <Stack
        direction="row" alignItems="center" spacing={1}
        sx={{ px: 2, py: 1.1, bgcolor: alpha(theme.palette.primary.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
};

const Choice = ({ label, value, onChange, required, options }) => (
  <Box>
    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {label}{required ? ' *' : ''}
    </Typography>
    <ToggleButtonGroup
      exclusive size="small" color="primary" fullWidth
      value={value === true ? 'yes' : value === false ? 'no' : value ?? ''}
      onChange={(_, v) => v !== null && onChange(options ? v : v === 'yes')}
      sx={{ '& .MuiToggleButton-root': { py: 0.6, textTransform: 'none', fontWeight: 600 } }}
    >
      {(options || [['yes', 'Yes'], ['no', 'No']]).map(([k, l]) => <ToggleButton key={k} value={k}>{l}</ToggleButton>)}
    </ToggleButtonGroup>
  </Box>
);

const ChipPicker = ({ label, required, items, selected, onToggle }) => (
  <Box>
    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
      {label}{required ? ' *' : ''}
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {items.map(([k, l]) => {
        const on = selected.includes(k);
        return (
          <Chip
            key={k} label={l} clickable onClick={() => onToggle(k)}
            color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        );
      })}
    </Box>
  </Box>
);

/**
 * Structured pickup / delivery request, pre-filled from the deal. Sales switches it on while approving a
 * quotation or purchase order; the filled request is sent with the approval and operations see it afterwards.
 */
const PickupRequestFields = ({ sourceType, sourceId, enabled, onEnabledChange, value, onChange }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadDefaults = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiService.getPickupRequestPrefill(sourceType, sourceId);
      onChange(res?.data || res);
    } catch (e) {
      setLoadError(e.message || 'Could not load the details to pre-fill');
      onChange({ requestType: 'pickup', truckRequired: [], certificates: [] });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, sourceId]);

  // A pickup / delivery request is always part of approving (there is no longer an on/off switch).
  useEffect(() => {
    if (!enabled) onEnabledChange?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    try {
      const added = [];
      for (const f of files) {
        const res = await apiService.uploadDealImage(f);
        const url = res?.data?.url;
        if (url) added.push({ url, name: f.name });
      }
      set({ photos: [...(value?.photos || []), ...added] });
    } catch (e) {
      setUploadError(e.message || 'Could not upload the photo');
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (url) => set({ photos: (value?.photos || []).filter((p) => p.url !== url) });

  useEffect(() => {
    if (enabled && !value) loadDefaults();
  }, [enabled, value, loadDefaults]);

  const set = (patch) => onChange({ ...(value || {}), ...patch });
  const toggleIn = (key, item) => {
    const cur = value?.[key] || [];
    set({ [key]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] });
  };
  const text = (key, label, extra = {}) => (
    <TextField
      fullWidth size="small" label={label} value={value?.[key] ?? ''}
      onChange={(e) => set({ [key]: e.target.value })}
      InputLabelProps={{ shrink: true }}
      {...extra}
    />
  );
  const type = value?.requestType === 'delivery' ? 'delivery' : 'pickup';
  const noun = type === 'delivery' ? 'Delivery' : 'Pick up';
  const missing = enabled && value ? missingPickupRequestFields(value) : [];

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          px: 2, py: 1.25, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderColor: enabled ? 'primary.main' : 'divider', bgcolor: enabled ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <IconTruck size={22} color={theme.palette.primary.main} />
          <Box>
            <Typography fontWeight={800}>Schedule the pickup or delivery with operations</Typography>
            <Typography variant="caption" color="text.secondary">Required before approval. One request per deal; most details are filled in from the deal.</Typography>
          </Box>
        </Stack>
      </Paper>

      {enabled && (
        <Box sx={{ mt: 1.5 }}>
          {loading || !value ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={26} /></Box>
          ) : (
            <Stack spacing={1.75}>
              {loadError && <Alert severity="warning">{loadError}</Alert>}
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <ToggleButtonGroup
                  exclusive size="small" color="primary" value={type}
                  onChange={(_, v) => v && set({ requestType: v })}
                >
                  <ToggleButton value="pickup" sx={{ px: 3, fontWeight: 700 }}>Pickup</ToggleButton>
                  <ToggleButton value="delivery" sx={{ px: 3, fontWeight: 700 }}>Delivery</ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="subtitle1" fontWeight={800} color="primary">{noun.toUpperCase()} REQUEST</Typography>
              </Stack>

              <Card icon={<IconUser size={18} />} title="Customer and contact">
                <Grid container spacing={1.75}>
                  <Grid size={{ xs: 12, sm: 6 }} >{text('companyName', 'Company name *')}</Grid>
                  <Grid size={{ xs: 12, sm: 6 }} >{text('contactPerson', 'Contact person *')}</Grid>
                  <Grid size={{ xs: 12, sm: 6 }} >{text('contactPhone', 'Contact no. *')}</Grid>
                  <Grid size={{ xs: 12, sm: 6 }} >{text('contactEmail', 'Email')}</Grid>
                </Grid>
              </Card>

              <Card icon={<IconCalendarEvent size={18} />} title={`When and where`}>
                <Grid container spacing={1.75}>
                  <Grid size={{ xs: 6, sm: 3 }} >{text('requestDate', 'Date *', { type: 'date' })}</Grid>
                  <Grid size={{ xs: 6, sm: 3 }} >{text('requestTime', 'Time *', { type: 'time' })}</Grid>
                  <Grid size={{ xs: 12, sm: 6 }} >
                    {text('locationType', 'Location *', { select: true, children: [
                      <MenuItem key="m" value="main_land">Main land</MenuItem>,
                      <MenuItem key="f" value="free_zone">Free zone</MenuItem>,
                    ] })}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }} >{text('locationAddress', `${noun} address or map link`)}</Grid>
                  <Grid size={{ xs: 12, sm: 4 }} >
                    <Choice label="Gate pass requirement" value={value.gatePassRequired} onChange={(v) => set({ gatePassRequired: v })} />
                  </Grid>
                </Grid>
              </Card>

              <Card icon={<IconPackage size={18} />} title="Material">
                <Grid container spacing={1.75}>
                  <Grid size={{ xs: 12, sm: 4 }} >
                    {text('serviceType', 'Service type *', { select: true, children: [
                      <MenuItem key="s" value="service">Service</MenuItem>,
                      <MenuItem key="p" value="purchase">Purchase</MenuItem>,
                      <MenuItem key="f" value="free_of_charge">Free of charge</MenuItem>,
                    ] })}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }} >{text('materialType', 'Type of material *')}</Grid>
                  <Grid size={{ xs: 12, sm: 3 }} >{text('totalWeight', 'Total weight / qty *')}</Grid>
                  <Grid size={{ xs: 12, sm: 4 }} >
                    {text('packingType', 'Packing type *', { select: true, children: [
                      <MenuItem key="u" value="unpacked">Unpacked</MenuItem>,
                      <MenuItem key="p" value="packed">Packed</MenuItem>,
                      <MenuItem key="l" value="palletized">Palletized</MenuItem>,
                    ] })}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }} >{text('wdsNumber', 'WDS no. (if applicable)')}</Grid>
                  <Grid size={{ xs: 12, sm: 4 }} >
                    {text('wdsFoodType', 'WDS type', { select: true, children: [
                      <MenuItem key="n" value="">Not applicable</MenuItem>,
                      <MenuItem key="f" value="food">Food</MenuItem>,
                      <MenuItem key="nf" value="non_food">Non food</MenuItem>,
                    ] })}
                  </Grid>
                </Grid>
              </Card>

              <Card icon={<IconTruck size={18} />} title="Vehicle and labor">
                <Stack spacing={1.75}>
                  <ChipPicker label="Truck required" required items={TRUCKS} selected={value.truckRequired || []} onToggle={(k) => toggleIn('truckRequired', k)} />
                  <Grid container spacing={1.75} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 4 }} >
                      <Choice label="Labor required" required value={value.laborRequired} onChange={(v) => set({ laborRequired: v, laborCount: v ? value.laborCount : null })} />
                    </Grid>
                    {value.laborRequired === true && (
                      <Grid size={{ xs: 6, sm: 3 }} >{text('laborCount', 'How many', { type: 'number' })}</Grid>
                    )}
                  </Grid>
                </Stack>
              </Card>

              <Card icon={<IconChecklist size={18} />} title="Requirements">
                <Grid container spacing={1.75}>
                  <Grid size={{ xs: 12, sm: 4 }} ><Choice label="DM inspection required" value={value.dmInspectionRequired} onChange={(v) => set({ dmInspectionRequired: v })} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }} ><Choice label="Pick up note requirement" required value={value.pickupNoteRequired} onChange={(v) => set({ pickupNoteRequired: v })} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }} ><Choice label="GRN requirement" required value={value.grnRequired} onChange={(v) => set({ grnRequired: v })} /></Grid>
                </Grid>
              </Card>

              <Card icon={<IconCertificate size={18} />} title="Certificates">
                <ChipPicker label="Certificate required (leave empty if none)" items={CERTIFICATES} selected={value.certificates || []} onToggle={(k) => toggleIn('certificates', k)} />
              </Card>

              <Card icon={<IconPhoto size={18} />} title="Photos">
                <Stack spacing={1.25}>
                  <Box>
                    <Button component="label" variant="outlined" size="small" disabled={uploading} startIcon={uploading ? <CircularProgress size={14} /> : <IconPhoto size={16} />}>
                      {uploading ? 'Uploading…' : 'Attach photos'}
                      <input hidden type="file" accept="image/*" multiple onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                    </Button>
                  </Box>
                  {uploadError && <Alert severity="error" sx={{ borderRadius: 2 }}>{uploadError}</Alert>}
                  {(value.photos || []).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {value.photos.map((p) => (
                        <Box key={p.url} sx={{ position: 'relative', width: 92, height: 92, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          <a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={p.name || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></a>
                          <IconButton size="small" onClick={() => removePhoto(p.url)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.9)', p: 0.25 }}><IconX size={14} /></IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Card>

              <Card icon={<IconNotes size={18} />} title="Notes">
                <Grid container spacing={1.75}>
                  <Grid size={{ xs: 12 }} >{text('additionalNotes', 'Additional notes', { multiline: true, rows: 2 })}</Grid>
                  <Grid size={{ xs: 12, sm: 6 }} >{text('requestedBy', 'Requested by *')}</Grid>
                </Grid>
              </Card>

              {missing.length > 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Still needed: {missing.join(', ')}
                </Alert>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PickupRequestFields;
