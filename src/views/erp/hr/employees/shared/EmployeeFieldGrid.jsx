import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../services/api';
import { inputSx } from '../../components/HrUi';

/** Departments / designations / managers / work locations for the lookup fields. */
export const useEmployeeLookups = (excludeEmployeeId, enabled = true) => {
  const [lookups, setLookups] = useState({ departments: [], designations: [], managers: [], workLocations: [] });
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    Promise.all([
      apiService.getHrDepartments({ pageSize: 200 }),
      apiService.getEmployeeDesignations(),
      apiService.getHrEmployees({ pageSize: 200 }),
      apiService.getEmployeeWorkLocations(),
    ]).then(([dep, des, emp, loc]) => {
      if (cancelled) return;
      setLookups({
        departments: (dep.data || []).map((d) => ({ value: d.id, label: d.name })),
        designations: (des.data || []).map((d) => ({ value: d.id, label: d.display_name })),
        managers: (emp.data || [])
          .filter((e) => String(e.id) !== String(excludeEmployeeId))
          .map((e) => ({ value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() })),
        workLocations: (loc.data || []).map((l) => ({ value: l.id, label: l.name })),
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [excludeEmployeeId, enabled]);
  return lookups;
};

/**
 * Controlled grid of inputs for a list of field definitions (see employeeSections.js).
 * `errors` is a { [key]: message } map used to flag missing required fields.
 */
const EmployeeFieldGrid = ({ fields, values, onChange, lookups = {}, errors = {}, min = 220 }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 2 }}>
      {fields.map((f) => {
        const value = values[f.key] ?? (f.type === 'switch' ? false : '');
        const common = { fullWidth: true, label: f.label, required: f.required, error: !!errors[f.key], helperText: errors[f.key] || '', sx: inputSx };
        if (f.type === 'switch') {
          return (
            <Box key={f.key} sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel control={<Switch checked={!!value} onChange={(e) => onChange(f.key, e.target.checked)} />} label={f.label} />
            </Box>
          );
        }
        if (f.type === 'date') {
          return (
            <DatePicker
              key={f.key}
              label={f.label}
              value={value ? dayjs(value) : null}
              onChange={(nv) => onChange(f.key, nv && nv.isValid() ? nv.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { fullWidth: true, required: f.required, error: !!errors[f.key], helperText: errors[f.key] || '', sx: inputSx } }}
            />
          );
        }
        if (f.type === 'select' || f.type === 'lookup') {
          const options = f.type === 'lookup' ? (lookups[f.lookup] || []) : f.options;
          return (
            <TextField key={f.key} select {...common} value={value} onChange={(e) => onChange(f.key, e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          );
        }
        if (f.type === 'textarea') {
          return (
            <TextField
              key={f.key} {...common} multiline minRows={2} value={value}
              onChange={(e) => onChange(f.key, e.target.value)}
              sx={{ ...inputSx, gridColumn: '1 / -1' }}
            />
          );
        }
        return (
          <TextField
            key={f.key} {...common} type={f.type === 'email' ? 'email' : 'text'} value={value}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        );
      })}
    </Box>
  </LocalizationProvider>
);

export default EmployeeFieldGrid;
