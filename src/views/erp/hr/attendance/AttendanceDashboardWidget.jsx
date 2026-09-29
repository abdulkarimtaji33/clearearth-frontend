import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Button, Chip, CircularProgress, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconClock, IconLogin, IconLogout } from '@tabler/icons-react';
import apiService from '../../../../services/api';

/**
 * Compact Check-In/Check-Out card meant to be embedded on the main ERP dashboard for
 * every logged-in user. Renders null (no error) if the current user has no linked
 * employee record — self-service attendance is opt-in per employee, not universal.
 */
const AttendanceDashboardWidget = () => {
  const theme = useTheme();
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
  if (loading && hasEmployee === null) {
    return (
      <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
      </Card>
    );
  }

  const checkedIn = !!today?.check_in_time;
  const checkedOut = !!today?.check_out_time;

  const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconClock size={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Today's Attendance</Typography>
            {checkedOut ? (
              <Typography variant="body2" color="text.secondary">Checked out at {fmtTime(today.check_out_time)}</Typography>
            ) : checkedIn ? (
              <Typography variant="body2" color="text.secondary">Checked in at {fmtTime(today.check_in_time)}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">You haven't checked in yet today</Typography>
            )}
          </Box>
          {today?.status && <Chip size="small" label={today.status.replace('_', ' ')} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />}
        </Stack>
        <Box>
          {!checkedIn && (
            <Button variant="contained" startIcon={<IconLogin size={18} />} disabled={actionLoading} onClick={handleCheckIn} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Check In
            </Button>
          )}
          {checkedIn && !checkedOut && (
            <Button variant="outlined" color="secondary" startIcon={<IconLogout size={18} />} disabled={actionLoading} onClick={handleCheckOut} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Check Out
            </Button>
          )}
        </Box>
      </Stack>
      {error && <Typography variant="body2" color="error" mt={1}>{error}</Typography>}
    </Card>
  );
};

export default AttendanceDashboardWidget;
