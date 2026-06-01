import React, { useState } from 'react';
import {
  Box, Typography, Stack, Paper, Button, Chip, Alert, Divider, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconMapPin, IconPhone, IconCheck, IconPlayerPlay,
  IconClockHour4, IconAlertTriangle, IconCalendar, IconCalendarDue, IconRoute,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';
import RoutePlannerDialog from '../../../components/RoutePlannerDialog';

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
  overdue: {
    label: 'OVERDUE',
    chipColor: '#fff',
    chipBg: '#D32F2F',
    borderColor: '#D32F2F',
    headerBg: 'rgba(211,47,47,0.07)',
    icon: IconAlertTriangle,
    iconColor: '#D32F2F',
    sectionTitle: 'Overdue',
  },
  today: {
    label: 'TODAY',
    chipColor: '#fff',
    chipBg: '#E65100',
    borderColor: '#E65100',
    headerBg: 'rgba(230,81,0,0.07)',
    icon: IconCalendarDue,
    iconColor: '#E65100',
    sectionTitle: "Due today",
  },
  upcoming: {
    label: 'UPCOMING',
    chipColor: '#fff',
    chipBg: '#1565C0',
    borderColor: '#1565C0',
    headerBg: 'rgba(21,101,192,0.06)',
    icon: IconCalendar,
    iconColor: '#1565C0',
    sectionTitle: 'Upcoming',
  },
};

// ─── KPI strip ────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, color, highlight }) => {
  const theme = useTheme();
  const c = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        py: 1.5,
        px: 1,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: highlight ? alpha(c, 0.4) : 'divider',
        bgcolor: highlight ? alpha(c, 0.06) : 'background.paper',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h4"
        fontWeight={900}
        sx={{ color: highlight ? c : 'text.primary', lineHeight: 1.1, fontSize: '1.6rem' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.62rem' }}>
        {label}
      </Typography>
    </Paper>
  );
};

