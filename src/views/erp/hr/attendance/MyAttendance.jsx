import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, MenuItem, TextField, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconClock } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { present: 'success', absent: 'error', half_day: 'warning', late: 'warning', on_leave: 'info', holiday: 'default', weekend: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MyAttendance = () => {
  const theme = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notSetUp, setNotSetUp] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [regForm, setRegForm] = useState({ attendanceDate: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setNotSetUp(false);
      const res = await apiService.getMyAttendanceSheet({ year, month });
      if (res.success) setDays(res.data?.days || []);
    } catch (err) {
      if (err.status === 404 && /no employee record linked/i.test(err.message || '')) {
        setNotSetUp(true);
      } else {
        setError(err.message || 'Failed to load attendance');
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const submitRegularization = async () => {
    setRegError('');
    setRegSuccess('');
    try {
      await apiService.createAttendanceRegularization(regForm);
      setRegSuccess('Regularization request submitted');
      setTimeout(() => { setRegOpen(false); setRegSuccess(''); }, 1000);
    } catch (err) {
      setRegError(err.message || 'Failed to submit request');
    }
  };

  return (
    <PageContainer title="My Attendance" description="Your monthly attendance history">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconClock size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>My Attendance</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              Your monthly attendance history
            </Typography>
          </Box>
          {!notSetUp && (
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <Button
                variant="outlined"
                onClick={() => { setRegForm({ attendanceDate: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' }); setRegOpen(true); }}
                sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Request Correction
              </Button>
            </Stack>
          )}
        </Stack>

        {notSetUp ? (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Your HR profile isn&apos;t set up yet — contact your HR administrator to get started.
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
        ) : null}

        {!notSetUp && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Date', 'Status', 'Check In', 'Check Out', 'Work Hours'].map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                  ) : days.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><Typography variant="body2" color="text.secondary">No attendance records for this period</Typography></TableCell></TableRow>
                  ) : (
                    days.map((d) => (
                      <TableRow key={d.date} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{d.date}</Typography></TableCell>
                        <TableCell>{d.status ? <Chip size="small" label={d.status.replace('_', ' ')} color={STATUS_COLORS[d.status] || 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /> : '-'}</TableCell>
                        <TableCell>{d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                        <TableCell>{d.checkOutTime ? new Date(d.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                        <TableCell>{d.workHours ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>

      <Dialog open={regOpen} onClose={() => setRegOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Attendance Correction</DialogTitle>
        <DialogContent>
          {regError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{regError}</Alert>}
          {regSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{regSuccess}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <DatePicker
                label="Date"
                value={regForm.attendanceDate ? dayjs(regForm.attendanceDate) : null}
                onChange={(v) => setRegForm({ ...regForm, attendanceDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <DateTimePicker
                label="Requested Check In"
                value={regForm.requestedCheckIn ? dayjs(regForm.requestedCheckIn) : null}
                onChange={(v) => setRegForm({ ...regForm, requestedCheckIn: v && v.isValid() ? v.toISOString() : '' })}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <DateTimePicker
                label="Requested Check Out"
                value={regForm.requestedCheckOut ? dayjs(regForm.requestedCheckOut) : null}
                onChange={(v) => setRegForm({ ...regForm, requestedCheckOut: v && v.isValid() ? v.toISOString() : '' })}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <TextField
                multiline
                rows={2}
                label="Reason"
                required
                value={regForm.reason}
                onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRegOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submitRegularization} disabled={!regForm.attendanceDate || !regForm.reason} sx={{ borderRadius: 2 }}>Submit</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyAttendance;
