import React, { useState } from 'react';
import {
  Box, Typography, Stack, Paper, Button, Chip, Alert,
  CircularProgress, Divider, Tabs, Tab, Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconMapPin, IconPhone, IconCheck, IconPlayerPlay,
  IconClockHour4, IconAlertTriangle, IconCalendar, IconCalendarDue,
  IconRoute, IconList, IconCheckbox, IconNavigation,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';
import RoutePlannerDialog from '../../../components/RoutePlannerDialog';

// ── Priority config ────────────────────────────────────────────────────────────
const P = {
  overdue: { label: 'OVERDUE', bg: '#D32F2F', light: 'rgba(211,47,47,0.08)', border: '#D32F2F', icon: IconAlertTriangle, iconColor: '#D32F2F' },
  today:   { label: 'TODAY',   bg: '#E65100', light: 'rgba(230,81,0,0.07)',   border: '#E65100', icon: IconCalendarDue,  iconColor: '#E65100' },
  upcoming:{ label: 'UPCOMING',bg: '#1565C0', light: 'rgba(21,101,192,0.06)', border: '#1565C0', icon: IconCalendar,     iconColor: '#1565C0' },
};

// ── Single pickup card ─────────────────────────────────────────────────────────
const PickupCard = ({ pickup, onRefresh }) => {
  const theme = useTheme();
  const [acting, setAct] = useState(null);
  const [err, setErr] = useState('');
  const cfg = P[pickup.priority] || P.upcoming;

  const act = async (action) => {
    try {
      setAct(action); setErr('');
      if (action === 'start') await apiService.startDriverPickup(pickup.taskId);
      else await apiService.completeDriverPickup(pickup.taskId);
      onRefresh?.();
    } catch (e) { setErr(e.message); }
    finally { setAct(null); }
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '2px solid', borderColor: cfg.border, overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.75, bgcolor: cfg.light, borderBottom: '1px solid', borderColor: alpha(cfg.border, 0.25) }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight={800} lineHeight={1.25} noWrap>
              {pickup.deal?.title || pickup.workOrderTitle || `WO #${pickup.workOrderId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.2}>
              {pickup.deal?.deal_number && `#${pickup.deal.deal_number} · `}{pickup.typeOfWork || 'Pickup'}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
            <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: '#fff', fontWeight: 800, letterSpacing: 0.8, fontSize: '0.66rem', height: 22 }} />
            {pickup.daysOverdue > 0 ? (
              <Typography variant="caption" color="error" fontWeight={700}>{pickup.daysOverdue}d overdue</Typography>
            ) : pickup.endDate ? (
              <Typography variant="caption" color="text.disabled">Due {pickup.endDate}</Typography>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        {err && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 0.25 }}>{err}</Alert>}
        {pickup.notes && (
          <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
            "{pickup.notes}"
          </Typography>
        )}

        {/* Contact + Map row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1.5}>
          {pickup.deal?.pickup_location && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              component="a"
              href={pickup.deal.pickup_location}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<IconNavigation size={18} />}
              sx={{ borderRadius: 2.5, py: 1.3, fontWeight: 700, bgcolor: cfg.bg, '&:hover': { bgcolor: cfg.bg, filter: 'brightness(0.9)' }, boxShadow: `0 3px 12px ${alpha(cfg.border, 0.3)}` }}
            >
              Navigate
            </Button>
          )}
          {pickup.deal?.pickup_contact_number && (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              component="a"
              href={`tel:${pickup.deal.pickup_contact_number}`}
              startIcon={<IconPhone size={18} />}
              sx={{ borderRadius: 2.5, py: 1.3, fontWeight: 700, borderColor: cfg.border, color: cfg.border, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              {pickup.deal.pickup_contact_name || pickup.deal.pickup_contact_number}
            </Button>
          )}
        </Stack>

        {/* Contact name (if no phone) */}
        {pickup.deal?.pickup_contact_name && !pickup.deal?.pickup_contact_number && (
          <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">
            Contact: {pickup.deal.pickup_contact_name}
          </Typography>
        )}

        <Divider sx={{ mb: 1.5 }} />

        {/* Action buttons */}
        {pickup.taskStatus === 'not_started' && (
          <Button
            fullWidth variant="outlined" size="large"
            startIcon={acting === 'start' ? <CircularProgress size={18} color="inherit" /> : <IconPlayerPlay size={20} />}
            disabled={!!acting}
            onClick={() => act('start')}
            sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700, mb: 1, borderColor: cfg.border, color: cfg.border, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            {acting === 'start' ? 'Starting…' : 'Start pickup'}
          </Button>
        )}
        {pickup.taskStatus === 'in_progress' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="caption" color="success.main" fontWeight={700}>In progress</Typography>
          </Box>
        )}
        <Button
          fullWidth variant="contained" color="success" size="large"
          startIcon={acting === 'complete' ? <CircularProgress size={20} color="inherit" /> : <IconCheck size={22} />}
          disabled={!!acting}
          onClick={() => act('complete')}
          sx={{ borderRadius: 2.5, py: 1.75, fontWeight: 800, fontSize: '1.05rem', boxShadow: `0 4px 18px ${alpha(theme.palette.success.main, 0.28)}` }}
        >
          {acting === 'complete' ? 'Saving…' : 'Mark as collected'}
        </Button>
      </Box>
    </Paper>
  );
};

// ── Completed item row ─────────────────────────────────────────────────────────
const CompletedRow = ({ p }) => {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.25, borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.25), bgcolor: alpha(theme.palette.success.main, 0.03), display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.success.main, 0.15) }}>
        <IconCheck size={16} color={theme.palette.success.main} />
      </Avatar>
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>{p.deal?.title || p.workOrderTitle || `WO #${p.workOrderId}`}</Typography>
        {p.deal?.deal_number && <Typography variant="caption" color="text.disabled">#{p.deal.deal_number}</Typography>}
      </Box>
      <Chip label="Collected" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
    </Paper>
  );
};

