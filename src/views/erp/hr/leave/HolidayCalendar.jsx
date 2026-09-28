import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, IconButton, Checkbox, FormControlLabel,
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const HolidayCalendar = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', holidayDate: '', isRecurring: false });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrHolidays();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await apiService.createHrHoliday(form);
      setFormOpen(false);
      setForm({ name: '', holidayDate: '', isRecurring: false });
      load();
    } catch (err) {
      setError(err.message || 'Failed to add holiday');
    }
  };

  const remove = async (id) => {
    try { await apiService.deleteHrHoliday(id); load(); } catch (err) { setError(err.message || 'Failed to delete holiday'); }
  };

  return (
    <PageContainer title="Holidays" description="HR holiday calendar">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>Holidays</Typography>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)}>New Holiday</Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Name</TableCell><TableCell>Date</TableCell><TableCell>Recurring</TableCell><TableCell align="right">Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {rows.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>{h.holiday_date}</TableCell>
                    <TableCell>{h.is_recurring ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right"><IconButton size="small" color="error" onClick={() => remove(h.id)}><IconTrash size={18} /></IconButton></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={4} align="center">No holidays configured</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Holiday</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} />
            <FormControlLabel control={<Checkbox checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />} label="Recurs every year" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!form.name || !form.holidayDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default HolidayCalendar;
