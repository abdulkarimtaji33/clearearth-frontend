import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, MenuItem, TextField, Alert, CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Tabs, Tab, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { IconCalendarCheck, IconUsersGroup, IconCheck } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { present: 'success', absent: 'error', half_day: 'warning', late: 'warning', on_leave: 'info', holiday: 'default', weekend: 'default', not_marked: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday'];

const SectionHeader = ({ icon, title, subtitle }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography variant="h4" fontWeight={700}>{title}</Typography>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Today's Attendance — every active employee on one screen, bulk-markable.
// ---------------------------------------------------------------------------
const TodaysAttendance = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [edited, setEdited] = useState({}); // employeeId -> { status, checkInTime, checkOutTime, notes }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const res = await apiService.getHrAttendanceTodayAll();
      if (res.success) { setRows(res.data || []); setEdited({}); }
    } catch (err) {
      setError(err.message || 'Failed to load today\'s attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentStatus = (r) => edited[r.employeeId]?.status ?? (r.status === 'not_marked' ? '' : r.status);

  const setRowField = (employeeId, field, value) => {
    setEdited((e) => ({ ...e, [employeeId]: { ...e[employeeId], [field]: value } }));
  };

  const markAllPresent = () => {
    setEdited((e) => {
      const next = { ...e };
      rows.forEach((r) => {
        if (r.status === 'not_marked' && !next[r.employeeId]) {
          next[r.employeeId] = { status: 'present' };
        }
      });
      return next;
    });
  };

  const changedCount = Object.keys(edited).length;

  const save = async () => {
    const entries = Object.entries(edited)
      .filter(([, v]) => v.status)
      .map(([employeeId, v]) => ({
        employeeId: Number(employeeId),
        status: v.status,
        checkInTime: v.checkInTime || undefined,
        checkOutTime: v.checkOutTime || undefined,
        notes: v.notes || undefined,
      }));
    if (entries.length === 0) return;
    try {
      setSaving(true);
      setError('');
      const res = await apiService.bulkManualHrAttendance({ attendanceDate: dayjs().format('YYYY-MM-DD'), entries });
      if (res.success) {
        setResult(res.data);
        await load();
      }
    } catch (err) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {dayjs().format('dddd, D MMMM YYYY')} · {rows.length} active employee{rows.length === 1 ? '' : 's'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<IconCheck size={18} />} onClick={markAllPresent} disabled={loading || rows.every((r) => r.status !== 'not_marked')} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Mark All Present
          </Button>
          <Button variant="contained" onClick={save} disabled={saving || changedCount === 0} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'common.white' }} /> : `Save Attendance${changedCount ? ` (${changedCount})` : ''}`}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {result && (
        <Alert severity={result.failed?.length ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setResult(null)}>
          {result.updated} employee{result.updated === 1 ? '' : 's'} updated.
          {result.failed?.length > 0 && ` ${result.failed.length} failed: ${result.failed.map((f) => `#${f.employeeId} (${f.error})`).join(', ')}`}
        </Alert>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Notes'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography variant="body2" color="text.secondary">No active employees found</Typography></TableCell></TableRow>
              ) : (
                rows.map((r) => {
                  const status = currentStatus(r);
                  const isDirty = !!edited[r.employeeId];
                  return (
                    <TableRow key={r.employeeId} hover sx={isDirty ? { bgcolor: alpha(theme.palette.primary.main, 0.03) } : undefined}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{r.employeeName}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.employeeCode}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.department || '-'}</Typography></TableCell>
                      <TableCell>
                        <TextField select size="small" value={status} placeholder="Not marked"
                          onChange={(e) => setRowField(r.employeeId, 'status', e.target.value)}
                          sx={{ minWidth: 130 }}
                          SelectProps={{ displayEmpty: true, renderValue: (v) => v
                            ? <Chip size="small" label={v.replace('_', ' ')} color={STATUS_COLORS[v] || 'default'} sx={{ textTransform: 'capitalize' }} />
                            : <Chip size="small" label="Not marked" variant="outlined" /> }}
                        >
                          <MenuItem value=""><em>Not marked</em></MenuItem>
                          {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField type="time" size="small" value={edited[r.employeeId]?.checkInTimeStr || ''}
                          onChange={(e) => {
                            const t = e.target.value;
                            setRowField(r.employeeId, 'checkInTimeStr', t);
                            setRowField(r.employeeId, 'checkInTime', t ? dayjs().format('YYYY-MM-DD') + 'T' + t + ':00' : '');
                          }}
                          sx={{ width: 110 }} InputLabelProps={{ shrink: true }} disabled={!['present', 'late', 'half_day'].includes(status)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField type="time" size="small" value={edited[r.employeeId]?.checkOutTimeStr || ''}
                          onChange={(e) => {
                            const t = e.target.value;
                            setRowField(r.employeeId, 'checkOutTimeStr', t);
                            setRowField(r.employeeId, 'checkOutTime', t ? dayjs().format('YYYY-MM-DD') + 'T' + t + ':00' : '');
                          }}
                          sx={{ width: 110 }} InputLabelProps={{ shrink: true }} disabled={!['present', 'late', 'half_day'].includes(status)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" placeholder="Optional" value={edited[r.employeeId]?.notes || ''}
                          onChange={(e) => setRowField(r.employeeId, 'notes', e.target.value)} sx={{ width: 140 }} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Monthly Sheet — per-employee history (existing behaviour, restyled).
// ---------------------------------------------------------------------------
const MonthlySheet = () => {
  const theme = useTheme();
  const now = useMemo(() => new Date(), []);
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
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField select size="small" label="Employee" value={employeeId} sx={{ minWidth: 240 }} onChange={(e) => setEmployeeId(e.target.value)}>
            <MenuItem value="">Select employee</MenuItem>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100 }} />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : !employeeId ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>Select an employee to view their monthly sheet</Alert>
      ) : (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Date', 'Status', 'Check In', 'Check Out', 'Notes', ''].map((h, i) => (
                    <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {days.map((d) => (
                  <TableRow key={d.date} hover>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.status ? <Chip size="small" label={d.status.replace('_', ' ')} color={STATUS_COLORS[d.status] || 'default'} sx={{ textTransform: 'capitalize' }} /> : '-'}</TableCell>
                    <TableCell>{d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.checkOutTime ? new Date(d.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{d.notes || '-'}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openEdit(d)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

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
    </Box>
  );
};

const AttendanceSheet = () => {
  const [tab, setTab] = useState(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <PageContainer title="Attendance Management" description="Mark today's attendance for everyone, or review a monthly sheet">
        <SectionHeader icon={<IconCalendarCheck size={20} />} title="Attendance Management" />
        <Typography variant="body2" color="text.secondary" ml={6.5} mb={3}>
          Mark today's attendance for the whole team, or review an individual's monthly history.
        </Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<IconUsersGroup size={16} />} iconPosition="start" label="Today's Attendance" sx={{ minHeight: 44, fontWeight: 600 }} />
          <Tab icon={<IconCalendarCheck size={16} />} iconPosition="start" label="Monthly Sheet" sx={{ minHeight: 44, fontWeight: 600 }} />
        </Tabs>

        {tab === 0 ? <TodaysAttendance /> : <MonthlySheet />}
      </PageContainer>
    </LocalizationProvider>
  );
};

export default AttendanceSheet;
