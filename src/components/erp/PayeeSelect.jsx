import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBuildingStore, IconUsers, IconHistory } from '@tabler/icons-react';
import apiService from '../../services/api';
import { PAID_TO_STORAGE_KEY, loadStoredOptions, saveStoredOptions } from '../../constants/expenseFormOptions';

/** Remember a typed payee so it shows up in the list next time. */
export const rememberPayee = (name) => {
  const n = String(name || '').trim();
  if (!n) return;
  try {
    const prev = loadStoredOptions(PAID_TO_STORAGE_KEY);
    if (!prev.includes(n)) saveStoredOptions(PAID_TO_STORAGE_KEY, [...prev, n]);
  } catch {
    /* storage unavailable: the payee is still saved on the expense */
  }
};

const GROUP_STYLE = {
  Vendors: { Icon: IconBuildingStore, color: 'primary' },
  Employees: { Icon: IconUsers, color: 'success' },
  'Other payees': { Icon: IconHistory, color: 'warning' },
};

/**
 * "Paid to" picker. Open list: vendors, employees and previously used payees, searchable by typing,
 * and accounts can also type any other name. `preferVendors` puts vendors first (e.g. fuel is paid
 * against a vendor); otherwise employees come first (salaries, operational costs).
 */
const PayeeSelect = ({ value, onChange, label = 'Paid to', required = false, preferVendors = false, helperText, size = 'small' }) => {
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    let alive = true;
    const unwrap = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.items || res?.data?.employees || []);
    Promise.allSettled([
      apiService.getSuppliers({ page: 1, pageSize: 1000 }),
      apiService.getHrEmployees({ page: 1, pageSize: 1000 }),
    ]).then(([s, e]) => {
      if (!alive) return;
      if (s.status === 'fulfilled') setVendors(unwrap(s.value));
      if (e.status === 'fulfilled') setEmployees(unwrap(e.value));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const options = useMemo(() => {
    const seen = new Set();
    const push = (list, group, name) => {
      const n = String(name || '').trim();
      if (!n || seen.has(n.toLowerCase())) return;
      seen.add(n.toLowerCase());
      list.push({ label: n, group });
    };
    const v = [];
    vendors.forEach((x) => push(v, 'Vendors', x.company_name));
    const emp = [];
    employees.forEach((x) => push(emp, 'Employees', [x.first_name, x.last_name].filter(Boolean).join(' ')));
    const recent = [];
    loadStoredOptions(PAID_TO_STORAGE_KEY).forEach((x) => push(recent, 'Other payees', x));
    const byName = (a, b) => a.label.localeCompare(b.label);
    v.sort(byName);
    emp.sort(byName);
    recent.sort(byName);
    return preferVendors ? [...v, ...emp, ...recent] : [...emp, ...v, ...recent];
  }, [vendors, employees, preferVendors]);

  return (
    <Autocomplete
      freeSolo
      size={size}
      options={options}
      groupBy={(o) => o.group}
      renderGroup={(params) => {
        const { Icon, color } = GROUP_STYLE[params.group] || { Icon: IconHistory, color: 'primary' };
        const main = theme.palette[color].main;
        const count = React.Children.count(params.children);
        return (
          <li key={params.key}>
            <Box
              sx={{
                position: 'sticky',
                top: -8,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                bgcolor: alpha(main, 0.1),
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: alpha(main, 0.25),
                color: main,
                backdropFilter: 'blur(4px)',
              }}
            >
              <Icon size={16} />
              <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {params.group}
              </Typography>
              <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.8, fontWeight: 700 }}>
                {count}
              </Typography>
            </Box>
            <Box component="ul" sx={{ p: 0, m: 0, '& .MuiAutocomplete-option': { pl: 4 } }}>{params.children}</Box>
          </li>
        );
      }}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
      inputValue={value || ''}
      onInputChange={(_, v) => onChange(v)}
      onChange={(_, v) => onChange(typeof v === 'string' ? v : v?.label || '')}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          label={label}
          placeholder="Search or type a name…"
          helperText={helperText || (preferVendors ? 'Pick a vendor, or type another payee' : 'Pick an employee or vendor, or type another payee')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}
    />
  );
};

export default PayeeSelect;
