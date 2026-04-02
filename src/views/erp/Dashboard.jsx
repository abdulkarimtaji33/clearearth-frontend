import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  IconBriefcase,
  IconPhone,
  IconBuilding,
  IconCurrencyDollar,
  IconArrowRight,
  IconRefresh,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import PageContainer from '../../components/container/PageContainer';
import ListDateRangeFilter from '../../components/erp/ListDateRangeFilter';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ADMIN_ROLES = ['admin', 'tenant_admin', 'super_admin'];

const STATUS_COLORS = {
  draft: 'default', pending: 'warning', approved: 'info',
  in_progress: 'primary', completed: 'success', cancelled: 'error',
  new: 'info', qualified: 'primary', disqualified: 'error', converted: 'success',
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, loading, onClick }) => {
  const theme = useTheme();
  const c = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s',
        '&:hover': onClick ? { borderColor: c, boxShadow: `0 4px 20px ${alpha(c, 0.15)}`, transform: 'translateY(-1px)' } : {},
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: c, borderRadius: '3px 3px 0 0' }} />
      <CardContent sx={{ p: 2.5, pt: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.1 }}>{value}</Typography>
            )}
            {subtitle && <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{subtitle}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(c, 0.1), color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ml: 1 }}>
            <Icon size={22} stroke={1.5} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const SectionCard = ({ title, subtitle, actionLabel, onAction, children, loading }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', minWidth: 0 }}>
    <CardContent sx={{ p: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {actionLabel && (
          <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={onAction} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
      {loading ? (
        <Box sx={{ p: 3 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />)}
        </Box>
      ) : children}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, hasAdminDashboardAccess } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);

  const roleName = user?.role?.name ?? user?.role;
  const allowed = typeof hasAdminDashboardAccess === 'function' ? hasAdminDashboardAccess() : ADMIN_ROLES.includes(roleName);

  const rangeParams = useMemo(() => {
    const p = { page: 1, pageSize: 500 };
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, dealsRes] = await Promise.all([apiService.getLeads(rangeParams), apiService.getDeals(rangeParams)]);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [rangeParams]);

  useEffect(() => { if (allowed) fetchData(); }, [allowed, fetchData]);

  const stats = useMemo(() => {
    const totalDealValue = deals.reduce((s, d) => s + parseFloat(d.total || 0), 0);
    const dealByStatus = {};
    const leadByStatus = {};
    deals.forEach(d => { const k = d.status || 'draft'; dealByStatus[k] = (dealByStatus[k] || 0) + 1; });
    leads.forEach(l => { const k = l.status || 'new'; leadByStatus[k] = (leadByStatus[k] || 0) + 1; });
    return { dealCount: deals.length, totalDealValue, dealByStatus, leadByStatus };
  }, [leads, deals]);

  if (!allowed) return <Navigate to="/erp/contacts" replace />;

  const chartColors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main];

  const makeDonutOptions = (labels, totalLabel, totalValue) => ({
    chart: { type: 'donut', toolbar: { show: false }, redrawOnParentResize: true },
    labels,
    colors: chartColors,
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: { show: true, label: totalLabel, fontSize: '13px', fontWeight: 600, formatter: () => String(totalValue) },
            value: { fontSize: '22px', fontWeight: 800 },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '12px', markers: { radius: 4 } },
    stroke: { width: 2 },
    tooltip: { style: { fontSize: '13px' } },
  });

  const dealChartOptions = makeDonutOptions(
    Object.keys(stats.dealByStatus).map(s => s.replace(/_/g, ' ')),
    'Total Deals', stats.dealCount
  );
  const leadChartOptions = makeDonutOptions(
    Object.keys(stats.leadByStatus).map(s => s.replace(/_/g, ' ')),
    'Total Leads', leads.length
  );

  return (
    <PageContainer title="Dashboard" description="Pipeline metrics">
      <Box>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTrendingUp size={20} />
              </Box>
              <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>Admin overview — filter by record creation date</Typography>
          </Box>
          <Button variant="outlined" startIcon={<IconRefresh size={16} />} onClick={fetchData} disabled={loading} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Refresh
          </Button>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} onClear={() => { setDateFrom(''); setDateTo(''); }} helperText="Period (created date)" />
        </Box>

        {/* Stat tiles */}
        <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
          <StatCard title="Leads" value={leads.length} subtitle="All pipeline leads" icon={IconPhone} color="primary" loading={loading} onClick={() => navigate('/erp/leads')} />
          <StatCard title="Deals" value={deals.length} subtitle="Active deals" icon={IconBriefcase} color="secondary" loading={loading} onClick={() => navigate('/erp/deals')} />
          <StatCard
            title="Deal Value"
            value={loading ? '—' : `AED ${stats.totalDealValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            subtitle="Total pipeline value"
            icon={IconCurrencyDollar}
            color="success"
            loading={loading}
            onClick={() => navigate('/erp/deals')}
          />
          <StatCard title="Companies" value="" subtitle="View all clients" icon={IconBuilding} color="info" loading={false} onClick={() => navigate('/erp/companies')} />
        </Box>

        {/* Charts */}
        <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          <SectionCard title="Deals by status" actionLabel="All deals" onAction={() => navigate('/erp/deals')} loading={false}>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
              ) : Object.keys(stats.dealByStatus).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No deals in selected range</Typography>
              ) : (
                <Chart options={dealChartOptions} series={Object.values(stats.dealByStatus)} type="donut" height={280} width="100%" />
              )}
            </Box>
          </SectionCard>
          <SectionCard title="Leads by status" actionLabel="All leads" onAction={() => navigate('/erp/leads')} loading={false}>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
              ) : Object.keys(stats.leadByStatus).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No leads in selected range</Typography>
              ) : (
                <Chart options={leadChartOptions} series={Object.values(stats.leadByStatus)} type="donut" height={280} width="100%" />
              )}
            </Box>
          </SectionCard>
        </Box>

        {/* Recent tables */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
          <SectionCard title="Recent deals" actionLabel="View all" onAction={() => navigate('/erp/deals')} loading={loading}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Deal', 'Company', 'Status', 'Total'].map((h, i) => (
                      <TableCell key={i} align={i === 3 ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', py: 1.25 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deals.slice(0, 8).length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No data</TableCell></TableRow>
                  ) : (
                    deals.slice(0, 8).map(deal => (
                      <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/deals/view/${deal.id}`)}>
                        <TableCell>
                          <Typography variant="caption" fontWeight={700} color="primary.main">{deal.deal_number || `#${deal.id}`}</Typography>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{deal.title}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{deal.company?.company_name || '—'}</Typography></TableCell>
                        <TableCell><Chip size="small" label={(deal.status || '').replace(/_/g, ' ')} color={STATUS_COLORS[deal.status] || 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{Number(deal.total || 0).toLocaleString()}</Typography></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title="Recent leads" actionLabel="View all" onAction={() => navigate('/erp/leads')} loading={loading}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
                    {['Lead', 'Company', 'Status'].map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', py: 1.25 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.slice(0, 8).length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No data</TableCell></TableRow>
                  ) : (
                    leads.slice(0, 8).map(lead => (
                      <TableRow key={lead.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/leads/edit/${lead.id}`)}>
                        <TableCell>
                          <Typography variant="caption" fontWeight={700} color="secondary.main">{lead.lead_number || `#${lead.id}`}</Typography>
                          <Typography variant="body2">{lead.email || '—'}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{lead.company?.company_name || '—'}</Typography></TableCell>
                        <TableCell><Chip size="small" label={(lead.status || '').replace(/_/g, ' ')} color={STATUS_COLORS[lead.status] || 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
