import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { IconUsers, IconUserCheck, IconClockExclamation, IconUserOff, IconBeach, IconClipboardCheck } from '@tabler/icons-react';
import apiService from '../../../services/api';
import { HrThemeScope, StatTile, StatGrid, fmtDate } from './components/HrUi';
import { rangeToDates } from '../dashboard/shared/DateRangeFilter';

/**
 * HR-only dashboard widgets (gated by hr.employees.manage in the caller).
 * Headcount and pending approvals are live numbers; attendance tiles count
 * attendance records (employee-days) inside the dashboard's selected date range.
 */
const HrDashboardWidgets = ({ range }) => {
  const [loading, setLoading] = useState(true);
  const [headcount, setHeadcount] = useState(null);
  const [counts, setCounts] = useState({ present: 0, late: 0, absent: 0, on_leave: 0 });
  const [pendingLeave, setPendingLeave] = useState(null);
  const [pendingRegularizations, setPendingRegularizations] = useState(null);

  const { from, to } = rangeToDates(range || { period: 'month' });
  const single = from === to;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const countFor = (status) => apiService
        .listHrAttendance({ dateFrom: from, dateTo: to, status, pageSize: 1 })
        .then((r) => (r.success ? (r.pagination?.totalItems ?? (r.data || []).length) : 0))
        .catch(() => 0);
      const [empRes, present, late, absent, onLeave, leaveRes, regRes] = await Promise.all([
        apiService.getHrEmployees({ status: 'active', pageSize: 1 }),
        countFor('present'), countFor('late'), countFor('absent'), countFor('on_leave'),
        apiService.listHrLeaveRequests({ status: 'pending' }),
        apiService.listAttendanceRegularizations({ status: 'pending' }),
      ]);
      if (empRes.success) setHeadcount(empRes.pagination?.totalItems ?? (empRes.data || []).length);
      setCounts({ present, late, absent, on_leave: onLeave });
      if (leaveRes.success) setPendingLeave((leaveRes.data || []).length);
      if (regRes.success) setPendingRegularizations((regRes.data || []).length);
    } catch {
      // Best-effort widgets — keep placeholders
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const pendingApprovals = (pendingLeave ?? 0) + (pendingRegularizations ?? 0);
  const suffix = single ? '' : ' (days)';

  return (
    <HrThemeScope>
      <Box mb={3.5}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} mb={1.5}>
          <Typography variant="subtitle1" fontWeight={800}>People</Typography>
          <Typography variant="caption" color="text.secondary">
            Attendance · {single ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`}
          </Typography>
        </Stack>
        <StatGrid min={170}>
          <StatTile icon={IconUsers} label="Active employees" value={headcount} tone="primary" loading={loading} />
          <StatTile icon={IconUserCheck} label={`Present${suffix}`} value={counts.present} tone="success" loading={loading} />
          <StatTile icon={IconClockExclamation} label={`Late${suffix}`} value={counts.late} tone="warning" loading={loading} />
          <StatTile icon={IconUserOff} label={`Absent${suffix}`} value={counts.absent} tone="error" loading={loading} />
          <StatTile icon={IconBeach} label={`On leave${suffix}`} value={counts.on_leave} tone="info" loading={loading} />
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
