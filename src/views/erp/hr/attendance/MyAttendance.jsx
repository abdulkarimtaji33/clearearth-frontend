import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, TextField, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack,
} from '@mui/material';
import {
  IconClock, IconCircleCheck, IconCircleX, IconAlarm, IconBeach, IconCalendarOff, IconEdit, IconUserOff,
} from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, EmptyState, LoadingBlock,
  tableSx, inputSx, dialogPaperProps, fmtDate,
} from '../components/HrUi';

const STATUS_TONES = { on_leave: 'info', holiday: 'default', weekend: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmtTime = (t) => (t ? dayjs(t).format('HH:mm') : '');

const MyAttendance = () => {
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

  const summary = useMemo(() => {
    const count = (s) => days.filter((d) => d.status === s).length;
    const hours = days.reduce((sum, d) => sum + (parseFloat(d.workHours) || 0), 0);
    return {
      present: count('present'),
      absent: count('absent'),
      late: count('late') + count('half_day'),
      onLeave: count('on_leave'),
      hours: Math.round(hours * 10) / 10,
    };
  }, [days]);

  const periodLabel = `${MONTHS[month - 1] || ''} ${year}`;

  const actions = !notSetUp && (
    <>
      <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 140, ...inputSx }}>
        {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
      </TextField>
      <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100, ...inputSx }} />
      <Button
        variant="contained"
        startIcon={<IconEdit size={18} />}
        onClick={() => { setRegForm({ attendanceDate: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' }); setRegOpen(true); }}
        sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        Request Correction
      </Button>
    </>
  );

  return (
    <HrPage
      title="My Attendance"
      description="Your monthly attendance history"
      subtitle="Your daily check-ins, check-outs and hours worked for the selected month."
      actions={actions}
    >
      {notSetUp ? (
        <SectionCard>
          <EmptyState
            icon={IconUserOff}
            title="HR profile not set up"
            message="Your HR profile isn't set up yet — contact your HR administrator to get started."
          />
        </SectionCard>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <StatGrid min={180} sx={{ mb: 3 }}>
            <StatTile icon={IconCircleCheck} tone="success" label="Present" value={summary.present} loading={loading} hint={periodLabel} />
            <StatTile icon={IconCircleX} tone="error" label="Absent" value={summary.absent} loading={loading} hint={periodLabel} />
            <StatTile icon={IconAlarm} tone="warning" label="Late / half day" value={summary.late} loading={loading} hint={periodLabel} />
            <StatTile icon={IconBeach} tone="info" label="On leave" value={summary.onLeave} loading={loading} hint={periodLabel} />
            <StatTile icon={IconClock} tone="primary" label="Hours worked" value={summary.hours} loading={loading} hint={periodLabel} />
          </StatGrid>

          <SectionCard icon={IconClock} title="Daily log" subtitle={periodLabel} noPadding>
            {loading ? (
              <LoadingBlock />
            ) : days.length === 0 ? (
              <EmptyState icon={IconCalendarOff} title="No attendance records" message="Nothing has been recorded for this period yet." compact />
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ ...tableSx, minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Check in</TableCell>
                      <TableCell>Check out</TableCell>
                      <TableCell align="right">Work hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map((d) => (
                      <TableRow key={d.date} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{fmtDate(d.date) || d.date}</Typography>
                          <Typography variant="caption" color="text.secondary">{fmtDate(d.date, 'dddd')}</Typography>
                        </TableCell>
                        <TableCell>
                          {d.status ? <StatusChip status={d.status} tone={STATUS_TONES[d.status]} /> : <Typography variant="body2" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell><Typography variant="body2">{fmtTime(d.checkInTime) || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{fmtTime(d.checkOutTime) || '—'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{d.workHours ?? '—'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionCard>
        </>
      )}

      <Dialog open={regOpen} onClose={() => setRegOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Request attendance correction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Tell HR what the correct times should be. Your request will be reviewed before your record is updated.
          </Typography>
          {regError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{regError}</Alert>}
          {regSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{regSuccess}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <DatePicker
                label="Date"
                value={regForm.attendanceDate ? dayjs(regForm.attendanceDate) : null}
                onChange={(v) => setRegForm({ ...regForm, attendanceDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <DateTimePicker
                  label="Requested check in"
                  value={regForm.requestedCheckIn ? dayjs(regForm.requestedCheckIn) : null}
                  onChange={(v) => setRegForm({ ...regForm, requestedCheckIn: v && v.isValid() ? v.toISOString() : '' })}
                  slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                />
                <DateTimePicker
                  label="Requested check out"
                  value={regForm.requestedCheckOut ? dayjs(regForm.requestedCheckOut) : null}
                  onChange={(v) => setRegForm({ ...regForm, requestedCheckOut: v && v.isValid() ? v.toISOString() : '' })}
                  slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                />
              </Box>
              <TextField
                multiline
                rows={3}
                label="Reason"
                required
                value={regForm.reason}
                onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                sx={inputSx}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRegOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submitRegularization} disabled={!regForm.attendanceDate || !regForm.reason} sx={{ borderRadius: 2, fontWeight: 600 }}>Submit request</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default MyAttendance;
