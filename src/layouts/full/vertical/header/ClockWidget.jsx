import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconButton, Box, Badge, Menu, Typography, Button, CircularProgress, Stack,
} from '@mui/material';
import { IconClockHour4, IconClockPlay, IconClockPause, IconClockCheck } from '@tabler/icons-react';
import apiService from 'src/services/api';

/** Best-effort geolocation lookup — never blocks the caller, resolves { lat, lng } or {} */
function getCoordsBestEffort(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve({}); return; }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve({}); }
    }, timeoutMs);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({});
        },
        { timeout: timeoutMs, maximumAge: 60000 }
      );
    } catch {
      if (!settled) { settled = true; clearTimeout(timer); resolve({}); }
    }
  });
}

function formatElapsed(checkInTime) {
  if (!checkInTime) return '';
  const diffMs = Date.now() - new Date(checkInTime).getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

const ClockWidget = () => {
  // null = unknown/loading, false = confirmed no employee record, object = has employee
  const [hasEmployee, setHasEmployee] = useState(null);
  const [record, setRecord] = useState(null); // today's attendance record, or null
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [, forceTick] = useState(0);
  const checkedRef = useRef(false);

  const load = useCallback(async () => {
    if (checkedRef.current && hasEmployee === false) return;
    try {
      setLoading(true);
      const meRes = await apiService.getMyEmployeeRecord();
      if (!meRes.success || !meRes.data) {
        setHasEmployee(false);
        checkedRef.current = true;
        return;
      }
      setHasEmployee(true);
      checkedRef.current = true;
      const todayRes = await apiService.getHrTodayAttendance();
      setRecord(todayRes.success ? todayRes.data : null);
    } catch (err) {
      // 404 / no employee record linked — treat as "no employee", don't error the header
      if (err.status === 404) {
        setHasEmployee(false);
      } else {
        // Network/server blip: leave state as-is, silently retry next mount
        setHasEmployee((prev) => (prev === null ? false : prev));
      }
      checkedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [hasEmployee]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Live-update the elapsed time display every minute while checked in
  useEffect(() => {
    if (!record?.check_in_time || record?.check_out_time) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [record]);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const doCheckIn = async () => {
    setActing(true);
    try {
      const coords = await getCoordsBestEffort();
      const res = await apiService.hrCheckIn(coords);
      if (res.success) setRecord(res.data);
    } catch {
      // best-effort — refresh from server to reflect true state
      try {
        const todayRes = await apiService.getHrTodayAttendance();
        if (todayRes.success) setRecord(todayRes.data);
      } catch { /* ignore */ }
    } finally {
      setActing(false);
    }
  };

  const doCheckOut = async () => {
    setActing(true);
    try {
      const coords = await getCoordsBestEffort();
      const res = await apiService.hrCheckOut(coords);
      if (res.success) setRecord(res.data);
    } catch {
      try {
        const todayRes = await apiService.getHrTodayAttendance();
        if (todayRes.success) setRecord(todayRes.data);
      } catch { /* ignore */ }
    } finally {
      setActing(false);
    }
  };

  if (hasEmployee === false) return null;
  if (hasEmployee === null && loading) {
    // Avoid a layout-shifting spinner in the header; render nothing until we know.
    return null;
  }

  const checkedIn = !!record?.check_in_time;
  const checkedOut = !!record?.check_out_time;

  let icon = <IconClockHour4 size="21" stroke="1.5" />;
  let badgeColor = 'default';
  if (checkedIn && !checkedOut) { icon = <IconClockPlay size="21" stroke="1.5" />; badgeColor = 'success'; }
  else if (checkedOut) { icon = <IconClockCheck size="21" stroke="1.5" />; badgeColor = 'default'; }

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="clock in / clock out"
        color="inherit"
        aria-controls="clock-widget-menu"
        aria-haspopup="true"
        sx={{ ...(anchorEl && { color: 'primary.main' }) }}
        onClick={handleOpen}
      >
        <Badge
          variant="dot"
          color={badgeColor === 'success' ? 'success' : 'default'}
          invisible={!checkedIn}
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {icon}
        </Badge>
      </IconButton>
      <Menu
        id="clock-widget-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ '& .MuiMenu-paper': { width: '280px', maxWidth: 'calc(100vw - 32px)', p: 2 } }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h6">Attendance</Typography>
          {!checkedIn ? (
            <>
              <Typography variant="body2" color="text.secondary">You haven&apos;t checked in today.</Typography>
              <Button
                variant="contained"
                fullWidth
                disabled={acting}
                onClick={async () => { await doCheckIn(); }}
                startIcon={acting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {acting ? 'Checking in...' : 'Clock In'}
              </Button>
            </>
          ) : !checkedOut ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Checked in at {formatTime(record.check_in_time)}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatElapsed(record.check_in_time)} elapsed
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                disabled={acting}
                onClick={async () => { await doCheckOut(); }}
                startIcon={acting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {acting ? 'Checking out...' : 'Clock Out'}
              </Button>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Checked out at {formatTime(record.check_out_time)}
            </Typography>
          )}
        </Stack>
      </Menu>
    </Box>
  );
};

export default ClockWidget;