// ── KPI tile ──────────────────────────────────────────────────────────────────
const KpiTile = ({ label, value, color, highlight }) => {
  const theme = useTheme();
  const c = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Paper elevation={0} sx={{ flex: 1, py: 1.5, px: 1, borderRadius: 2.5, border: '1px solid', borderColor: highlight ? alpha(c, 0.4) : 'divider', bgcolor: highlight ? alpha(c, 0.06) : 'background.paper', textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={900} sx={{ color: highlight ? c : 'text.primary', lineHeight: 1.1, fontSize: '1.6rem' }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.61rem' }}>{label}</Typography>
    </Paper>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const DriverDashboard = ({ data, onRefresh }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const firstName = user?.first_name || user?.firstName || '';
  const [tab, setTab] = useState(0);
  const [routeOpen, setRouteOpen] = useState(false);

  const overdue   = data.overdue   || [];
  const today     = data.today     || [];
  const upcoming  = data.upcoming  || [];
  const completed = data.completedToday || [];
  const allActive = [...overdue, ...today, ...upcoming];
  const todayStops = [...overdue, ...today];

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // detect any in-progress pickup
  const inProgress = allActive.find((p) => p.taskStatus === 'in_progress');

  return (
    <Box sx={{ maxWidth: 580, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box mb={2.5}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>
          {greet}{firstName ? `, ${firstName}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
      </Box>

      {/* ── KPI strip ── */}
      <Stack direction="row" spacing={1.5} mb={2.5}>
        {(data.kpis || []).map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </Stack>

      {/* ── In-progress banner ── */}
      {inProgress && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '2px solid', borderColor: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05), display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0, boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.3)}` }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="success.main" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem' }}>Currently active</Typography>
            <Typography variant="body2" fontWeight={700} noWrap>{inProgress.deal?.title || inProgress.workOrderTitle}</Typography>
          </Box>
          <Chip label="In progress" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
        </Paper>
      )}

      {/* ── Route planner button ── */}
      {allActive.length > 0 && (
        <Button fullWidth variant="outlined" size="large" startIcon={<IconRoute size={20} />} onClick={() => setRouteOpen(true)}
          sx={{ mb: 2.5, borderRadius: 2.5, py: 1.4, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
          Plan My Route ({allActive.length} stop{allActive.length !== 1 ? 's' : ''})
        </Button>
      )}

      <RoutePlannerDialog open={routeOpen} onClose={() => setRouteOpen(false)} pickups={allActive} />

      {/* ── Tabs ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', py: 1.5, minHeight: 48 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <IconCalendarDue size={16} />
                <span>Today</span>
                {todayStops.length > 0 && (
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: todayStops.some(p => p.priority === 'overdue') ? 'error.main' : 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#fff', fontWeight: 900 }}>{todayStops.length}</Typography>
                  </Box>
                )}
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <IconList size={16} />
                <span>Upcoming</span>
                {upcoming.length > 0 && (
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#fff', fontWeight: 900 }}>{upcoming.length}</Typography>
                  </Box>
                )}
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <IconCheckbox size={16} />
                <span>Done</span>
                {completed.length > 0 && (
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#fff', fontWeight: 900 }}>{completed.length}</Typography>
                  </Box>
                )}
              </Stack>
            }
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* ── Today tab ── */}
          {tab === 0 && (
            <>
              {todayStops.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <IconClockHour4 size={40} color={theme.palette.text.disabled} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary" mt={2}>No stops for today</Typography>
                  <Typography variant="body2" color="text.disabled" mt={0.5}>Check the Upcoming tab for future stops</Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {overdue.length > 0 && (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconAlertTriangle size={16} color="#D32F2F" />
                        <Typography variant="caption" fontWeight={800} color="error" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>Overdue ({overdue.length})</Typography>
                      </Stack>
                      {overdue.map((p) => <PickupCard key={p.taskId} pickup={p} onRefresh={onRefresh} />)}
                      {today.length > 0 && <Divider />}
                    </>
                  )}
                  {today.length > 0 && (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconCalendarDue size={16} color="#E65100" />
                        <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.6, color: '#E65100' }}>Due today ({today.length})</Typography>
                      </Stack>
                      {today.map((p) => <PickupCard key={p.taskId} pickup={p} onRefresh={onRefresh} />)}
                    </>
                  )}
                </Stack>
              )}
            </>
          )}

          {/* ── Upcoming tab ── */}
          {tab === 1 && (
            <>
              {upcoming.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <IconCalendar size={40} color={theme.palette.text.disabled} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary" mt={2}>No upcoming stops</Typography>
                  <Typography variant="body2" color="text.disabled" mt={0.5}>You're all caught up</Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconCalendar size={16} color="#1565C0" />
                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.6, color: '#1565C0' }}>Upcoming ({upcoming.length})</Typography>
                  </Stack>
                  {upcoming.map((p) => <PickupCard key={p.taskId} pickup={p} onRefresh={onRefresh} />)}
                </Stack>
              )}
            </>
          )}

          {/* ── Done tab ── */}
          {tab === 2 && (
            <>
              {completed.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <IconCheckbox size={40} color={theme.palette.text.disabled} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary" mt={2}>Nothing completed today yet</Typography>
                  <Typography variant="body2" color="text.disabled" mt={0.5}>Completed pickups will appear here</Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                    Completed today — {completed.length} stop{completed.length !== 1 ? 's' : ''}
                  </Typography>
                  {completed.map((p) => <CompletedRow key={p.taskId} p={p} />)}
                </Stack>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DriverDashboard;
