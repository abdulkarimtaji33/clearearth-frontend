import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { IconUsers, IconUserCheck, IconClockExclamation, IconUserOff, IconBeach, IconClipboardCheck } from '@tabler/icons-react';
import apiService from '../../../services/api';
import { HrThemeScope, StatTile, StatGrid, fmtDate } from './components/HrUi';

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

  const pendingApprovals = (pendingLeave ?? 0) + (pendingRegularizations ?? 0);

  return (
    <HrThemeScope>
      <Box mb={3}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>HR Overview</Typography>
          <Typography variant="caption" color="text.secondary">Today · {fmtDate(new Date())}</Typography>
        </Stack>
        <StatGrid min={170}>
          <StatTile icon={IconUsers} label="Active headcount" value={headcount} tone="primary" loading={loading} />
          <StatTile icon={IconUserCheck} label="Present today" value={attendanceCounts.present} tone="success" loading={loading} />
          <StatTile icon={IconClockExclamation} label="Late today" value={attendanceCounts.late} tone="warning" loading={loading} />
          <StatTile icon={IconUserOff} label="Absent today" value={attendanceCounts.absent} tone="error" loading={loading} />
          <StatTile icon={IconBeach} label="On leave today" value={attendanceCounts.on_leave} tone="info" loading={loading} />
          <StatTile
            icon={IconClipboardCheck}
            label="Pending approvals"
            value={pendingApprovals}
            hint={`${pendingLeave ?? 0} leave · ${pendingRegularizations ?? 0} attendance`}
            tone="secondary"
            loading={loading}
          />
        </StatGrid>
      </Box>
    </HrThemeScope>
  );
};

export default HrDashboardWidgets;
