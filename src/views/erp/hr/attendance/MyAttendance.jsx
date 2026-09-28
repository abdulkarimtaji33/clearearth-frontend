import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, MenuItem, TextField, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack,
} from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { present: 'success', absent: 'error', half_day: 'warning', late: 'warning', on_leave: 'info', holiday: 'default', weekend: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MyAttendance = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regOpen, setRegOpen] = useState(false);
  const [regForm, setRegForm] = useState({ attendanceDate: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getMyAttendanceSheet({ year, month });
      if (res.success) setDays(res.data?.days || []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
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
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Typography variant="h5" fontWeight={700}>My Attendance</Typography>
          <Stack direction="row" spacing={1}>
            <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100 }} />
            <Button variant="outlined" onClick={() => { setRegForm({ attendanceDate: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' }); setRegOpen(true); }}>
              Request Correction
            </Button>
          </Stack>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Work Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {days.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.status ? <Chip size="small" label={d.status.replace('_', ' ')} color={STATUS_COLORS[d.status] || 'default'} /> : '-'}</TableCell>
                    <TableCell>{d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.checkOutTime ? new Date(d.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.workHours ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={regOpen} onClose={() => setRegOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Attendance Correction</DialogTitle>
        <DialogContent>
          {regError && <Alert severity="error" sx={{ mb: 2 }}>{regError}</Alert>}
          {regSuccess && <Alert severity="success" sx={{ mb: 2 }}>{regSuccess}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} value={regForm.attendanceDate} onChange={(e) => setRegForm({ ...regForm, attendanceDate: e.target.value })} />
            <TextField type="datetime-local" label="Requested Check In" InputLabelProps={{ shrink: true }} value={regForm.requestedCheckIn} onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })} />
            <TextField type="datetime-local" label="Requested Check Out" InputLabelProps={{ shrink: true }} value={regForm.requestedCheckOut} onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })} />
            <TextField multiline rows={2} label="Reason" required value={regForm.reason} onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRegularization} disabled={!regForm.attendanceDate || !regForm.reason}>Submit</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyAttendance;
