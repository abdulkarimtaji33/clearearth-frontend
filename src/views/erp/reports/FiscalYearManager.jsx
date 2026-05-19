import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Collapse,
  IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconCalendar, IconPlus, IconChevronDown, IconChevronRight, IconLock,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';

const STATUS_COLOR = { open: 'success', closed: 'default' };

const FiscalYearManager = () => {
  const theme = useTheme();
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [periods, setPeriods] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getFiscalYears();
      if (res.success) setYears(asArray(res.data));
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (fyId) => {
    const next = !expanded[fyId];
    setExpanded((p) => ({ ...p, [fyId]: next }));
    if (next && !periods[fyId]) {
      const res = await apiService.getFiscalYearPeriods(fyId);
      if (res.success) setPeriods((p) => ({ ...p, [fyId]: asArray(res.data) }));
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const res = await apiService.createFiscalYear(form);
      if (res.success) {
        setCreateOpen(false);
        setForm({ name: '', startDate: '', endDate: '' });
        load();
      } else {
        setError(res.message || 'Failed to create');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseFY = async (id) => {
    if (!window.confirm('Close this fiscal year? This will lock all periods.')) return;
    const res = await apiService.closeFiscalYear(id);
    if (res.success) { setActionMsg('Fiscal year closed.'); load(); }
    else setError(res.message);
  };

  const handleClosePeriod = async (fyId, periodId) => {
    const res = await apiService.closePeriod(fyId, periodId);
    if (res.success) {
      setPeriods((p) => ({ ...p, [fyId]: undefined }));
      const r2 = await apiService.getFiscalYearPeriods(fyId);
      if (r2.success) setPeriods((p) => ({ ...p, [fyId]: r2.data || [] }));
    } else setError(res.message);
  };

  const handleReopenPeriod = async (fyId, periodId) => {
    const res = await apiService.reopenPeriod(fyId, periodId);
    if (res.success) {
      setPeriods((p) => ({ ...p, [fyId]: undefined }));
      const r2 = await apiService.getFiscalYearPeriods(fyId);
      if (r2.success) setPeriods((p) => ({ ...p, [fyId]: r2.data || [] }));
    } else setError(res.message);
  };

  return (
    <PageContainer title="Fiscal Years" description="Manage fiscal years and accounting periods">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCalendar size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Fiscal Years</Typography>
        </Stack>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>
          New Fiscal Year
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {actionMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMsg('')}>{actionMsg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          {years.length === 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No fiscal years yet. Create one to get started.</Typography>
            </Paper>
          )}
          {years.map((fy) => (
            <Paper key={fy.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.04), borderBottom: expanded[fy.id] ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconButton size="small" onClick={() => toggleExpand(fy.id)}>
                    {expanded[fy.id] ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                  </IconButton>
                  <Typography fontWeight={700}>{fy.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{fy.start_date} → {fy.end_date}</Typography>
                  <Chip label={fy.status} size="small" color={STATUS_COLOR[fy.status] || 'default'} />
                </Stack>
                {fy.status === 'open' && (
                  <Button size="small" variant="outlined" color="warning" startIcon={<IconLock size={14} />} onClick={() => handleCloseFY(fy.id)} sx={{ borderRadius: 2 }}>
                    Close Year
                  </Button>
                )}
              </Stack>
              <Collapse in={!!expanded[fy.id]}>
                {!periods[fy.id] ? (
                  <Box p={3} display="flex" justifyContent="center"><CircularProgress size={20} /></Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Period', 'Name', 'Start', 'End', 'Status', ''].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {periods[fy.id].map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.period_number}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{p.start_date}</TableCell>
                            <TableCell>{p.end_date}</TableCell>
                            <TableCell><Chip label={p.status} size="small" color={STATUS_COLOR[p.status] || 'default'} /></TableCell>
                            <TableCell align="right">
                              {p.status === 'open' ? (
                                <Button size="small" onClick={() => handleClosePeriod(fy.id, p.id)} sx={{ borderRadius: 2 }}>Close</Button>
                              ) : (
                                <Button size="small" color="warning" onClick={() => handleReopenPeriod(fy.id, p.id)} sx={{ borderRadius: 2 }}>Reopen</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Collapse>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Fiscal Year</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name (e.g. FY 2026)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Date" type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default FiscalYearManager;
