import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import apiService from '../../services/api';

/**
 * "Paid to" picker: real vendors (suppliers) only, searchable by typing.
 * `value` / `onChange` carry the vendor's name; new vendors are added under Clients & Vendors.
 */
const VendorSelect = ({ value, onChange, label = 'Paid to (vendor)', required = false, helperText, size = 'small' }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiService
      .getSuppliers({ page: 1, pageSize: 1000 })
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setVendors(rows);
      })
      .catch(() => alive && setVendors([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const names = useMemo(
    () => [...new Set(vendors.map((v) => (v.company_name || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [vendors]
  );

  return (
    <Autocomplete
      size={size}
      options={names}
      value={value || null}
      onChange={(_, v) => onChange(v || '')}
      loading={loading}
      noOptionsText="No vendor found — add it under Clients & Vendors first"
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          label={label}
          placeholder="Search vendors…"
          helperText={helperText || 'Vendors only'}
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

export default VendorSelect;
