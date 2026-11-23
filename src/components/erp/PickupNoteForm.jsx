import React from 'react';
import { Box, Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export const emptyPickupNote = () => ({
  noteNumber: '', pickupDate: '', vehicleNo: '', referenceNo: '', pickupType: '', serviceType: '', serviceOffered: '',
  customerName: '', customerAddress: '', contactPerson: '', contactNo: '', email: '',
  specialRequest: '', freeNote: '', items: [],
});

/**
 * The paper pick-up note: header details, customer details, item lines (description, unit, weight in kg),
 * special request and a free-text note. The parent keeps the value and sends it when the pickup is confirmed.
 */
const PickupNoteForm = ({ value, onChange, disabled = false }) => {
  const v = value || emptyPickupNote();
  const set = (patch) => onChange({ ...v, ...patch });
  const field = (key, label, extra = {}) => (
    <TextField
      fullWidth size="small" label={label} value={v[key] ?? ''} disabled={disabled}
      onChange={(e) => set({ [key]: e.target.value })} {...extra}
    />
  );
  const items = v.items || [];
  const setItem = (i, patch) => set({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const total = items.reduce((s, it) => s + (Number(it.weightKg) || 0), 0);

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {field('noteNumber', 'Pick-up note no.', { helperText: v.noteNumber ? undefined : 'Assigned automatically when saved' })}
        {field('pickupDate', 'Date of pick up', { type: 'date', InputLabelProps: { shrink: true } })}
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {field('vehicleNo', 'Vehicle no.')}
        {field('referenceNo', 'Reference no.')}
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {field('pickupType', 'Pick-up type', { select: true, children: [
          <MenuItem key="c" value="corporate">Corporate</MenuItem>,
          <MenuItem key="i" value="individual">Individual</MenuItem>,
        ] })}
        {field('serviceType', 'Service type')}
      </Stack>
      {field('serviceOffered', 'Detailed service offered', { multiline: true, rows: 2 })}

      <Typography variant="caption" fontWeight={800} color="primary" sx={{ pt: 1 }}>CUSTOMER DETAILS</Typography>
      {field('customerName', 'Name')}
      {field('customerAddress', 'Address')}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {field('contactPerson', 'Contact person')}
        {field('contactNo', 'Contact no.')}
      </Stack>
      {field('email', 'Email address')}

      <Typography variant="caption" fontWeight={800} color="primary" sx={{ pt: 1 }}>ITEMS</Typography>
      {items.map((it, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ width: 22 }}>{i + 1}</Typography>
          <TextField size="small" label="Item description" value={it.description || ''} disabled={disabled} sx={{ flex: 1 }} onChange={(e) => setItem(i, { description: e.target.value })} />
          <TextField size="small" label="Unit (nos)" value={it.unit || ''} disabled={disabled} sx={{ width: 90 }} onChange={(e) => setItem(i, { unit: e.target.value })} />
          <TextField size="small" label="Weight (kg)" type="number" value={it.weightKg ?? ''} disabled={disabled} sx={{ width: 110 }} onChange={(e) => setItem(i, { weightKg: e.target.value })} />
          {!disabled && (
            <IconButton size="small" onClick={() => set({ items: items.filter((_, idx) => idx !== i) })}><IconTrash size={16} /></IconButton>
          )}
        </Stack>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!disabled ? (
          <Button size="small" startIcon={<IconPlus size={16} />} onClick={() => set({ items: [...items, { description: '', unit: '', weightKg: '' }] })}>Add item</Button>
        ) : <span />}
        <Typography variant="body2" fontWeight={700}>Total: {total.toLocaleString('en-US', { maximumFractionDigits: 3 })} kg</Typography>
      </Box>

      {field('specialRequest', 'Special request', { multiline: true, rows: 2 })}
      {field('freeNote', 'Note', { multiline: true, rows: 3, placeholder: 'Anything else about this pick-up' })}
    </Stack>
  );
};

export default PickupNoteForm;
