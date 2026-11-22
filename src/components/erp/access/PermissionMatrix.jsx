import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  InputAdornment,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconAlertTriangle, IconChevronDown, IconSearch, IconX } from '@tabler/icons-react';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);

/** Build the rows of a module: one row per category (or one for the module itself). */
const buildRows = (mod, standardActions) => {
  const map = new Map();
  mod.permissions.forEach((p) => {
    const key = p.category || '_';
    if (!map.has(key)) map.set(key, { key, label: key === '_' ? mod.label : cap(key), std: {}, specials: [] });
    const row = map.get(key);
    if (standardActions.includes(p.action) && !p.name.endsWith('.manage')) row.std[p.action] = p;
    else row.specials.push(p);
  });
  return [...map.values()];
};

/**
 * Permission matrix: modules as accordions; rows × (View / Create / Edit / Delete / Approve) + special actions.
 * Props:
 *  catalog   - response of GET /roles/catalog
 *  selected  - Set<string> of permission names
 *  original  - Set<string> (optional) used to highlight unsaved changes
 *  onChange  - (Set<string>) => void
 *  readOnly  - boolean
 *  inherited - Set<string> (optional) permissions that are on because of the role (user-override view)
 */
const PermissionMatrix = ({ catalog, selected, original, onChange, readOnly = false }) => {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all'); // all | granted | dangerous | changed
  const [expanded, setExpanded] = useState({});

  const standardActions = catalog?.standardActions || ['read', 'create', 'update', 'delete', 'approve'];
  const actionLabels = catalog?.actionLabels || {};

  const modules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (catalog?.modules || [])
      .map((m) => {
        const perms = m.permissions.filter((p) => {
          if (q && !`${p.label} ${p.name} ${p.description || ''} ${m.label}`.toLowerCase().includes(q)) return false;
          if (view === 'granted' && !selected.has(p.name)) return false;
          if (view === 'dangerous' && !p.danger) return false;
          if (view === 'changed' && original && selected.has(p.name) === original.has(p.name)) return false;
          return true;
        });
        return { ...m, permissions: perms };
      })
      .filter((m) => m.permissions.length > 0);
  }, [catalog, search, view, selected, original]);

  const total = catalog?.totalPermissions || 0;
  const grantedCount = [...selected].filter((n) => (catalog?.modules || []).some((m) => m.permissions.some((p) => p.name === n))).length;

  const apply = (fn) => {
    if (readOnly) return;
    const next = new Set(selected);
    fn(next);
    onChange(next);
  };

  const toggle = (perm, row) =>
    apply((next) => {
      if (next.has(perm.name)) {
        next.delete(perm.name);
        // Removing View removes the other standard actions of the same row
        if (row && perm.action === 'read') Object.values(row.std).forEach((p) => next.delete(p.name));
      } else {
        next.add(perm.name);
        // Create / Edit / Delete / Approve need View
        if (row && perm.action !== 'read' && row.std.read) next.add(row.std.read.name);
      }
    });

  const toggleRow = (row) =>
    apply((next) => {
      const all = [...Object.values(row.std), ...row.specials];
      const everyOn = all.every((p) => next.has(p.name));
      all.forEach((p) => (everyOn ? next.delete(p.name) : next.add(p.name)));
    });

  const toggleColumn = (rows, action) =>
    apply((next) => {
      const perms = rows.map((r) => r.std[action]).filter(Boolean);
      const everyOn = perms.every((p) => next.has(p.name));
      perms.forEach((p) => {
        if (everyOn) next.delete(p.name);
        else {
          next.add(p.name);
          const row = rows.find((r) => r.std[action] === p);
          if (action !== 'read' && row?.std.read) next.add(row.std.read.name);
        }
      });
    });

  const toggleModule = (mod, on) =>
    apply((next) => mod.permissions.forEach((p) => (on ? next.add(p.name) : next.delete(p.name))));

  const presetViewOnly = () =>
    apply((next) => {
      next.clear();
      (catalog?.modules || []).forEach((m) => m.permissions.forEach((p) => { if (p.action === 'read') next.add(p.name); }));
    });

  const changeMark = (perm) => {
    if (!original) return {};
    const was = original.has(perm.name);
    const now = selected.has(perm.name);
    if (was === now) return {};
    return { outline: '2px solid', outlineColor: now ? 'success.main' : 'error.main', borderRadius: 1 };
  };

  const renderCheck = (perm, row) => {
    if (!perm) return <Typography color="text.disabled" variant="body2">–</Typography>;
    return (
      <Tooltip title={`${perm.label}${perm.description ? ` — ${perm.description}` : ''}`} arrow placement="top">
        <Box component="span" sx={{ display: 'inline-flex', ...changeMark(perm) }}>
          <Checkbox
            size="small"
            checked={selected.has(perm.name)}
            disabled={readOnly}
            onChange={() => toggle(perm, row)}
            color={perm.danger ? 'warning' : 'primary'}
          />
        </Box>
      </Tooltip>
    );
  };

  const renderModule = (mod) => {
    const rows = buildRows(mod, standardActions);
    const hasMatrix = rows.some((r) => Object.keys(r.std).length > 0);
    const selCount = mod.permissions.filter((p) => selected.has(p.name)).length;
    const allOn = selCount === mod.permissions.length;
    const isOpen = expanded[mod.key] ?? (search.trim() !== '' || view !== 'all');
    const origModule = (catalog.modules.find((m) => m.key === mod.key) || mod).permissions;

    return (
      <Accordion
        key={mod.key}
        expanded={isOpen}
        onChange={(_, v) => setExpanded((e) => ({ ...e, [mod.key]: v }))}
        disableGutters
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 1.5, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700}>{mod.label}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{mod.description}</Typography>
            </Box>
            <Box sx={{ width: 90, display: { xs: 'none', sm: 'block' } }}>
              <LinearProgress variant="determinate" value={(selCount / Math.max(origModule.length, 1)) * 100} sx={{ height: 6, borderRadius: 3 }} />
            </Box>
            <Chip size="small" label={`${selCount}/${origModule.length}`} color={selCount === 0 ? 'default' : allOn ? 'success' : 'primary'} variant={selCount === 0 ? 'outlined' : 'filled'} />
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {!readOnly && (
            <Stack direction="row" spacing={1} mb={1}>
              <Button size="small" onClick={() => toggleModule(mod, true)}>Allow everything</Button>
              <Button size="small" color="inherit" onClick={() => toggleModule(mod, false)}>Clear</Button>
            </Stack>
          )}
          {hasMatrix ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '24%' }}>Area</TableCell>
                    {standardActions.map((a) => (
                      <TableCell key={a} align="center" sx={{ fontWeight: 700 }}>
                        <Tooltip title={readOnly ? '' : `Toggle "${actionLabels[a] || a}" for the whole module`}>
                          <Box component="span" onClick={() => !readOnly && toggleColumn(rows, a)} sx={{ cursor: readOnly ? 'default' : 'pointer', userSelect: 'none' }}>
                            {actionLabels[a] || cap(a)}
                          </Box>
                        </Tooltip>
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 700 }}>Special actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key} hover>
                      <TableCell>
                        <Tooltip title={readOnly ? '' : 'Click to toggle every action in this row'}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            onClick={() => !readOnly && toggleRow(row)}
                            sx={{ cursor: readOnly ? 'default' : 'pointer' }}
                          >
                            {row.label}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      {standardActions.map((a) => (
                        <TableCell key={a} align="center" sx={{ py: 0.25 }}>{renderCheck(row.std[a], row)}</TableCell>
                      ))}
                      <TableCell>
                        <Stack direction="row" gap={0.75} flexWrap="wrap">
                          {row.specials.length === 0 && <Typography color="text.disabled" variant="body2">–</Typography>}
                          {row.specials.map((p) => (
                            <Tooltip key={p.name} title={p.description || p.label} arrow>
                              <Chip
                                size="small"
                                label={p.label}
                                icon={p.danger ? <IconAlertTriangle size={14} /> : undefined}
                                color={selected.has(p.name) ? (p.danger ? 'warning' : 'primary') : 'default'}
                                variant={selected.has(p.name) ? 'filled' : 'outlined'}
                                onClick={readOnly ? undefined : () => toggle(p, row)}
                                sx={{ ...changeMark(p) }}
                              />
                            </Tooltip>
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {mod.permissions.map((p) => (
                <Stack key={p.name} direction="row" alignItems="center" spacing={2} sx={{ py: 1, px: 0.5, ...changeMark(p) }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
                      {p.danger && (
                        <Tooltip title="Sensitive permission — grant with care"><Box component="span" sx={{ display: 'inline-flex', color: 'warning.main' }}><IconAlertTriangle size={15} /></Box></Tooltip>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                  </Box>
                  <Switch size="small" checked={selected.has(p.name)} disabled={readOnly} onChange={() => toggle(p, null)} color={p.danger ? 'warning' : 'primary'} />
                </Stack>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} mb={2}>
        <TextField
          size="small"
          placeholder="Search permissions — e.g. invoice, delete, payroll…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { md: 360 }, flex: { md: 1 } }}
          InputProps={{
            startAdornment: (<InputAdornment position="start"><IconSearch size={18} /></InputAdornment>),
            endAdornment: search ? (<InputAdornment position="end"><IconX size={16} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} /></InputAdornment>) : null,
            sx: { borderRadius: 2 },
          }}
        />
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="granted">Granted</ToggleButton>
          <ToggleButton value="dangerous">Sensitive</ToggleButton>
          {original && <ToggleButton value="changed">Changed</ToggleButton>}
        </ToggleButtonGroup>
        <Chip label={`${grantedCount} of ${total} allowed`} color="primary" variant="outlined" />
      </Stack>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        <Button size="small" variant="text" onClick={() => setExpanded(Object.fromEntries(modules.map((m) => [m.key, true])))}>Expand all</Button>
        <Button size="small" variant="text" color="inherit" onClick={() => setExpanded(Object.fromEntries(modules.map((m) => [m.key, false])))}>Collapse all</Button>
        {!readOnly && (
          <>
            <Button size="small" variant="outlined" onClick={presetViewOnly}>Preset: view-only</Button>
            <Button size="small" variant="outlined" color="inherit" onClick={() => apply((n) => n.clear())}>Clear all</Button>
          </>
        )}
      </Stack>

      {!readOnly && (
        <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.5 }}>
          Tip: turning on Create / Edit / Delete / Approve automatically turns on <b>View</b> for that area. Click an area name to toggle its whole row.
        </Alert>
      )}

      {modules.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No permissions match your filter.</Typography>
      ) : (
        modules.map(renderModule)
      )}
    </Box>
  );
};

export default PermissionMatrix;
