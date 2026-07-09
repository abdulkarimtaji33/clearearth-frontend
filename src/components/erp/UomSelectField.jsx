import React, { useState } from 'react';
import {
  Box, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography, Alert,
} from '@mui/material';
import apiService from '../../services/api';

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/**
 * UOM dropdown with "+ Add New" (LeadForm-style) and create-via-dropdown API.
 */
const UomSelectField = ({
  value = '',
  onChange,
  unitsOfMeasure = [],
  onUnitsChange,
  disabled = false,
  size = 'small',
  fullWidth = true,
  sx,
  minWidth,
}) => {
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState({});

  const handleCreate = async () => {
    const trimmed = displayName.trim();
    const nextErrors = {};
    if (!trimmed) nextErrors.displayName = 'Name is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const slug = slugify(trimmed) || `uom_${Date.now()}`;
    try {
      setSaving(true);
      const res = await apiService.createDropdown({
        category: 'units_of_measure',
        value: slug,
        display_name: trimmed,
      });
      if (res.success && res.data) {
        const created = res.data;
        const next = [...unitsOfMeasure, created].sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0) || String(a.display_name).localeCompare(String(b.display_name)),
        );
        onUnitsChange?.(next);
        onChange?.(created.value);
        setDisplayName('');
        setErrors({});
        setAddOpen(false);
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create unit of measure' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Box position="relative" sx={{ minWidth, ...sx }}>
        <TextField
          size={size}
          select
          fullWidth={fullWidth}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          SelectProps={{
            displayEmpty: true,
            MenuProps: { PaperProps: { style: { maxHeight: 280 } } },
          }}
        >
          <MenuItem value=""><em>Select UOM</em></MenuItem>
          {unitsOfMeasure.map((u) => (
            <MenuItem key={u.id} value={u.value}>{u.display_name}</MenuItem>
          ))}
        </TextField>
        {!disabled && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 12,
              backgroundColor: 'background.paper',
              px: 1,
              zIndex: 1,
            }}
          >
            <Button
              size="small"
              onClick={() => { setErrors({}); setAddOpen(true); }}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 500,
                minWidth: 'auto',
                px: 0.5,
                py: 0,
                color: 'primary.main',
                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
              }}
            >
              + Add New
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
          <Typography variant="h5" fontWeight={700}>Add Unit of Measure</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Create a new UOM and select it for this line item
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {errors.submit && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errors.submit}</Alert>}
          <TextField
            fullWidth
            label="Display name"
            placeholder="e.g. Kilograms (kg)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={Boolean(errors.displayName)}
            helperText={errors.displayName || 'Shown in dropdowns; code is generated automatically'}
            autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => { setAddOpen(false); setDisplayName(''); setErrors({}); }} sx={{ minWidth: 100, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleCreate} sx={{ minWidth: 140, borderRadius: 2 }}>
            {saving ? 'Creating…' : 'Create & Select'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UomSelectField;
