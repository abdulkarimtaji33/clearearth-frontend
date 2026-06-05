import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

const addNewButtonSx = {
  textTransform: 'none',
  fontSize: '0.75rem',
  fontWeight: 500,
  minWidth: 'auto',
  px: 0.5,
  py: 0,
  color: 'primary.main',
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline',
  },
};

/**
 * Select dropdown with "+ Add New" link (matches LeadForm company/contact pattern).
 */
const SelectWithAddNew = ({
  label,
  value,
  onChange,
  options = [],
  allowEmpty = true,
  emptyLabel = 'None',
  addDialogTitle = 'Add new',
  addDialogDescription = '',
  addFieldLabel = 'Name',
  onOptionAdded,
}) => {
  const [addOpen, setAddOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [addError, setAddError] = useState('');

  const allOptions = useMemo(() => {
    const seen = new Set();
    const merged = [];
    options.forEach((o) => {
      const v = typeof o === 'string' ? o : o.value;
      const l = typeof o === 'string' ? o : o.label;
      if (v && !seen.has(v)) {
        seen.add(v);
        merged.push({ value: v, label: l || v });
      }
    });
    if (value && String(value).trim() && !seen.has(value)) {
      merged.push({ value, label: value });
    }
    return merged;
  }, [options, value]);

  const openAddDialog = () => {
    setNewValue('');
    setAddError('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const v = newValue.trim();
    if (!v) {
      setAddError(`${addFieldLabel} is required`);
      return;
    }
    if (allOptions.some((o) => o.value === v)) {
      onChange(v);
      setAddOpen(false);
      return;
    }
    try {
      if (onOptionAdded) {
        await onOptionAdded(v);
      } else {
        onChange(v);
      }
      setAddOpen(false);
      setNewValue('');
      setAddError('');
    } catch (err) {
      setAddError(err.message || 'Failed to add');
    }
  };

  return (
    <>
      <Box position="relative" sx={{ pt: allowEmpty ? 0.5 : 0 }}>
        <FormControl fullWidth size="small">
          <InputLabel shrink={allowEmpty || Boolean(value)}>{label}</InputLabel>
          <Select
            value={value || ''}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            sx={{ borderRadius: 2 }}
            displayEmpty={allowEmpty}
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {emptyLabel}
                  </Typography>
                );
              }
              const match = allOptions.find((o) => o.value === selected);
              return match?.label || selected;
            }}
          >
            {allowEmpty && (
              <MenuItem value="">
                <em>{emptyLabel}</em>
              </MenuItem>
            )}
            {allOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          <Button size="small" onClick={openAddDialog} sx={addNewButtonSx}>
            + Add New
          </Button>
        </Box>
      </Box>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            {addDialogTitle}
          </Typography>
          {addDialogDescription && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {addDialogDescription}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2 }}>
          {addError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setAddError('')}>
              {addError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label={addFieldLabel}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAdd}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SelectWithAddNew;
