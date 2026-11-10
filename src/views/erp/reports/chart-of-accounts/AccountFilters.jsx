import React from 'react';
import {
  Box, Button, Chip, InputAdornment, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconX, IconListTree, IconList } from '@tabler/icons-react';
import { TYPES, TYPE_META, DEFAULT_FILTERS, fmtMoney, isFiltering } from './coaUtils';

/** Summary cards (one per type, clickable) + sticky filter bar. */
const AccountFilters = ({ accounts, filters, setFilters, view, setView, onExpandAll, onCollapseAll, shown, total }) => {
  const theme = useTheme();
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const summary = TYPES.map((t) => {
    const list = accounts.filter((a) => a.type === t && a.is_active);
    const net = list.filter((a) => !a.is_group).reduce((s, a) => s + (Number(a.balance) || 0), 0);
    return { type: t, count: list.length, net };
  });

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 2 }}>
        {summary.map((s) => {
          const meta = TYPE_META[s.type];
          const main = theme.palette[meta.color].main;
          const active = filters.type === s.type;
          return (
            <Paper
              key={s.type}
              variant="outlined"
              onClick={() => set({ type: active ? 'all' : s.type })}
              sx={{
                p: 1.5, borderRadius: 3, cursor: 'pointer', transition: 'all .15s',
                borderColor: active ? main : 'divider',
                bgcolor: active ? alpha(main, 0.08) : 'background.paper',
                '&:hover': { borderColor: main },
              }}
            >
              <Typography variant="caption" fontWeight={800} sx={{ color: main, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {meta.label}
              </Typography>
              <Typography variant="h5" fontWeight={800}>{s.count}</Typography>
              <Typography variant="caption" color="text.secondary">
                accounts · net AED {fmtMoney(s.net)}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      <Paper
        variant="outlined"
        sx={{ position: 'sticky', top: 0, zIndex: 5, p: 1.5, mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Search code, name, description or parent…"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            sx={{ minWidth: { md: 320 }, flex: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
              endAdornment: filters.q ? (
                <InputAdornment position="end">
                  <IconX size={16} style={{ cursor: 'pointer' }} onClick={() => set({ q: '' })} />
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField select size="small" label="Status" value={filters.status} onChange={(e) => set({ status: e.target.value })} sx={{ minWidth: 120 }}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
          <TextField select size="small" label="Kind" value={filters.kind} onChange={(e) => set({ kind: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="all">Groups and posting</MenuItem>
            <MenuItem value="group">Groups only</MenuItem>
            <MenuItem value="posting">Posting accounts only</MenuItem>
          </TextField>
          <TextField select size="small" label="Balance" value={filters.balance} onChange={(e) => set({ balance: e.target.value })} sx={{ minWidth: 140 }}>
            <MenuItem value="all">Any balance</MenuItem>
            <MenuItem value="with">With a balance</MenuItem>
            <MenuItem value="zero">Zero balance</MenuItem>
          </TextField>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="tree"><IconListTree size={16} />&nbsp;Tree</ToggleButton>
            <ToggleButton value="flat"><IconList size={16} />&nbsp;List</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mt={1.25}>
          <Chip
            size="small"
            label="All types"
            color={filters.type === 'all' ? 'primary' : 'default'}
            variant={filters.type === 'all' ? 'filled' : 'outlined'}
            onClick={() => set({ type: 'all' })}
          />
          {TYPES.map((t) => (
            <Chip
              key={t}
              size="small"
              label={TYPE_META[t].label}
              color={filters.type === t ? TYPE_META[t].color : 'default'}
              variant={filters.type === t ? 'filled' : 'outlined'}
              onClick={() => set({ type: filters.type === t ? 'all' : t })}
            />
          ))}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Showing <strong>{shown}</strong> of {total} accounts
          </Typography>
          {view === 'tree' && (
            <>
              <Button size="small" onClick={onExpandAll}>Expand all</Button>
              <Button size="small" onClick={onCollapseAll}>Collapse all</Button>
            </>
          )}
          {isFiltering(filters) && (
            <Button size="small" color="inherit" startIcon={<IconX size={14} />} onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
              Clear filters
            </Button>
          )}
        </Stack>
      </Paper>
    </>
  );
};

export default AccountFilters;
