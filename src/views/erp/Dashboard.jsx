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
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  IconBriefcase,
  IconPhone,
  IconBuilding,
  IconCurrencyDollar,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import PageContainer from '../../components/container/PageContainer';
import ListDateRangeFilter from '../../components/erp/ListDateRangeFilter';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ADMIN_ROLES = ['admin', 'tenant_admin', 'super_admin'];

const statusColors = {
  draft: 'default',
  pending: 'warning',
  approved: 'info',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
  new: 'info',
  qualified: 'primary',
  disqualified: 'error',
  converted: 'success',
};

const StatTile = ({ title, value, icon: Icon, colorKey, theme, loading, onClick }) => {
  const c = theme.palette[colorKey]?.main || theme.palette.primary.main;
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: '0.2s',
        '&:hover': onClick ? { borderColor: c, boxShadow: 2 } : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={22} sx={{ mt: 1 }} />
            ) : (
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(c, 0.12),
              color: c,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={24} stroke={1.5} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

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
  const allowed =
    typeof hasAdminDashboardAccess === 'function'
      ? hasAdminDashboardAccess()
      : ADMIN_ROLES.includes(roleName);

  const rangeParams = useMemo(() => {
    const p = { page: 1, pageSize: 500 };
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, dealsRes] = await Promise.all([
        apiService.getLeads(rangeParams),
        apiService.getDeals(rangeParams),
      ]);
      const L = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const D = Array.isArray(dealsRes.data) ? dealsRes.data : [];
      setLeads(L);
      setDeals(D);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    if (allowed) fetchData();
  }, [allowed, fetchData]);

  const stats = useMemo(() => {
    const totalDealValue = deals.reduce((s, d) => s + parseFloat(d.total || 0), 0);
    const dealByStatus = {};
    const leadByStatus = {};
    deals.forEach((d) => {
      const k = d.status || 'draft';
      dealByStatus[k] = (dealByStatus[k] || 0) + 1;
    });
    leads.forEach((l) => {
      const k = l.status || 'new';
      leadByStatus[k] = (leadByStatus[k] || 0) + 1;
    });
    return {
      dealCount: deals.length,
      totalDealValue,
      dealByStatus,
      leadByStatus,
    };
  }, [leads, deals]);

  if (!allowed) {
    return <Navigate to="/erp/contacts" replace />;
  }

  const dealChartSeries = Object.values(stats.dealByStatus);
  const dealChartOptions = {
    chart: { type: 'donut', toolbar: { show: false }, width: '100%', redrawOnParentResize: true },
    labels: Object.keys(stats.dealByStatus).map((s) => s.replace(/_/g, ' ')),
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: { show: true, label: 'Deals', formatter: () => String(stats.dealCount) },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '11px' },
  };

  const leadChartSeries = Object.values(stats.leadByStatus);
  const leadChartOptions = {
    ...dealChartOptions,
    labels: Object.keys(stats.leadByStatus).map((s) => s.replace(/_/g, ' ')),
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: { show: true, label: 'Leads', formatter: () => String(leads.length) },
          },
        },
      },
    },
  };

  return (
    <PageContainer title="Admin dashboard" description="Pipeline metrics for the selected period">
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
          <Box>
            <Typography variant="h3" fontWeight={800}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Admin-only overview — filter by record creation date
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<IconRefresh size={18} />} onClick={fetchData} disabled={loading} sx={{ borderRadius: 2 }}>
            Refresh
          </Button>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <ListDateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
            helperText="Period (created date)"
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mb: 3,
            width: '100%',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          }}
        >
          <StatTile
            title="Leads"
            value={leads.length}
            icon={IconPhone}
            colorKey="primary"
            theme={theme}
            loading={loading}
            onClick={() => navigate('/erp/leads')}
          />
          <StatTile
            title="Deals"
            value={deals.length}
            icon={IconBriefcase}
            colorKey="secondary"
            theme={theme}
            loading={loading}
            onClick={() => navigate('/erp/deals')}
          />
          <StatTile
            title="Deal value (AED)"
            value={loading ? '—' : stats.totalDealValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            icon={IconCurrencyDollar}
            colorKey="success"
            theme={theme}
            loading={loading}
            onClick={() => navigate('/erp/deals')}
          />
          <StatTile
            title="Quick links"
            value="CRM"
            icon={IconBuilding}
            colorKey="info"
            theme={theme}
            loading={false}
            onClick={() => navigate('/erp/companies')}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mb: 3,
            width: '100%',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', minWidth: 0 }}>
            <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Deals by status
                </Typography>
                <Button size="small" endIcon={<IconArrowRight size={16} />} onClick={() => navigate('/erp/deals')}>
                  All deals
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
              ) : dealChartSeries.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No deals in range</Typography>
              ) : (
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Chart options={dealChartOptions} series={dealChartSeries} type="donut" height={300} width="100%" />
                </Box>
              )}
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', minWidth: 0 }}>
            <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Leads by status
                </Typography>
                <Button size="small" endIcon={<IconArrowRight size={16} />} onClick={() => navigate('/erp/leads')}>
                  All leads
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
              ) : leadChartSeries.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No leads in range</Typography>
              ) : (
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Chart options={leadChartOptions} series={leadChartSeries} type="donut" height={300} width="100%" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            width: '100%',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
            alignItems: 'start',
          }}
        >
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Recent deals
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Deal</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                      ) : deals.slice(0, 8).length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }} color="text.secondary">No data</TableCell></TableRow>
                      ) : (
                        deals.slice(0, 8).map((deal) => (
                          <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/deals/view/${deal.id}`)}>
                            <TableCell>{deal.title || deal.deal_number}</TableCell>
                            <TableCell>{deal.company?.company_name || '—'}</TableCell>
                            <TableCell>
                              <Chip size="small" label={(deal.status || '').replace(/_/g, ' ')} color={statusColors[deal.status] || 'default'} />
                            </TableCell>
                            <TableCell align="right">{deal.currency || 'AED'} {Number(deal.total || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Recent leads
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                      ) : leads.slice(0, 8).length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }} color="text.secondary">No data</TableCell></TableRow>
                      ) : (
                        leads.slice(0, 8).map((lead) => (
                          <TableRow key={lead.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/leads/edit/${lead.id}`)}>
                            <TableCell>{lead.lead_number || lead.email}</TableCell>
                            <TableCell>{lead.company?.company_name || '—'}</TableCell>
                            <TableCell>
                              <Chip size="small" label={(lead.status || '').replace(/_/g, ' ')} color={statusColors[lead.status] || 'default'} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
