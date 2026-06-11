import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconAlertTriangle,
  IconCalendar,
  IconCalendarDue,
  IconCheck,
  IconChevronRight,
  IconClockHour4,
  IconRefresh,
  IconTruck,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';

// ── Priority config ────────────────────────────────────────────────────────
const P = {
  overdue:  { label: 'Overdue',    color: '#D32F2F', bg: 'rgba(211,47,47,0.07)',   icon: IconAlertTriangle },
  today:    { label: 'Today',      color: '#E65100', bg: 'rgba(230,81,0,0.07)',    icon: IconCalendarDue  },
  upcoming: { label: 'Upcoming',   color: '#1565C0', bg: 'rgba(21,101,192,0.06)',  icon: IconCalendar     },
  completed:{ label: 'Collected',  color: '#2E7D32', bg: 'rgba(46,125,50,0.06)',   icon: IconCheck        },
};

const TABS = [
  { key: 'all',       label: 'All'      },
  { key: 'overdue',   label: 'Overdue'  },
  { key: 'today',     label: 'Today'    },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Done'     },
];

// ── Single row ────────────────────────────────────────────────────────────
const PickupRow = ({ pickup }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const cfg = P[pickup.priority] || P.upcoming;
  const Ico = cfg.icon;

  const title = pickup.deal?.title || pickup.workOrderTitle || `WO #${pickup.workOrderId}`;
  const sub   = [
    pickup.deal?.deal_number && `#${pickup.deal.deal_number}`,
    pickup.typeOfWork,
  ].filter(Boolean).join(' · ');

  return (
    <Paper
      elevation={0}
      onClick={() => navigate(`/erp/driver/pickups/${pickup.taskId}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(cfg.color, 0.25),
        borderLeft: `4px solid ${cfg.color}`,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, background-color 0.15s',
        '&:hover': {
          bgcolor: alpha(cfg.color, 0.04),
          boxShadow: `0 2px 12px ${alpha(cfg.color, 0.14)}`,
        },
      }}
    >
      {/* Priority icon */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ico size={18} color={cfg.color} />
      </Box>

      {/* Main info */}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {title}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {sub}
          </Typography>
        )}
        {pickup.daysOverdue > 0 && (
          <Typography variant="caption" color="error" fontWeight={700}>
            {pickup.daysOverdue}d overdue
          </Typography>
        )}
      </Box>

      {/* Right side */}
      <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
        <Chip
          label={cfg.label}
          size="small"
          sx={{
            bgcolor: cfg.bg,
            color: cfg.color,
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 20,
            border: `1px solid ${alpha(cfg.color, 0.3)}`,
          }}
        />
        {pickup.endDate && pickup.priority !== 'completed' && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
            Due {new Date(`${pickup.endDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Typography>
        )}
      </Stack>

      <IconChevronRight size={18} color={theme.palette.text.disabled} />
    </Paper>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────
const EmptyState = ({ tab }) => {
  const theme = useTheme();
  const msgs = {
    all:       ['No pickups assigned', 'You have no pickup tasks yet'],
    overdue:   ['No overdue pickups', 'You\'re all caught up'],
    today:     ['Nothing due today', 'Check upcoming for future stops'],
    upcoming:  ['No upcoming pickups', 'You\'re all clear'],
    completed: ['Nothing completed yet', 'Completed pickups will appear here'],
  };
  const [title, sub] = msgs[tab] || msgs.all;
  return (
    <Box sx={{ py: 7, textAlign: 'center' }}>
      <IconClockHour4 size={44} color={theme.palette.text.disabled} />
      <Typography variant="h6" fontWeight={700} color="text.secondary" mt={2}>{title}</Typography>
      <Typography variant="body2" color="text.disabled" mt={0.5}>{sub}</Typography>
    </Box>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const DriverPickupList = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const firstName = user?.first_name || user?.firstName || '';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getDriverPickups();
      setPickups(res.data || res || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === 'all' ? pickups : pickups.filter((p) => p.priority === tab);

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? pickups.length : pickups.filter((p) => p.priority === t.key).length;
    return acc;
  }, {});

  return (
    <Box sx={{ maxWidth: 620, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
        <Box>
          <Typography variant="h4" fontWeight={900} lineHeight={1.2}>
            {greet}{firstName ? `, ${firstName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        <IconButton onClick={load} disabled={loading} size="small">
          <IconRefresh size={20} />
        </IconButton>
      </Stack>

      {/* Summary strip */}
      {!loading && !error && pickups.length > 0 && (
        <Stack direction="row" spacing={1} mb={2.5}>
          {[
            { key: 'overdue',  color: '#D32F2F', bg: 'rgba(211,47,47,0.08)'  },
            { key: 'today',    color: '#E65100', bg: 'rgba(230,81,0,0.07)'   },
            { key: 'upcoming', color: '#1565C0', bg: 'rgba(21,101,192,0.06)' },
            { key: 'completed',color: '#2E7D32', bg: 'rgba(46,125,50,0.06)'  },
          ].map(({ key, color, bg }) => counts[key] > 0 && (
            <Paper
              key={key}
              elevation={0}
              onClick={() => setTab(key)}
              sx={{
                flex: 1,
                py: 1.25,
                px: 1,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: tab === key ? alpha(color, 0.5) : 'divider',
                bgcolor: tab === key ? bg : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <Typography variant="h5" fontWeight={900} sx={{ color, lineHeight: 1.1 }}>
                {counts[key]}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>
                {P[key]?.label}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8rem', minHeight: 44, py: 1.25 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.key}
              value={t.key}
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <span>{t.label}</span>
                  {counts[t.key] > 0 && (
                    <Box
                      sx={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: '9px',
                        bgcolor: t.key === 'overdue' ? 'error.main'
                          : t.key === 'today' ? 'warning.main'
                          : t.key === 'completed' ? 'success.main'
                          : 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.62rem', color: '#fff', fontWeight: 900 }}>{counts[t.key]}</Typography>
                    </Box>
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <Stack spacing={1.5}>
              {filtered.map((p) => (
                <PickupRow key={p.taskId} pickup={p} />
              ))}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DriverPickupList;
