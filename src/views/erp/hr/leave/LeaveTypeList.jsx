import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Checkbox, FormControlLabel, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconEdit, IconCalendarStats } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const EMPTY = { name: '', code: '', isPaid: true, defaultAnnualDays: 0, requiresApproval: true };

const LeaveTypeList = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrLeaveTypes();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, code: t.code, isPaid: t.is_paid, defaultAnnualDays: t.default_annual_days, requiresApproval: t.requires_approval });
    setFormOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await apiService.updateHrLeaveType(editing.id, form);
      else await apiService.createHrLeaveType(form);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to save leave type');
    }
  };

  return (
    <PageContainer title="Leave Types" description="HR leave type configuration">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCalendarStats size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Leave Types</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {rows.length > 0 ? `${rows.length} leave type${rows.length !== 1 ? 's' : ''}` : 'Configure leave type entitlements'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            New Leave Type
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Name', 'Code', 'Paid', 'Annual Days', 'Approval', 'Edit'].map((h, i) => (
                    <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <IconCalendarStats size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No leave types configured</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{t.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{t.code}</Typography></TableCell>
                      <TableCell><Chip size="small" label={t.is_paid ? 'Paid' : 'Unpaid'} color={t.is_paid ? 'success' : 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="body2">{t.default_annual_days}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{t.requires_approval ? 'Required' : 'Auto'}</Typography></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(t)} sx={{ borderRadius: 1.5 }}>
                          <IconEdit size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Leave Type' : 'New Leave Type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Code" value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField type="number" label="Default Annual Days" value={form.defaultAnnualDays} onChange={(e) => setForm({ ...form, defaultAnnualDays: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <FormControlLabel control={<Checkbox checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />} label="Paid leave" />
            <FormControlLabel control={<Checkbox checked={form.requiresApproval} onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })} />} label="Requires approval" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ borderRadius: 2 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default LeaveTypeList;
