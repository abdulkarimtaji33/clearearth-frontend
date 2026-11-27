import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Alert, TablePagination, TextField, MenuItem, InputAdornment, Button, Grid,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconQrcode, IconBoxSeam, IconClockHour4, IconLock, IconTruckLoading } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

export const TAG_GROUP_LABELS = { material_type: 'Material type', condition: 'Condition', action: 'Action / handling', special: 'Special handling' };
export const STATUS_COLOR = {
  inspection_pending: 'warning', inspected: 'info', in_refurbishment: 'primary', in_dismantling: 'primary', in_recycling: 'primary',
  ready_for_sale: 'success', for_destruction: 'error', destroyed: 'default', sold: 'success', transferred: 'default', disposed: 'default',
};

export const TagChip = ({ tag, onDelete }) => (
  <Chip
    size="small"
    label={tag.name}
    onDelete={onDelete}
    color={tag.blocks_processing ? 'error' : tag.tag_group === 'special' ? 'warning' : tag.tag_group === 'condition' ? 'info' : 'default'}
    variant={tag.tag_group === 'material_type' || tag.tag_group === 'action' ? 'outlined' : 'filled'}
    sx={{ fontWeight: 600, borderRadius: 1.5 }}
  />
);

const Kpi = ({ icon, label, value, color = 'primary', onClick }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { bgcolor: alpha(theme.palette[color].main, 0.04) } : undefined }}
    >
      <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: alpha(theme.palette[color].main, 0.12), color: `${color}.main`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1.1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Typography>
      </Box>
    </Paper>
  );
};

const WarehouseTracking = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customer, setCustomer] = useState('');
  const [location, setLocation] = useState('');
  const [tagId, setTagId] = useState('');
  const [blocked, setBlocked] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState({ statuses: {} });
  const [summary, setSummary] = useState(null);
  const [scanCode, setScanCode] = useState('');
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    apiService.get('/warehouse/tags').then((r) => setTags(r?.data || [])).catch(() => {});
    apiService.get('/warehouse/meta').then((r) => setMeta(r?.data || { statuses: {} })).catch(() => {});
    apiService.get('/warehouse/summary').then((r) => setSummary(r?.data || null)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.get('/warehouse/batches', {
        page: page + 1, pageSize: rowsPerPage,
        search: search || undefined, status: status || undefined, customer: customer || undefined, location: location || undefined,
        tagId: tagId || undefined, blocked: blocked || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, status, customer, location, tagId, blocked, dateFrom, dateTo]);
  useEffect(() => { load(); }, [load]);

  const doScan = async (e) => {
    e.preventDefault();
    setScanError('');
    try {
      const res = await apiService.get('/warehouse/scan', { code: scanCode.trim() });
      if (res?.data?.id) navigate(`/erp/warehouse/batch/${res.data.id}`);
    } catch (err) {
      setScanError(err.message || 'No material found for this code');
    }
  };

  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  return (
    <PageContainer title="Material tracking" description="Warehouse material tracking and tag-based segregation">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBoxSeam size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Material Tracking</Typography>
            <Typography variant="body2" color="text.secondary">Every received lot: tags, location, segregation and history</Typography>
          </Box>
        </Stack>
        <Box component="form" onSubmit={doScan} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small" placeholder="Scan or type a batch code" value={scanCode} onChange={(e) => setScanCode(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><IconQrcode size={18} /></InputAdornment> }}
            sx={{ width: 260 }} autoFocus
          />
          <Button type="submit" variant="contained" disabled={!scanCode.trim()} sx={{ borderRadius: 2 }}>Open</Button>
        </Box>
      </Stack>
      {scanError && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setScanError('')}>{scanError}</Alert>}

      {summary && (
        <Grid container spacing={2} mb={2.5}>
          <Grid size={{ xs: 6, md: 3 }}><Kpi icon={<IconTruckLoading size={22} />} label="Received today" value={summary.receivedToday} onClick={() => { const d = new Date().toISOString().slice(0, 10); setDateFrom(d); setDateTo(d); setPage(0); }} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Kpi icon={<IconClockHour4 size={22} />} label="Pending inspection" value={summary.pendingInspection} color="warning" onClick={() => { setStatus('inspection_pending'); setPage(0); }} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Kpi icon={<IconLock size={22} />} label="On hold / blocked" value={summary.blocked} color="error" onClick={() => { setBlocked('1'); setPage(0); }} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Where it is now</Typography>
              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(summary.byLocation || []).slice(0, 6).map((l) => (
                  <Chip key={l.location} size="small" variant="outlined" label={`${l.location}: ${l.count}`} onClick={() => { setLocation(l.location === 'No location' ? '' : l.location); setPage(0); }} />
                ))}
                {!(summary.byLocation || []).length && <Typography variant="body2" color="text.disabled">No stock</Typography>}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <TextField size="small" label="Search batch / item / customer" value={search} onChange={reset(setSearch)} sx={{ width: 260 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }} />
            <TextField size="small" label="Customer" value={customer} onChange={reset(setCustomer)} sx={{ width: 180 }} />
            <TextField size="small" label="Location" value={location} onChange={reset(setLocation)} sx={{ width: 160 }} />
            <TextField select size="small" label="Status" value={status} onChange={reset(setStatus)} sx={{ width: 190 }}>
              <MenuItem value="">All statuses</MenuItem>
              {Object.entries(meta.statuses || {}).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Tag" value={tagId} onChange={reset(setTagId)} sx={{ width: 220 }}>
              <MenuItem value="">All tags</MenuItem>
              {tags.map((t) => <MenuItem key={t.id} value={t.id}>{t.name} · {TAG_GROUP_LABELS[t.tag_group]}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Hold" value={blocked} onChange={reset(setBlocked)} sx={{ width: 150 }}>
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="1">Blocked only</MenuItem>
            </TextField>
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={(v) => { setDateFrom(v); setPage(0); }} onToChange={(v) => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Received date" compact />
          </Box>
        </Box>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['Batch', 'Item', 'Customer', 'Quantity', 'Location', 'Status', 'Tags', 'Received'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><Typography color="text.secondary" fontWeight={600}>No material found</Typography></TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/warehouse/batch/${r.id}`)}>
                  <TableCell>
                    <Chip size="small" label={r.batch_code} sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', borderRadius: 1.5 }} />
                    {r.parent_batch_id ? <Typography variant="caption" color="text.secondary" display="block">split batch</Typography> : null}
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>{r.item_name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{r.customer_name || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" noWrap>{Number(r.quantity).toLocaleString()} {r.unit_of_measure || ''}</Typography></TableCell>
                  <TableCell><Typography variant="body2" noWrap>{r.location || '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status_label} color={STATUS_COLOR[r.status] || 'default'} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                    {r.blocked && <Chip size="small" icon={<IconLock size={12} />} label="On hold" color="error" variant="outlined" sx={{ ml: 0.5, fontWeight: 700 }} />}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{(r.tags || []).map((t) => <TagChip key={t.id} tag={t} />)}</Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" noWrap>{r.received_at ? String(r.received_at).slice(0, 10) : '—'}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>
    </PageContainer>
  );
};

export default WarehouseTracking;
