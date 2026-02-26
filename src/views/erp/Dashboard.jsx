import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  IconAddressBook,
  IconBuilding,
  IconBriefcase,
  IconCurrencyDollar,
  IconPackage,
  IconPhone,
  IconTruckDelivery,
  IconPlus,
  IconArrowRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import Chart from 'react-apexcharts';
import { useTheme, alpha } from '@mui/material/styles';
import PageContainer from '../../components/container/PageContainer';
import apiService from '../../services/api';
import DashboardCard from '../../components/shared/DashboardCard';

const StatCard = ({ icon: Icon, title, value, colorKey, theme, onClick, loading }) => {
  const color = theme?.palette?.[colorKey]?.main || theme?.palette?.primary?.main;
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { borderColor: color, boxShadow: 1 } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: color ? alpha(color, 0.12) : 'action.hover',
              color: color || 'text.primary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={28} stroke={1.5} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

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

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    leads: 0,
    deals: 0,
    companies: 0,
    contacts: 0,
    suppliers: 0,
    products: 0,
    totalDealValue: 0,
  });
  const [recentDeals, setRecentDeals] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [dealStatusCounts, setDealStatusCounts] = useState({});
  const [leadStatusCounts, setLeadStatusCounts] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, dealsRes, companiesRes, contactsRes, suppliersRes, productsRes] = await Promise.all([
        apiService.getLeads({ page: 1, pageSize: 500 }),
        apiService.getDeals({ page: 1, pageSize: 500 }),
        apiService.getCompanies({ page: 1, pageSize: 1 }),
        apiService.getContacts({ page: 1, pageSize: 1 }),
        apiService.getSuppliers({ page: 1, pageSize: 1 }),
        apiService.getProducts({ page: 1, pageSize: 1 }),
      ]);

      const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const deals = Array.isArray(dealsRes.data) ? dealsRes.data : [];

      const totalDealValue = deals.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
      const dealStatusMap = {};
      const leadStatusMap = {};
      deals.forEach((d) => {
        const s = d.status || 'draft';
        dealStatusMap[s] = (dealStatusMap[s] || 0) + 1;
      });
      leads.forEach((l) => {
        const s = l.status || 'new';
        leadStatusMap[s] = (leadStatusMap[s] || 0) + 1;
      });

      setStats({
        leads: leadsRes.pagination?.totalItems ?? leads.length,
        deals: dealsRes.pagination?.totalItems ?? deals.length,
        companies: companiesRes.pagination?.totalItems ?? 0,
        contacts: contactsRes.pagination?.totalItems ?? 0,
        suppliers: suppliersRes.pagination?.totalItems ?? 0,
        products: productsRes.pagination?.totalItems ?? 0,
        totalDealValue,
      });
      setRecentDeals(deals.slice(0, 5));
      setRecentLeads(leads.slice(0, 5));
      setDealStatusCounts(dealStatusMap);
      setLeadStatusCounts(leadStatusMap);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dealChartOptions = {
    chart: { type: 'donut', toolbar: { show: false }, height: 220 },
    labels: Object.keys(dealStatusCounts).map((s) => s.replace(/_/g, ' ')),
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
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Deals',
              formatter: () => stats.deals.toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '12px' },
    tooltip: { theme: theme.palette.mode === 'dark' ? 'dark' : 'light' },
  };
  const dealChartSeries = Object.values(dealStatusCounts);

  return (
    <PageContainer title="Dashboard" description="ClearEarth ERP overview">
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Overview of your CRM pipeline and activity
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconPlus size={20} />}
              onClick={() => navigate('/erp/leads/create')}
              sx={{ borderRadius: 2 }}
            >
              New Lead
            </Button>
            <Button
              variant="contained"
              startIcon={<IconBriefcase size={20} />}
              onClick={() => navigate('/erp/deals/create')}
              sx={{ borderRadius: 2 }}
            >
              New Deal
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconPhone} title="Leads" value={stats.leads} colorKey="primary" theme={theme} onClick={() => navigate('/erp/leads')} loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconBriefcase} title="Deals" value={stats.deals} colorKey="secondary" theme={theme} onClick={() => navigate('/erp/deals')} loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconBuilding} title="Companies" value={stats.companies} colorKey="info" theme={theme} onClick={() => navigate('/erp/companies')} loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconAddressBook} title="Contacts" value={stats.contacts} colorKey="success" theme={theme} onClick={() => navigate('/erp/contacts')} loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconTruckDelivery} title="Suppliers" value={stats.suppliers} colorKey="warning" theme={theme} onClick={() => navigate('/erp/suppliers')} loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard icon={IconPackage} title="Products" value={stats.products} colorKey="error" theme={theme} onClick={() => navigate('/erp/products')} loading={loading} />
          </Grid>
        </Grid>

        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Deal Value
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  AED {loading ? '—' : stats.totalDealValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCurrencyDollar size={36} color="#fff" stroke={1.5} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <DashboardCard title="Recent Deals" action={<Button size="small" endIcon={<IconArrowRight size={18} />} onClick={() => navigate('/erp/deals')}>View all</Button>}>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Deal</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                    ) : recentDeals.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }} color="text.secondary">No deals yet</TableCell></TableRow>
                    ) : (
                      recentDeals.map((deal) => (
                        <TableRow
                          key={deal.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                        >
                          <TableCell>{deal.title || deal.deal_number}</TableCell>
                          <TableCell>{deal.company?.company_name || '—'}</TableCell>
                          <TableCell>
                            <Chip label={deal.status?.replace(/_/g, ' ')} size="small" color={statusColors[deal.status] || 'default'} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600}>
                              {deal.currency || 'AED'} {Number(deal.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <DashboardCard title="Deals by Status">
              {loading || dealChartSeries.length === 0 ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {loading ? <CircularProgress /> : <Typography color="text.secondary">No deal data</Typography>}
                </Box>
              ) : (
                <Chart options={dealChartOptions} series={dealChartSeries} type="donut" height={220} />
              )}
            </DashboardCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} lg={8}>
            <DashboardCard title="Recent Leads" action={<Button size="small" endIcon={<IconArrowRight size={18} />} onClick={() => navigate('/erp/leads')}>View all</Button>}>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                    ) : recentLeads.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }} color="text.secondary">No leads yet</TableCell></TableRow>
                    ) : (
                      recentLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/erp/leads/edit/${lead.id}`)}
                        >
                          <TableCell>{lead.lead_number || lead.email}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.source || '—'}</TableCell>
                          <TableCell>
                            <Chip label={lead.status?.replace(/_/g, ' ')} size="small" color={statusColors[lead.status] || 'default'} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <DashboardCard title="Leads by Status">
              <Stack spacing={2} sx={{ py: 1 }}>
                {loading ? (
                  <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
                ) : Object.keys(leadStatusCounts).length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No lead data</Typography>
                ) : (
                  Object.entries(leadStatusCounts).map(([status, count]) => (
                    <Stack key={status} direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">{status.replace(/_/g, ' ')}</Typography>
                      <Chip label={count} size="small" color={statusColors[status] || 'default'} />
                    </Stack>
                  ))
                )}
              </Stack>
            </DashboardCard>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
