import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Checkbox, FormControlLabel,
} from '@mui/material';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const EMPTY = { name: '', code: '', isPaid: true, defaultAnnualDays: 0, requiresApproval: true };

const LeaveTypeList = () => {
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
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>Leave Types</Typography>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate}>New Leave Type</Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Code</TableCell><TableCell>Paid</TableCell>
                  <TableCell>Annual Days</TableCell><TableCell>Approval</TableCell><TableCell align="right">Edit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.code}</TableCell>
                    <TableCell><Chip size="small" label={t.is_paid ? 'Paid' : 'Unpaid'} color={t.is_paid ? 'success' : 'default'} /></TableCell>
                    <TableCell>{t.default_annual_days}</TableCell>
                    <TableCell>{t.requires_approval ? 'Required' : 'Auto'}</TableCell>
                    <TableCell align="right"><Button size="small" startIcon={<IconEdit size={16} />} onClick={() => openEdit(t)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Leave Type' : 'New Leave Type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField type="number" label="Default Annual Days" value={form.defaultAnnualDays} onChange={(e) => setForm({ ...form, defaultAnnualDays: e.target.value })} />
            <FormControlLabel control={<Checkbox checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />} label="Paid leave" />
            <FormControlLabel control={<Checkbox checked={form.requiresApproval} onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })} />} label="Requires approval" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default LeaveTypeList;
