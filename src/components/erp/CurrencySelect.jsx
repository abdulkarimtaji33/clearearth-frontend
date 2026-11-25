import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { CURRENCIES } from '../../utils/currency';

const OPTIONS = CURRENCIES.map(([code, name]) => ({ code, name, label: `${code} - ${name}` }));

/**
 * Searchable currency picker with every currency in the list. Type a code or a name ("pkr", "rupee", "dollar").
 * onChange receives an event-like object ({ target: { name, value } }) so it drops into Formik's handleChange
 * and plain state setters exactly like a normal select.
 */
const CurrencySelect = ({
  value, onChange, name = 'currency', label = 'Currency', disabled = false, size, fullWidth = false, sx, error, helperText, required,
}) => {
  const code = String(value || 'AED').toUpperCase();
  const current = OPTIONS.find((o) => o.code === code) || { code, name: '', label: code };
  return (
    <Autocomplete
      options={OPTIONS}
      value={current}
      disableClearable
      autoHighlight
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      // Wide enough for "CODE - Name" wherever it is placed (flex rows used to squeeze it to a few letters),
      // and the open list is as wide as its longest name instead of the input.
      sx={[{ minWidth: 260 }, ...(Array.isArray(sx) ? sx : [sx])]}
      slotProps={{ popper: { style: { width: 'fit-content', minWidth: 320 }, placement: 'bottom-start' } }}
      getOptionLabel={(o) => o.label || ''}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      onChange={(_, v) => { if (v && onChange) onChange({ target: { name, value: v.code } }); }}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} error={error} helperText={helperText} />
      )}
    />
  );
};

export default CurrencySelect;
