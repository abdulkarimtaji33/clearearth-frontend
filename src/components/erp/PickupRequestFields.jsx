import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Stack, Typography, TextField, ToggleButtonGroup, ToggleButton, FormControlLabel, Checkbox, Switch,
  RadioGroup, Radio, FormControl, FormLabel, Grid, MenuItem, CircularProgress, Alert,
} from '@mui/material';
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
  ['laborRequired', 'pickupNoteRequired', 'grnRequired'].forEach((k) => {
    if (v[k] === null || v[k] === undefined) out.push({ laborRequired: 'Labor required', pickupNoteRequired: 'Pick up note requirement', grnRequired: 'GRN requirement' }[k]);
  });
  return out;
};

const YesNo = ({ label, value, onChange, required }) => (
  <FormControl>
    <FormLabel sx={{ fontSize: 13 }}>{label}{required ? ' *' : ''}</FormLabel>
    <RadioGroup row value={value === true ? 'yes' : value === false ? 'no' : ''} onChange={(e) => onChange(e.target.value === 'yes')}>
      <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
      <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
    </RadioGroup>
  </FormControl>
);

/**
 * Structured pickup / delivery request, pre-filled from the deal. Sales switches it on while approving a
 * quotation or purchase order; the filled request is sent with the approval and operations see it afterwards.
 */
const PickupRequestFields = ({ sourceType, sourceId, enabled, onEnabledChange, value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

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
      onChange={(e) => set({ [key]: e.target.value })} {...extra}
    />
  );
  const type = value?.requestType === 'delivery' ? 'delivery' : 'pickup';
  const noun = type === 'delivery' ? 'Delivery' : 'Pick up';

  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={<Switch checked={!!enabled} onChange={(e) => onEnabledChange(e.target.checked)} />}
        label={<Typography fontWeight={700}>Schedule a pickup or delivery with operations</Typography>}
      />
      {enabled && (
        <Box sx={{ mt: 1.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loading || !value ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
          ) : (
            <Stack spacing={2}>
              {loadError && <Alert severity="warning">{loadError}</Alert>}
              <ToggleButtonGroup
                exclusive size="small" color="primary" value={type}
                onChange={(_, v) => v && set({ requestType: v })}
              >
                <ToggleButton value="pickup" sx={{ px: 3 }}>Pickup</ToggleButton>
                <ToggleButton value="delivery" sx={{ px: 3 }}>Delivery</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="subtitle2" fontWeight={800} color="primary">{noun.toUpperCase()} REQUEST</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>{text('companyName', 'Company name *')}</Grid>
                <Grid item xs={12} sm={6}>{text('contactPerson', 'Contact person *')}</Grid>
                <Grid item xs={12} sm={6}>{text('contactPhone', 'Contact no. *')}</Grid>
                <Grid item xs={12} sm={6}>{text('contactEmail', 'Email')}</Grid>
                <Grid item xs={6} sm={3}>{text('requestDate', 'Date *', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
                <Grid item xs={6} sm={3}>{text('requestTime', 'Time *', { type: 'time', InputLabelProps: { shrink: true } })}</Grid>
                <Grid item xs={12} sm={6}>
                  {text('locationType', 'Location *', { select: true, children: [
                    <MenuItem key="m" value="main_land">Main land</MenuItem>,
                    <MenuItem key="f" value="free_zone">Free zone</MenuItem>,
                  ] })}
                </Grid>
                <Grid item xs={12}>{text('locationAddress', `${noun} address or map link`)}</Grid>
                <Grid item xs={12} sm={6}><YesNo label="Gate pass requirement" value={value.gatePassRequired} onChange={(v) => set({ gatePassRequired: v })} /></Grid>
                <Grid item xs={12} sm={6}>
                  {text('serviceType', 'Service type *', { select: true, children: [
                    <MenuItem key="s" value="service">Service</MenuItem>,
                    <MenuItem key="p" value="purchase">Purchase</MenuItem>,
                    <MenuItem key="f" value="free_of_charge">Free of charge</MenuItem>,
                  ] })}
                </Grid>
                <Grid item xs={12} sm={7}>{text('materialType', 'Type of material *')}</Grid>
                <Grid item xs={12} sm={5}>{text('totalWeight', 'Total weight / quantity *')}</Grid>
              </Grid>
              <Box>
                <Typography variant="body2" fontWeight={600}>Truck required *</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2 }}>
                  {TRUCKS.map(([k, l]) => (
                    <FormControlLabel key={k} label={l} control={<Checkbox size="small" checked={(value.truckRequired || []).includes(k)} onChange={() => toggleIn('truckRequired', k)} />} />
                  ))}
                </Box>
              </Box>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  {text('packingType', 'Packing type *', { select: true, children: [
                    <MenuItem key="u" value="unpacked">Unpacked</MenuItem>,
                    <MenuItem key="p" value="packed">Packed</MenuItem>,
                    <MenuItem key="l" value="palletized">Palletized</MenuItem>,
                  ] })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <YesNo label="Labor required" required value={value.laborRequired} onChange={(v) => set({ laborRequired: v, laborCount: v ? value.laborCount : null })} />
                    {value.laborRequired === true && (
                      <TextField size="small" type="number" label="How many" sx={{ width: 110 }} value={value.laborCount ?? ''} onChange={(e) => set({ laborCount: e.target.value })} />
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={4}>{text('wdsNumber', 'WDS no. (if applicable)')}</Grid>
                <Grid item xs={12} sm={4}>
                  {text('wdsFoodType', 'WDS type', { select: true, children: [
                    <MenuItem key="n" value="">None</MenuItem>,
                    <MenuItem key="f" value="food">Food</MenuItem>,
                    <MenuItem key="nf" value="non_food">Non food</MenuItem>,
                  ] })}
                </Grid>
                <Grid item xs={12} sm={4}><YesNo label="DM inspection required" value={value.dmInspectionRequired} onChange={(v) => set({ dmInspectionRequired: v })} /></Grid>
                <Grid item xs={12} sm={6}><YesNo label="Pick up note requirement" required value={value.pickupNoteRequired} onChange={(v) => set({ pickupNoteRequired: v })} /></Grid>
                <Grid item xs={12} sm={6}><YesNo label="GRN requirement" required value={value.grnRequired} onChange={(v) => set({ grnRequired: v })} /></Grid>
              </Grid>
              <Box>
                <Typography variant="body2" fontWeight={600}>Certificate required</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2 }}>
                  {CERTIFICATES.map(([k, l]) => (
                    <FormControlLabel key={k} label={l} control={<Checkbox size="small" checked={(value.certificates || []).includes(k)} onChange={() => toggleIn('certificates', k)} />} />
                  ))}
                </Box>
              </Box>
              {text('additionalNotes', 'Additional notes', { multiline: true, rows: 2 })}
              {text('requestedBy', 'Requested by *')}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PickupRequestFields;