// ─── Single pickup card ───────────────────────────────────────────────────────
const PickupCard = ({ pickup, onRefresh }) => {
  const theme = useTheme();
  const [acting, setAct] = useState(null);
  const [err, setErr] = useState('');
  const cfg = PRIORITY[pickup.priority] || PRIORITY.upcoming;

  const act = async (action) => {
    try {
      setAct(action);
      setErr('');
      if (action === 'start') await apiService.startDriverPickup(pickup.taskId);
      else await apiService.completeDriverPickup(pickup.taskId);
      onRefresh?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setAct(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '2px solid',
        borderColor: cfg.borderColor,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Card header */}
      <Box sx={{ px: 2.5, py: 1.75, bgcolor: cfg.headerBg, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight={800} lineHeight={1.25} noWrap>
              {pickup.deal?.title || pickup.workOrderTitle || `WO #${pickup.workOrderId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {pickup.deal?.deal_number && `#${pickup.deal.deal_number} · `}
              {pickup.typeOfWork || 'Pickup'}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
            <Chip
              label={cfg.label}
              size="small"
              sx={{ bgcolor: cfg.chipBg, color: cfg.chipColor, fontWeight: 800, letterSpacing: 0.8, fontSize: '0.68rem', height: 22 }}
            />
            {pickup.daysOverdue > 0 && (
              <Typography variant="caption" color="error" fontWeight={700}>
                {pickup.daysOverdue}d overdue
              </Typography>
            )}
            {pickup.endDate && pickup.daysOverdue === 0 && (
              <Typography variant="caption" color="text.disabled">
                Due {pickup.endDate}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Card body */}
      <Box sx={{ px: 2.5, py: 2 }}>
        {err && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 0.25 }}>{err}</Alert>}

        {pickup.notes && (
          <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontStyle: 'italic' }}>
            "{pickup.notes}"
          </Typography>
        )}

        {/* Maps button */}
        {pickup.deal?.pickup_location && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<IconMapPin size={20} />}
            href={pickup.deal.pickup_location}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mb: 1.5,
              borderRadius: 2.5,
              py: 1.4,
              fontWeight: 700,
              fontSize: '0.95rem',
              borderColor: cfg.borderColor,
              color: cfg.borderColor,
              borderWidth: 2,
              '&:hover': { borderWidth: 2, borderColor: cfg.borderColor },
            }}
          >
            Open on maps
          </Button>
        )}

        {/* Contact info */}
        {(pickup.deal?.pickup_contact_name || pickup.deal?.pickup_contact_number) && (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, px: 2, py: 1.5, mb: 1.5, bgcolor: alpha(theme.palette.info.main, 0.04) }}
          >
            {pickup.deal?.pickup_contact_name && (
              <Typography variant="body1" fontWeight={700} lineHeight={1.3}>
                {pickup.deal.pickup_contact_name}
              </Typography>
            )}
            {pickup.deal?.pickup_contact_number && (
              <Button
                component="a"
                href={`tel:${pickup.deal.pickup_contact_number}`}
                startIcon={<IconPhone size={18} />}
                sx={{ justifyContent: 'flex-start', fontSize: '1rem', fontWeight: 700, p: 0, mt: 0.5, minWidth: 0 }}
              >
                {pickup.deal.pickup_contact_number}
              </Button>
            )}
          </Paper>
        )}

        {/* Action buttons */}
        {pickup.taskStatus === 'not_started' && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={acting === 'start' ? <CircularProgress size={18} color="inherit" /> : <IconPlayerPlay size={20} />}
            disabled={acting === 'start'}
            onClick={() => act('start')}
            sx={{
              borderRadius: 2.5,
              py: 1.4,
              fontWeight: 800,
              fontSize: '1rem',
              mb: 1,
              borderColor: cfg.borderColor,
              color: cfg.borderColor,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 },
            }}
          >
            {acting === 'start' ? 'Starting…' : 'Start pickup'}
          </Button>
        )}

        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          startIcon={acting === 'complete' ? <CircularProgress size={20} color="inherit" /> : <IconCheck size={22} />}
          disabled={!!acting}
          onClick={() => act('complete')}
          sx={{
            borderRadius: 2.5,
            py: 1.75,
            fontWeight: 800,
            fontSize: '1.05rem',
            boxShadow: `0 4px 18px ${alpha(theme.palette.success.main, 0.28)}`,
          }}
        >
          {acting === 'complete' ? 'Saving…' : 'Mark as collected'}
        </Button>
      </Box>
    </Paper>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ priority, pickups, onRefresh }) => {
  const cfg = PRIORITY[priority];
  const Icon = cfg.icon;
  return (
    <Box mb={3.5}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Icon size={18} color={cfg.iconColor} />
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: cfg.iconColor }}>
          {cfg.sectionTitle}
        </Typography>
        <Chip
          label={pickups.length}
          size="small"
          sx={{ height: 20, fontWeight: 800, fontSize: '0.7rem', bgcolor: cfg.chipBg, color: cfg.chipColor }}
        />
      </Stack>
      <Stack spacing={2.5}>
        {pickups.map((p) => (
          <PickupCard key={p.taskId} pickup={p} onRefresh={onRefresh} />
        ))}
      </Stack>
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const DriverDashboard = ({ data, onRefresh }) => {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.firstName || '';
  const theme = useTheme();
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);

  const overdue   = data.overdue   || [];
  const today     = data.today     || [];
  const upcoming  = data.upcoming  || [];
  const completed = data.completedToday || [];
  const allActive = [...overdue, ...today, ...upcoming];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
      </Box>

      {/* KPI strip */}
      <Stack direction="row" spacing={1.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <StatChip key={k.label} {...k} />
        ))}
      </Stack>

      {/* Route planner button */}
      {allActive.length > 0 && (
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<IconRoute size={20} />}
          onClick={() => setRoutePlannerOpen(true)}
          sx={{ mb: 3, borderRadius: 2.5, py: 1.4, fontWeight: 700, fontSize: '0.95rem', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
        >
          Plan My Route ({allActive.length} stop{allActive.length !== 1 ? 's' : ''})
        </Button>
      )}

      <RoutePlannerDialog
        open={routePlannerOpen}
        onClose={() => setRoutePlannerOpen(false)}
        pickups={allActive}
      />

      {/* No active pickups empty state */}
      {allActive.length === 0 && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 5, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed', mb: 3 }}
        >
          <IconClockHour4 size={40} color={theme.palette.text.disabled} />
          <Typography variant="h6" fontWeight={700} color="text.secondary" mt={2}>
            No active pickups assigned
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            Contact your manager if you're expecting an assignment
          </Typography>
        </Paper>
      )}

      {/* Overdue section */}
      {overdue.length > 0 && (
        <Section priority="overdue" pickups={overdue} onRefresh={onRefresh} />
      )}

      {/* Today section */}
      {today.length > 0 && (
        <Section priority="today" pickups={today} onRefresh={onRefresh} />
      )}

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <>
          {(overdue.length > 0 || today.length > 0) && <Divider sx={{ mb: 3 }} />}
          <Section priority="upcoming" pickups={upcoming} onRefresh={onRefresh} />
        </>
      )}

      {/* Completed today section */}
      {completed.length > 0 && (
        <>
          <Divider sx={{ mb: 2.5 }} />
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
            Completed today ({completed.length})
          </Typography>
          <Stack spacing={1}>
            {completed.map((p) => (
              <Paper
                key={p.taskId}
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconCheck size={16} color={theme.palette.success.main} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {p.deal?.title || p.workOrderTitle || `WO #${p.workOrderId}`}
                  </Typography>
                  {p.deal?.deal_number && (
                    <Typography variant="caption" color="text.disabled">
                      #{p.deal.deal_number}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label="Collected"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                />
              </Paper>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default DriverDashboard;
