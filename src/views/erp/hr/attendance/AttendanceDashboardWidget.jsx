import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Button, CircularProgress, Stack, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconClock, IconLogin, IconLogout, IconCircleCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import apiService from '../../../../services/api';
import { HrThemeScope, StatusChip, cardSx } from '../components/HrUi';

/**
 * Compact Check-In/Check-Out card meant to be embedded on the main ERP dashboard for
 * every logged-in user. Renders null (no error) if the current user has no linked
 * employee record — self-service attendance is opt-in per employee, not universal.
 */

const TimeSlot = ({ label, value }) => (
  <Box sx={{ minWidth: 72 }}>
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
      {label}
    </Typography>
    <Typography variant="subtitle1" fontWeight={700} color={value ? 'text.primary' : 'text.disabled'} lineHeight={1.3}>
      {value || '--:--'}
    </Typography>
  </Box>
);

const AttendanceDashboardWidget = () => {
  const [hasEmployee, setHasEmployee] = useState(null); // null = unknown/loading
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      await apiService.getMyEmployeeRecord();
      setHasEmployee(true);
      const res = await apiService.getHrTodayAttendance();
      if (res.success) setToday(res.data);
    } catch (err) {
      // 404 => no linked employee record; render nothing rather than erroring
      setHasEmployee(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await apiService.hrCheckIn();
      if (res.success) setToday(res.data);
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await apiService.hrCheckOut();
      if (res.success) setToday(res.data);
    } catch (err) {
      setError(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (hasEmployee === false) return null;

  const cardStyles = { ...cardSx, p: { xs: 2, sm: 2.5 }, mb: 3 };

  if (loading && hasEmployee === null) {
    return (
      <HrThemeScope>
        <Card elevation={0} sx={cardStyles}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2.5 }} />
            <Box flex={1}>
              <Skeleton width={160} />
              <Skeleton width={220} />
            </Box>
          </Stack>
        </Card>
      </HrThemeScope>
    );
  }

  const checkedIn = !!today?.check_in_time;
  const checkedOut = !!today?.check_out_time;

  const fmtTime = (t) => (t ? dayjs(t).format('HH:mm') : '');

  const tone = checkedOut ? 'success' : checkedIn ? 'primary' : 'warning';
  const message = checkedOut
    ? `Checked out at ${fmtTime(today.check_out_time)}`
    : checkedIn
      ? `Checked in at ${fmtTime(today.check_in_time)}`
      : "You haven't checked in yet today";

  return (
    <HrThemeScope>
      <Card elevation={0} sx={cardStyles}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.75} alignItems="center" minWidth={0}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5, flexShrink: 0, display: 'grid', placeItems: 'center',
              bgcolor: (t) => alpha(t.palette[tone].main, 0.12), color: (t) => t.palette[tone].main,
            }}
            >
              {checkedOut ? <IconCircleCheck size={22} /> : <IconClock size={22} />}
            </Box>
            <Box minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>Today&apos;s attendance</Typography>
                {today?.status && <StatusChip status={today.status} tone={today.status === 'on_leave' ? 'info' : undefined} />}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {dayjs().format('dddd, D MMM')} · {message}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={3}>
              <TimeSlot label="In" value={fmtTime(today?.check_in_time)} />
              <TimeSlot label="Out" value={fmtTime(today?.check_out_time)} />
            </Stack>
            {!checkedIn && (
              <Button
                variant="contained"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <IconLogin size={18} />}
                disabled={actionLoading}
                onClick={handleCheckIn}
                sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 'none', minWidth: 130 }}
              >
                Check In
              </Button>
            )}
            {checkedIn && !checkedOut && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <IconLogout size={18} />}
                disabled={actionLoading}
                onClick={handleCheckOut}
                sx={{ borderRadius: 2, fontWeight: 600, minWidth: 130 }}
              >
                Check Out
              </Button>
            )}
          </Stack>
        </Stack>
        {error && <Typography variant="body2" color="error" mt={1.5}>{error}</Typography>}
      </Card>
    </HrThemeScope>
  );
};

export default AttendanceDashboardWidget;
