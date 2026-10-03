import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, TextField, Alert, CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  IconCalendarCheck, IconUsersGroup, IconCheck, IconCircleCheck, IconCircleX, IconAlarm,
  IconHelpCircle, IconEdit, IconUserSearch, IconCalendarOff, IconBeach,
} from '@tabler/icons-react';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, PersonCell, EmptyState, LoadingBlock, FilterBar,
  tableSx, inputSx, dialogPaperProps, fmtDate, humanize,
} from '../components/HrUi';

const STATUS_TONES = { on_leave: 'info', holiday: 'default', weekend: 'default', not_marked: 'default' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday'];

const fmtTime = (t) => (t ? dayjs(t).format('HH:mm') : '');

/** Builds a person-like object from a "First Last" display name for PersonCell. */
const personFromName = (name) => {
  const parts = String(name || '').trim().split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
};

// ---------------------------------------------------------------------------
// Today's Attendance — every active employee on one screen, bulk-markable.
// ---------------------------------------------------------------------------
const TodaysAttendance = () => {
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

  const counts = rows.reduce((acc, r) => {
    const s = edited[r.employeeId]?.status ?? (r.status === 'not_marked' ? '' : r.status);
    if (s === 'present') acc.present += 1;
    else if (s === 'absent') acc.absent += 1;
    else if (s === 'late' || s === 'half_day') acc.late += 1;
    else if (!s) acc.unmarked += 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, unmarked: 0 });

  return (
    <Box>
      <StatGrid min={180} sx={{ mb: 3 }}>
        <StatTile icon={IconUsersGroup} tone="primary" label="Active employees" value={rows.length} loading={loading} />
        <StatTile icon={IconCircleCheck} tone="success" label="Present" value={counts.present} loading={loading} />
        <StatTile icon={IconCircleX} tone="error" label="Absent" value={counts.absent} loading={loading} />
        <StatTile icon={IconAlarm} tone="warning" label="Late / half day" value={counts.late} loading={loading} />
        <StatTile icon={IconHelpCircle} tone="secondary" label="Not marked" value={counts.unmarked} loading={loading} />
      </StatGrid>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {result && (
        <Alert severity={result.failed?.length ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setResult(null)}>
          {result.updated} employee{result.updated === 1 ? '' : 's'} updated.
          {result.failed?.length > 0 && ` ${result.failed.length} failed: ${result.failed.map((f) => `#${f.employeeId} (${f.error})`).join(', ')}`}
        </Alert>
      )}

      <SectionCard
        icon={IconUsersGroup}
        title="Today's register"
        subtitle={dayjs().format('dddd, D MMMM YYYY')}
        noPadding
        action={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
            <Button size="small" variant="outlined" startIcon={<IconCheck size={16} />} onClick={markAllPresent} disabled={loading || rows.every((r) => r.status !== 'not_marked')} sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Mark all present
            </Button>
            <Button size="small" variant="contained" onClick={save} disabled={saving || changedCount === 0} sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap', minWidth: 120 }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : `Save${changedCount ? ` (${changedCount})` : ''}`}
            </Button>
          </Stack>
        )}
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState icon={IconUsersGroup} title="No active employees" message="Once employees are active they will appear here for daily marking." compact />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ ...tableSx, minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check in</TableCell>
                  <TableCell>Check out</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const status = currentStatus(r);
                  const isDirty = !!edited[r.employeeId];
                  const timeDisabled = !['present', 'late', 'half_day'].includes(status);
                  return (
                    <TableRow
                      key={r.employeeId}
                      hover
                      sx={isDirty ? {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                        '& td:first-of-type': { boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}` },
                      } : undefined}
                    >
                      <TableCell>
                        <PersonCell person={personFromName(r.employeeName)} secondary={r.employeeCode} size={32} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={r.department ? 'text.secondary' : 'text.disabled'}>{r.department || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={status}
                          onChange={(e) => setRowField(r.employeeId, 'status', e.target.value)}
                          sx={{ minWidth: 150, ...inputSx }}
                          SelectProps={{
                            displayEmpty: true,
                            renderValue: (v) => (v
                              ? <StatusChip status={v} tone={STATUS_TONES[v]} />
                              : <StatusChip status="not_marked" label="Not marked" tone="default" />),
                          }}
                        >
                          <MenuItem value=""><em>Not marked</em></MenuItem>
                          {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          size="small"
                          value={edited[r.employeeId]?.checkInTimeStr || ''}
                          onChange={(e) => {
                            const t = e.target.value;
                            setRowField(r.employeeId, 'checkInTimeStr', t);
                            setRowField(r.employeeId, 'checkInTime', t ? dayjs().format('YYYY-MM-DD') + 'T' + t + ':00' : '');
                          }}
                          sx={{ width: 120, ...inputSx }}
                          InputLabelProps={{ shrink: true }}
                          disabled={timeDisabled}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          size="small"
                          value={edited[r.employeeId]?.checkOutTimeStr || ''}
                          onChange={(e) => {
                            const t = e.target.value;
                            setRowField(r.employeeId, 'checkOutTimeStr', t);
                            setRowField(r.employeeId, 'checkOutTime', t ? dayjs().format('YYYY-MM-DD') + 'T' + t + ':00' : '');
                          }}
                          sx={{ width: 120, ...inputSx }}
                          InputLabelProps={{ shrink: true }}
                          disabled={timeDisabled}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Optional"
                          value={edited[r.employeeId]?.notes || ''}
                          onChange={(e) => setRowField(r.employeeId, 'notes', e.target.value)}
                          sx={{ width: 160, ...inputSx }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Monthly Sheet — per-employee history.
// ---------------------------------------------------------------------------
const MonthlySheet = () => {
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

  const selected = employees.find((e) => String(e.id) === String(employeeId));
  const periodLabel = `${MONTHS[month - 1] || ''} ${year}`;
  const count = (s) => days.filter((d) => d.status === s).length;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {employeeId && !loading && days.length > 0 && (
        <StatGrid min={180} sx={{ mb: 3 }}>
          <StatTile icon={IconCircleCheck} tone="success" label="Present" value={count('present')} hint={periodLabel} />
          <StatTile icon={IconCircleX} tone="error" label="Absent" value={count('absent')} hint={periodLabel} />
          <StatTile icon={IconAlarm} tone="warning" label="Late / half day" value={count('late') + count('half_day')} hint={periodLabel} />
          <StatTile icon={IconBeach} tone="info" label="On leave" value={count('on_leave')} hint={periodLabel} />
        </StatGrid>
      )}

      <SectionCard
        icon={IconCalendarCheck}
        title={selected ? `${selected.first_name || ''} ${selected.last_name || ''}`.trim() : 'Monthly sheet'}
        subtitle={selected ? `${selected.employee_code || ''}${selected.employee_code ? ' · ' : ''}${periodLabel}` : 'Pick an employee to review their month'}
        noPadding
      >
        <FilterBar>
          <TextField select size="small" label="Employee" value={employeeId} sx={{ minWidth: 260, flex: { xs: '1 1 100%', sm: '0 1 auto' }, ...inputSx }} onChange={(e) => setEmployeeId(e.target.value)}>
            <MenuItem value="">Select employee</MenuItem>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 140, ...inputSx }}>
            {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100, ...inputSx }} />
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : !employeeId ? (
          <EmptyState icon={IconUserSearch} title="No employee selected" message="Select an employee to view and edit their monthly attendance sheet." compact />
        ) : days.length === 0 ? (
          <EmptyState icon={IconCalendarOff} title="No records" message="No attendance has been recorded for this period." compact />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ ...tableSx, minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check in</TableCell>
                  <TableCell>Check out</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right" />
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
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" color={d.notes ? 'text.secondary' : 'text.disabled'} noWrap>{d.notes || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit day">
                        <IconButton size="small" onClick={() => openEdit(d)} sx={{ borderRadius: 1.5 }}>
                          <IconEdit size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={!!editDay} onClose={() => setEditDay(null)} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Edit attendance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>{fmtDate(editDay?.date, 'dddd, DD MMM YYYY') || editDay?.date}</Typography>
          <Stack spacing={2} mt={1}>
            <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} sx={inputSx}>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
            </TextField>
            <TextField type="datetime-local" label="Check in" InputLabelProps={{ shrink: true }} value={editForm.checkInTime} onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })} sx={inputSx} />
            <TextField type="datetime-local" label="Check out" InputLabelProps={{ shrink: true }} value={editForm.checkOutTime} onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })} sx={inputSx} />
            <TextField label="Notes" multiline rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} sx={inputSx} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditDay(null)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} sx={{ borderRadius: 2, fontWeight: 600 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const AttendanceSheet = () => {
  const [tab, setTab] = useState(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <HrPage
        title="Attendance Management"
        description="Mark today's attendance for everyone, or review a monthly sheet"
        subtitle="Mark today's attendance for the whole team, or review an individual's monthly history."
      >
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 44, fontWeight: 600, textTransform: 'none' } }}
        >
          <Tab icon={<IconUsersGroup size={16} />} iconPosition="start" label="Today's attendance" />
          <Tab icon={<IconCalendarCheck size={16} />} iconPosition="start" label="Monthly sheet" />
        </Tabs>

        {tab === 0 ? <TodaysAttendance /> : <MonthlySheet />}
      </HrPage>
    </LocalizationProvider>
  );
};

export default AttendanceSheet;
