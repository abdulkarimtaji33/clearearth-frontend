import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, IconButton, Checkbox, FormControlLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconTrash, IconCalendarEvent } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const HolidayCalendar = () => {
  const theme = useTheme();
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
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCalendarEvent size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Holidays</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {rows.length > 0 ? `${rows.length} holiday${rows.length !== 1 ? 's' : ''}` : 'Manage the company holiday calendar'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            New Holiday
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Name', 'Date', 'Recurring', 'Actions'].map((h, i) => (
                    <TableCell key={i} align={i === 3 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <IconCalendarEvent size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No holidays configured</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((h) => (
                    <TableRow key={h.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{h.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{h.holiday_date}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{h.is_recurring ? 'Yes' : 'No'}</Typography></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => remove(h.id)} sx={{ borderRadius: 1.5 }}>
                          <IconTrash size={18} />
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
        <DialogTitle sx={{ fontWeight: 700 }}>New Holiday</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <DatePicker
                label="Date"
                value={form.holidayDate ? dayjs(form.holidayDate) : null}
                onChange={(v) => setForm({ ...form, holidayDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <FormControlLabel control={<Checkbox checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />} label="Recurs every year" />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!form.name || !form.holidayDate} sx={{ borderRadius: 2 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default HolidayCalendar;
