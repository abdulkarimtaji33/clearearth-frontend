import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, MenuItem, TextField, Alert, CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button,
} from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { present: 'success', absent: 'error', half_day: 'warning', late: 'warning', on_leave: 'info', holiday: 'default', weekend: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday'];

const AttendanceSheet = () => {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDay, setEditDay] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'present', checkInTime: '', checkOutTime: '', notes: '' });

  useEffect(() => {
    apiService.getHrEmployees({ pageSize: 500 }).then((res) => { if (res.success) setEmployees(res.data || []); }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!employeeId) { setDays([]); return; }
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrAttendanceSheet(employeeId, { year, month });
      if (res.success) setDays(res.data?.days || []);
    } catch (err) {
      setError(err.message || 'Failed to load sheet');
    } finally {
      setLoading(false);
    }
  }, [employeeId, year, month]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (d) => {
    setEditDay(d);
    setEditForm({ status: d.status || 'present', checkInTime: d.checkInTime ? d.checkInTime.slice(0, 16) : '', checkOutTime: d.checkOutTime ? d.checkOutTime.slice(0, 16) : '', notes: d.notes || '' });
  };

  const saveEdit = async () => {
    try {
      await apiService.manualHrAttendance({
        employeeId, attendanceDate: editDay.date, status: editForm.status,
        checkInTime: editForm.checkInTime || null, checkOutTime: editForm.checkOutTime || null, notes: editForm.notes || null,
      });
      setEditDay(null);
      load();
    } catch (err) {
      setError(err.message || 'Failed to update attendance');
    }
  };

  return (
    <PageContainer title="Attendance Sheet" description="HR monthly attendance grid">
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Attendance Sheet</Typography>
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <TextField select size="small" label="Employee" value={employeeId} sx={{ minWidth: 240 }} onChange={(e) => setEmployeeId(e.target.value)}>
            <MenuItem value="">Select employee</MenuItem>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100 }} />
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : !employeeId ? (
          <Alert severity="info">Select an employee to view their monthly sheet</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell><TableCell>Notes</TableCell><TableCell align="right">Edit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {days.map((d) => (
                  <TableRow key={d.date} hover>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.status ? <Chip size="small" label={d.status.replace('_', ' ')} color={STATUS_COLORS[d.status] || 'default'} /> : '-'}</TableCell>
                    <TableCell>{d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.checkOutTime ? new Date(d.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.notes || '-'}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openEdit(d)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={!!editDay} onClose={() => setEditDay(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Attendance — {editDay?.date}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField type="datetime-local" label="Check In" InputLabelProps={{ shrink: true }} value={editForm.checkInTime} onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })} />
            <TextField type="datetime-local" label="Check Out" InputLabelProps={{ shrink: true }} value={editForm.checkOutTime} onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })} />
            <TextField label="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDay(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AttendanceSheet;
