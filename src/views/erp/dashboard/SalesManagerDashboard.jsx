import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip, LinearProgress, Divider, Avatar, Button, Badge } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import { IconTrophy, IconMedal, IconArrowRight, IconUsers } from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';
import DashboardChart from './shared/DashboardChart';
import {
  IconCurrencyDollar, IconTrendingUp, IconAlertTriangle, IconClipboardList, IconClockHour4,
} from '@tabler/icons-react';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const STAGE_META = {
  new:            { color: '#9E9E9E', label: 'New' },
  approved:       { color: '#0288D1', label: 'Approved' },
  quotation_sent: { color: '#1565C0', label: 'Quotation sent' },
  negotiation:    { color: '#E65100', label: 'Negotiation' },
};

const KPI_ICONS = {
  'Pipeline value': IconCurrencyDollar,
  'Won deals': IconTrophy,
  'Stale deals (10d+)': IconAlertTriangle,
  'Active deals': IconClipboardList,
};

const initials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = ['#1565C0', '#2E7D32', '#6A1B9A', '#AD1457', '#E65100', '#00838F', '#F57F17'];

const SalesManagerDashboard = ({ data }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasAdminDashboardAccess } = useAuth();
  const maxWon = Math.max(...(data.leaderboard || []).map((r) => parseFloat(r.total || 0)), 1);
  const maxPipeline = Math.max(...(data.pipeline || []).map((p) => p.count), 1);

  const pipelineChartData = (data.pipeline || []).reduce((acc, p) => {
    const meta = STAGE_META[p.status];
    if (meta) acc[(meta.label)] = p.count;
    return acc;
  }, {});

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>Team performance</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>Leaderboard, pipeline and stale deals</Typography>
      </Box>

      {data.pendingApprovals?.total > 0 && (
        <Paper
          elevation={0}
          onClick={() => navigate('/erp/leads?status=pending_approval')}
          sx={{
            mb: 3, p: 2, borderRadius: 2, border: '1.5px solid', borderColor: 'warning.main',
            bgcolor: (t) => t.palette.warning.lighter || '#fffde7',
            display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
            '&:hover': { bgcolor: (t) => t.palette.warning.light || '#fff9c4' },
          }}
        >
          <IconClockHour4 size={22} />
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={800}>
              {data.pendingApprovals.total} pending approval{data.pendingApprovals.total !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[
                data.pendingApprovals.leads > 0 && `${data.pendingApprovals.leads} lead${data.pendingApprovals.leads !== 1 ? 's' : ''}`,
                data.pendingApprovals.deals > 0 && `${data.pendingApprovals.deals} deal${data.pendingApprovals.deals !== 1 ? 's' : ''}`,
                data.pendingApprovals.quotations > 0 && `${data.pendingApprovals.quotations} quotation${data.pendingApprovals.quotations !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Chip label="Review" size="small" color="warning" sx={{ fontWeight: 700 }} />
        </Paper>
      )}

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              {...k}
              icon={KPI_ICONS[k.label]}
              color={k.label?.includes('Stale') && k.value > 0 ? 'warning' : 'primary'}
              highlight={k.label?.includes('Stale') && k.value > 0}
            />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Stale deals needing attention" items={data.actionables} />
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      <Grid container spacing={2.5}>
        {/* Leaderboard */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconTrophy size={18} color={theme.palette.warning.main} />
                <Typography variant="subtitle2" fontWeight={800}>Won deals leaderboard</Typography>
              </Stack>
              {hasAdminDashboardAccess() && (
                <Button size="small" startIcon={<IconUsers size={14} />} onClick={() => navigate('/erp/users')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                  Team
                </Button>
              )}
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.leaderboard || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No won deals yet this period</Typography>
              ) : (
                data.leaderboard.map((row, i) => {
                  const total = parseFloat(row.total || 0);
                  const pct = (total / maxWon) * 100;
                  const name = row.user ? `${row.user.first_name} ${row.user.last_name}` : 'Unassigned';
                  const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <Box key={i} sx={{ px: 2.5, py: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: i < 3 ? alpha(MEDAL_COLORS[i], 0.15) : 'action.hover', fontSize: '0.75rem', fontWeight: 800, color: i < 3 ? MEDAL_COLORS[i] : 'text.secondary' }}>
                            {i < 3 ? <IconMedal size={16} /> : `${i + 1}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.count} deal{row.count !== 1 ? 's' : ''} won</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" fontWeight={900} color="success.main">
                          AED {total.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate" value={pct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: i === 0 ? '#FFD700' : 'success.main' } }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Pipeline */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>Pipeline by stage</Typography>
            </Box>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} sx={{ p: 0 }}>
              {(data.pipeline || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No pipeline data</Typography>
              ) : (
                (data.pipeline || []).map((p) => {
                  const meta = STAGE_META[p.status] || { color: '#9E9E9E', label: p.status };
                  const pct = maxPipeline > 0 ? (p.count / maxPipeline) * 100 : 0;
                  return (
                    <Box key={p.status} sx={{ px: 2.5, py: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.6}>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{meta.label}</Typography>
                        <Typography variant="body2" fontWeight={900} color={p.count > 0 ? 'text.primary' : 'text.disabled'}>{p.count}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate" value={pct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(meta.color, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: meta.color } }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesManagerDashboard;
