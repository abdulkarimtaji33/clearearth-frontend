import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button,
  CircularProgress, Alert, TablePagination, TextField, MenuItem, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconClipboardList, IconSearch, IconFileSpreadsheet, IconDownload, IconFileCheck } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { not_started: 'default', in_progress: 'info', completed: 'success' };

const PickupReport = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [f, setF] = useState({ search: '', status: '', from: '', to: '' });

  const filters = { search: f.search || undefined, status: f.status || undefined, from: f.from || undefined, to: f.to || undefined };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getPickupReport({ ...filters, page: page + 1, pageSize: rowsPerPage });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
      setError('');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, f.search, f.status, f.from, f.to]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setPage(0); };
  const exportCsv = async () => {
    try { setExporting(true); await apiService.downloadPickupReportCsv(filters); } catch (e) { setError(e.message); } finally { setExporting(false); }
  };
  const head = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', whiteSpace: 'nowrap' };

  return (
    <PageContainer title="Pickup report" description="Pickup report">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClipboardList size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Pickup report</Typography>
            <Typography variant="body2" color="text.secondary">{total} pickup{total !== 1 ? 's' : ''} · filter, export to Excel, or download the pickup note a driver filled in</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <IconFileSpreadsheet size={18} />} disabled={exporting} onClick={exportCsv}>
          Export to Excel
        </Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <TextField size="small" label="Search deal, work order, notes" value={f.search} onChange={set('search')} sx={{ width: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }} />
            <TextField select size="small" label="Status" value={f.status} onChange={set('status')} sx={{ width: 170 }}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="not_started">Not started</MenuItem>
              <MenuItem value="in_progress">In progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
            <TextField size="small" type="date" label="Pickup from" value={f.from} onChange={set('from')} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField size="small" type="date" label="Pickup to" value={f.to} onChange={set('to')} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          </Stack>
        </Box>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['Pickup date', 'Deal', 'Client', 'Driver', 'Helpers', 'Quantity', 'Condition', 'Facility', 'Status', 'Note no.', 'Vehicle', 'Pickup note'].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                  <IconFileCheck size={36} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" mt={1} fontWeight={600}>No pickups match these filters</Typography>
                </TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.task_id} hover>
                  <TableCell>{r.pickup_date ? String(r.pickup_date).slice(0, 10) : '—'}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{r.deal_number || '—'}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 160 }}>{r.work_order}</Typography></TableCell>
                  <TableCell>{r.client || '—'}</TableCell>
                  <TableCell>{r.driver || '—'}</TableCell>
                  <TableCell>{r.helpers?.length ? r.helpers.join(', ') : '—'}</TableCell>
                  <TableCell>{r.quantity ? `${r.quantity} ${r.uom || ''}` : '—'}</TableCell>
                  <TableCell>{r.condition || '—'}</TableCell>
                  <TableCell>{r.storage_facility || '—'}</TableCell>
                  <TableCell><Chip size="small" label={r.status_label} color={STATUS_COLOR[r.status] || 'default'} sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>{r.note_available ? (r.note_number || '—') : <Typography variant="caption" color="text.secondary">Pending</Typography>}</TableCell>
                  <TableCell>{r.note_available ? (r.note_vehicle_no || '—') : '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={r.note_available ? 'Download the pickup note' : 'Available once the work order is completed'}>
                      <span>
                        <IconButton size="small" color="primary" disabled={!r.note_available} onClick={() => apiService.downloadPickupNotePdf(r.task_id).catch((e) => setError(e.message))}><IconDownload size={18} /></IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>
    </PageContainer>
  );
};

export default PickupReport;
