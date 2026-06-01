import React from 'react';
import { Box, Grid, Typography, Stack, Divider, Paper, Chip, Button, Avatar } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconCurrencyDollar, IconTrendingUp, IconBuildingBank, IconRefresh,
  IconFileInvoice, IconBuildingFactory2, IconPackage, IconShoppingCart,
  IconReceiptRefund, IconReceiptTax, IconUsers, IconChartBar,
  IconCircleCheck, IconTrophy, IconArrowRight, IconClock,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';
import DashboardChart from './shared/DashboardChart';
import { useAuth } from '../../../context/AuthContext';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const KPI_ICONS = {
  'Revenue (paid) this month': IconTrendingUp,
  'Outstanding AR': IconReceiptTax,
  'Outstanding AP': IconReceiptRefund,
  'Open deals': IconBuildingBank,
};

const DEAL_STATUS_COLOR = {
  new: 'default', approved: 'info', quotation_sent: 'primary',
  negotiation: 'warning', won: 'success', lost: 'error',
};
const WO_STATUS_COLOR = {
  new: 'default', in_progress: 'primary', completed: 'success', cancelled: 'error',
};

const QUICK_NAV = [
  { label: 'Deals', icon: IconFileInvoice, href: '/erp/deals', color: 'primary' },
  { label: 'Work Orders', icon: IconBuildingFactory2, href: '/erp/work-orders', color: 'info' },
  { label: 'GRN', icon: IconPackage, href: '/erp/grn', color: 'warning' },
  { label: 'Purchase Orders', icon: IconShoppingCart, href: '/erp/client-purchase-quotations', color: 'secondary' },
  { label: 'Receivables', icon: IconReceiptTax, href: '/erp/receivables', color: 'success' },
  { label: 'Payables', icon: IconReceiptRefund, href: '/erp/payables', color: 'error' },
  { label: 'Users', icon: IconUsers, href: '/erp/users', color: 'primary' },
  { label: 'Reports', icon: IconChartBar, href: '/erp/reports/trial-balance', color: 'info' },
];

const AdminDashboard = ({ data, onRefresh }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const firstName = user?.first_name || user?.firstName || '';
  const stats = data.stats || {};

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={900} lineHeight={1.2}>
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Button size="small" startIcon={<IconRefresh size={15} />} onClick={onRefresh} sx={{ borderRadius: 2 }}>
          Refresh
        </Button>
      </Stack>

      {/* ── KPIs ── */}
      <Grid container spacing={2.5} mb={2.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...k} icon={KPI_ICONS[k.label]} />
          </Grid>
        ))}
      </Grid>

      {/* ── This-month stats ── */}
      <Grid container spacing={2.5} mb={3.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.3), bgcolor: alpha(theme.palette.success.main, 0.04), display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconCircleCheck size={20} color={theme.palette.success.main} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} color="success.main">{stats.completedWOsThisMonth ?? '—'}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.63rem', letterSpacing: 0.4 }}>WOs completed this month</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.3), bgcolor: alpha(theme.palette.warning.main, 0.04), display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconTrophy size={20} color={theme.palette.warning.main} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} color="warning.main">{stats.wonDealsThisMonth ?? '—'}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.63rem', letterSpacing: 0.4 }}>Deals won this month</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Attention ── */}
      {(data.actionables || []).length > 0 && (
        <Box mb={3.5}>
          <ActionableList title="Requires your attention" items={data.actionables} />
        </Box>
      )}

      {/* ── Quick navigation ── */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>Quick navigation</Typography>
        <Grid container spacing={1.5}>
          {QUICK_NAV.map(({ label, icon: Icon, href, color }) => {
            const c = theme.palette[color]?.main || theme.palette.primary.main;
            return (
              <Grid key={label} size={{ xs: 6, sm: 3 }}>
                <Paper
                  elevation={0}
                  onClick={() => navigate(href)}
                  sx={{
                    p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: alpha(c, 0.5), bgcolor: alpha(c, 0.05), transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${alpha(c, 0.12)}` },
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(c, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                    <Icon size={20} color={c} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">{label}</Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Divider sx={{ mb: 3.5 }} />

      {/* ── Charts ── */}
      <Typography variant="subtitle1" fontWeight={800} mb={2}>Analytics</Typography>
      <Grid container spacing={2.5} mb={3.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardChart title="Work orders by status" subtitle="Current snapshot" data={data.charts?.workOrdersByStatus} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardChart title="Deals by status" subtitle="Pipeline distribution" data={data.charts?.dealsByStatus} />
        </Grid>
      </Grid>

      {/* ── Recent activity ── */}
      <Grid container spacing={2.5}>
        {/* Recent deals */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>Recent deals</Typography>
              <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/deals')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                View all
              </Button>
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.recentDeals || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No deals yet</Typography>
              ) : (
                (data.recentDeals || []).map((d) => (
                  <Stack key={d.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(`/erp/deals/view/${d.id}`)}>
                    <Box minWidth={0} flex={1}>
                      <Typography variant="body2" fontWeight={600} noWrap>{d.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{d.deal_number}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0} ml={1}>
                      <Chip size="small" label={(d.status || '').replace(/_/g, ' ')} color={DEAL_STATUS_COLOR[d.status] || 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'capitalize', height: 22 }} />
                      {d.total > 0 && <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>AED {Number(d.total).toLocaleString()}</Typography>}
                    </Stack>
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent work orders */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>Recent work orders</Typography>
              <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/work-orders')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                View all
              </Button>
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.recentWorkOrders || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No work orders yet</Typography>
              ) : (
                (data.recentWorkOrders || []).map((w) => (
                  <Stack key={w.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(`/erp/work-orders/view/${w.id}`)}>
                    <Box minWidth={0} flex={1}>
                      <Typography variant="body2" fontWeight={600} noWrap>{w.title || `WO #${w.id}`}</Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconClock size={11} color={theme.palette.text.disabled} />
                        <Typography variant="caption" color="text.secondary">{new Date(w.updated_at).toLocaleDateString()}</Typography>
                      </Stack>
                    </Box>
                    <Chip size="small" label={(w.status || '').replace(/_/g, ' ')} color={WO_STATUS_COLOR[w.status] || 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'capitalize', height: 22, ml: 1, flexShrink: 0 }} />
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
