import React, { useState } from 'react';
import { Stack, ToggleButtonGroup, ToggleButton, TextField, Button, Popover, Box, Typography } from '@mui/material';
import { IconCalendar } from '@tabler/icons-react';

export const RANGE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: '3months', label: '3 months' },
  { key: '6months', label: '6 months' },
  { key: 'year', label: 'This year' },
];

/** Default: this month. */
export const DEFAULT_RANGE = { period: 'month', dateFrom: '', dateTo: '' };

/** Query params for the dashboard API. */
export const rangeToParams = (r) => (
  r.period === 'custom' ? { period: 'custom', dateFrom: r.dateFrom, dateTo: r.dateTo } : { period: r.period }
);

const ymd = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Mirrors the backend so widgets that query other APIs (HR) use the same dates. */
export const rangeToDates = (r) => {
  const now = new Date();
  const today = ymd(now);
  switch (r.period) {
    case 'today': return { from: today, to: today };
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return { from: ymd(d), to: today };
    }
    case 'last_month':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case '3months': return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: today };
    case '6months': return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: today };
    case 'year': return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: today };
    case 'custom': return { from: r.dateFrom, to: r.dateTo };
    default: return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
};

/** One date filter for the whole dashboard: quick tabs + custom range. */
const DateRangeFilter = ({ value, onChange }) => {
  const [anchor, setAnchor] = useState(null);
  const [draft, setDraft] = useState({ from: '', to: '' });
  const isCustom = value.period === 'custom';

  const openCustom = (e) => {
    const d = rangeToDates(value);
    setDraft({ from: d.from || '', to: d.to || '' });
    setAnchor(e.currentTarget);
  };
  const applyCustom = () => {
    if (!draft.from || !draft.to) return;
    onChange({ period: 'custom', dateFrom: draft.from, dateTo: draft.to });
    setAnchor(null);
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={isCustom ? null : value.period}
        onChange={(_, v) => v && onChange({ period: v, dateFrom: '', dateTo: '' })}
        sx={{
          flexWrap: 'wrap',
          '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.6, fontSize: '0.8rem' },
        }}
      >
        {RANGE_PRESETS.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
      </ToggleButtonGroup>
      <Button
        size="small"
        variant={isCustom ? 'contained' : 'outlined'}
        color={isCustom ? 'primary' : 'inherit'}
        startIcon={<IconCalendar size={15} />}
        onClick={openCustom}
        sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
      >
        {isCustom ? `${value.dateFrom} → ${value.dateTo}` : 'Custom'}
      </Button>
      <Popover open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Custom range</Typography>
          <Stack spacing={1.5}>
            <TextField size="small" type="date" label="From" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="To" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" onClick={applyCustom} disabled={!draft.from || !draft.to}>Apply</Button>
          </Stack>
        </Box>
      </Popover>
    </Stack>
  );
};

export default DateRangeFilter;
