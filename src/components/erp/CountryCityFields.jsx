import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, createFilterOptions } from '@mui/material';
import apiService from '../../services/api';

const searchFilter = createFilterOptions({ limit: 200 });
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

/** City picker: loads the cities of the selected country; type to search, or type any city that is not listed. */
export const CityField = ({ country, value, onChange, onBlur, error, helperText }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    if (!country) { setOptions([]); return undefined; }
    setLoading(true);
    apiService.getWorldCities(country)
      .then((r) => { if (active) setOptions(r.success && Array.isArray(r.data) ? r.data.map((o) => o.value) : []); })
      .catch(() => { if (active) setOptions([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [country]);
  return (
    <Autocomplete
      freeSolo
      disabled={!country}
      options={options}
      loading={loading}
      value={value || ''}
      filterOptions={searchFilter}
      onChange={(_, v) => onChange(v || '')}
      onInputChange={(_, v, reason) => { if (reason === 'input') onChange(v); }}
      onBlur={onBlur}
      renderInput={(params) => (
        <TextField
          {...params}
          label="City"
          name="city"
          required
          error={error}
          helperText={helperText}
          placeholder={country ? 'Type to search cities' : 'Select a country first'}
          sx={fieldSx}
        />
      )}
    />
  );
};

/** Searchable country list (all countries); loads itself from the world countries endpoint. */
export const CountryField = ({ value, onChange, onBlur, error, helperText }) => {
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    let active = true;
    apiService.getWorldCountries()
      .then((r) => { if (active && r && r.success && Array.isArray(r.data)) setCountries(r.data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return (
    <Autocomplete
      options={countries}
      getOptionLabel={(o) => o.display_name || ''}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      filterOptions={searchFilter}
      value={countries.find((c) => c.value === value) || (value ? { value, display_name: value } : null)}
      onChange={(_, opt) => onChange(opt ? opt.value : '')}
      onBlur={onBlur}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Country"
          name="country"
          required
          error={error}
          helperText={helperText}
          placeholder="Type to search countries"
          sx={fieldSx}
        />
      )}
    />
  );
};

/**
 * Country + dependent City fields (two grid items). Changing the country clears the city.
 * Props: country, city, onChange(field, value), onBlur, countryError, cityError (strings or falsy), gridSize.
 */
const CountryCityFields = ({
  country, city, onChange, onBlur, countryError, cityError,
  gridSize = { xs: 12, sm: 6 },
}) => (
  <>
    <Grid size={gridSize}>
      <CountryField
        value={country}
        onChange={(v) => { onChange('country', v); onChange('city', ''); }}
        onBlur={onBlur}
        error={Boolean(countryError)}
        helperText={countryError || ' '}
      />
    </Grid>
    <Grid size={gridSize}>
      <CityField
        country={country}
        value={city}
        onChange={(v) => onChange('city', v)}
        onBlur={onBlur}
        error={Boolean(cityError)}
        helperText={cityError || ' '}
      />
    </Grid>
  </>
);

export default CountryCityFields;
