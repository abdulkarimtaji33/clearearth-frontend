import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Grid, Typography, CircularProgress, Stack } from '@mui/material';
import { IconUsers, IconUserCheck, IconClockExclamation, IconUserOff, IconBeach, IconClipboardCheck } from '@tabler/icons-react';
import apiService from '../../../services/api';

const StatCard = ({ icon, label, value, color = 'primary' }) => (
  <Card sx={{ p: 2, height: '100%' }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: (theme) => theme.palette[color]?.light || theme.palette.primary.light,
          color: (theme) => theme.palette[color]?.dark || theme.palette.primary.dark,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>{value ?? '-'}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Stack>
  </Card>
);

/**
 * HR-only dashboard widgets (visible to hr.employees.manage holders only — gated by
 * the caller). Built entirely from existing list/status-filter endpoints:
 * - Headcount: GET /hr/employees?status=active (pagination.totalItems)
 * - Today's attendance breakdown: GET /hr/attendance?dateFrom=today&dateTo=today (counted client-side)
 * - Pending leave requests: GET /hr/leave/requests?status=pending
 * - Pending regularizations: GET /hr/attendance/regularizations?status=pending
 *
 * NOTE: "documents expiring in 30 days" and "probation ending in 30 days" widgets were
 * SKIPPED — no backend endpoint/filter exists yet for date-range filtering on
 * employee_documents or employees.probation_end. See final report for details.
 */
const HrDashboardWidgets = () => {
  const [loading, setLoading] = useState(true);
  const [headcount, setHeadcount] = useState(null);
  const [attendanceCounts, setAttendanceCounts] = useState({ present: 0, late: 0, absent: 0, on_leave: 0 });
  const [pendingLeave, setPendingLeave] = useState(null);
  const [pendingRegularizations, setPendingRegularizations] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const [empRes, attRes, leaveRes, regRes] = await Promise.all([
        apiService.getHrEmployees({ status: 'active', pageSize: 1 }),
        apiService.listHrAttendance({ dateFrom: today, dateTo: today, pageSize: 500 }),
        apiService.listHrLeaveRequests({ status: 'pending' }),
        apiService.listAttendanceRegularizations({ status: 'pending' }),
      ]);
      if (empRes.success) setHeadcount(empRes.pagination?.totalItems ?? (empRes.data || []).length);
      if (attRes.success) {
        const counts = { present: 0, late: 0, absent: 0, on_leave: 0 };
        (attRes.data || []).forEach((r) => {
          if (counts[r.status] !== undefined) counts[r.status] += 1;
        });
        setAttendanceCounts(counts);
      }
      if (leaveRes.success) setPendingLeave((leaveRes.data || []).length);
      if (regRes.success) setPendingRegularizations((regRes.data || []).length);
    } catch {
      // Best-effort dashboard widgets — fail silently, keep placeholders
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box mb={3}>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>HR Overview</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconUsers size={22} />} label="Active headcount" value={headcount} color="primary" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconUserCheck size={22} />} label="Present today" value={attendanceCounts.present} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconClockExclamation size={22} />} label="Late today" value={attendanceCounts.late} color="warning" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconUserOff size={22} />} label="Absent today" value={attendanceCounts.absent} color="error" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconBeach size={22} />} label="On leave today" value={attendanceCounts.on_leave} color="info" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<IconClipboardCheck size={22} />} label="Pending approvals" value={(pendingLeave ?? 0) + (pendingRegularizations ?? 0)} color="secondary" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HrDashboardWidgets;
