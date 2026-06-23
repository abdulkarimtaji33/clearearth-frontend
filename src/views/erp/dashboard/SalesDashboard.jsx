import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip, Button, Divider, LinearProgress } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconArrowRight, IconCurrencyDollar, IconTrophy, IconAlertTriangle, IconMapPin, IconClock,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';
import { useAuth } from '../../../context/AuthContext';

const STAGE_META = {
  new:              { color: 'default',  label: 'New' },
  approved:         { color: 'info',     label: 'Approved' },
  quotation_sent:   { color: 'primary',  label: 'Quotation sent' },
  negotiation:      { color: 'warning',  label: 'Negotiation' },
  won:              { color: 'success',  label: 'Won' },
  lost:             { color: 'error',    label: 'Lost' },
  pending_approval: { color: 'warning',  label: 'Pending approval' },
};

const KPI_ICONS = {
  'My open deals': IconCurrencyDollar,
  'Won this month': IconTrophy,
  'Needs follow-up': IconAlertTriangle,
  'Missing collection info': IconMapPin,
};

const SalesDashboard = ({ data }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const firstName = user?.first_name || user?.firstName || '';

  const maxPipelineCount = Math.max(...(data.pipeline || []).map((p) => p.count), 1);
  const pendingDeals = (data.recentDeals || []).filter((d) => d.status === 'pending_approval');

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>My pipeline</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {firstName ? `${firstName}'s` : 'Your'} deals and action items
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k, i) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              {...k}
              icon={KPI_ICONS[k.label]}
              color={i >= 2 && k.value > 0 ? 'warning' : 'primary'}
              highlight={i >= 2 && k.value > 0}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pending approval deals */}
      {pendingDeals.length > 0 && (
        <Paper elevation={0} sx={{ mb: 3, p: 0, borderRadius: 3, border: '1.5px solid', borderColor: 'warning.main', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.5, bgcolor: (t) => alpha(t.palette.warning.main, 0.07) }}>
            <IconClock size={16} color={theme.palette.warning.main} />
            <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
              {pendingDeals.length} deal{pendingDeals.length !== 1 ? 's' : ''} awaiting manager approval
            </Typography>
          </Stack>
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {pendingDeals.map((d) => (
              <Stack key={d.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ px: 2.5, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/erp/deals/view/${d.id}`)}>
                <Typography variant="body2" fontWeight={600}>{d.title || d.deal_number}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {d.total > 0 && <Typography variant="caption" color="text.secondary">AED {Number(d.total).toLocaleString()}</Typography>}
                  <Chip size="small" label="Pending" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem' }} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      <Box mb={3.5}>
        <ActionableList title="Action items" items={data.actionables} />
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      {/* Pipeline funnel */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle2" fontWeight={800}>Pipeline stages</Typography>
          <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/deals')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
            View deals
          </Button>
        </Stack>
        <Stack spacing={1.5}>
          {(data.pipeline || []).map((col) => {
            const meta = STAGE_META[col.status] || { color: 'default', label: col.status };
            const pct = maxPipelineCount > 0 ? (col.count / maxPipelineCount) * 100 : 0;
            const c = theme.palette[meta.color]?.main || theme.palette.grey[400];
            return (
              <Box key={col.status}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
                    {col.value > 0 && <Typography variant="caption" color="text.secondary">AED {Number(col.value).toLocaleString()}</Typography>}
                  </Stack>
                  <Typography variant="body2" fontWeight={800} color={col.count > 0 ? 'text.primary' : 'text.disabled'}>
                    {col.count}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct}
                  sx={{ height: 7, borderRadius: 4, bgcolor: alpha(c, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: c } }}
                />
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* Recent deals */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800}>Recent deals</Typography>
          <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/deals')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
            View all
          </Button>
        </Stack>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.recentDeals || []).slice(0, 8).map((d) => {
            const meta = STAGE_META[d.status] || { color: 'default', label: d.status };
            return (
              <Stack key={d.id} direction="row" justifyContent="space-between" alignItems="center"
                sx={{ px: 2.5, py: 1.25, cursor: 'pointer', transition: 'background 0.14s', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/erp/deals/view/${d.id}`)}>
                <Box minWidth={0} flex={1}>
                  <Typography variant="body2" fontWeight={600} noWrap>{d.title}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="caption" color="text.secondary">{d.deal_number}</Typography>
                    {d.total > 0 && <Typography variant="caption" color="text.disabled">· AED {Number(d.total).toLocaleString()}</Typography>}
                  </Stack>
                </Box>
                <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, ml: 1, flexShrink: 0 }} />
              </Stack>
            );
          })}
          {!(data.recentDeals || []).length && (
            <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No deals yet</Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SalesDashboard;
