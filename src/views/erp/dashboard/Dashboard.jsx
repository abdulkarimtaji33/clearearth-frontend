import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import {
  IconUsers,
  IconTruckDelivery,
  IconShoppingCart,
  IconFileInvoice,
  IconCurrencyDollar,
  IconPackage,
  IconReceipt,
  IconBriefcase,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="600">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" mt={1}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '12px',
            bgcolor: `${color}.light`,
            color: `${color}.main`,
          }}
        >
          <Icon size={32} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Dashboard" description="ClearEarth ERP Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Dashboard" description="ClearEarth ERP Dashboard">
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  const data = dashboardData || {};
  const overview = data.overview || {};
  const financial = data.financial || {};

  return (
    <PageContainer title="Dashboard" description="ClearEarth ERP Dashboard">
      <Box>
        <Typography variant="h4" fontWeight="600" mb={3}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Clients"
              value={overview.totalClients || 0}
              icon={IconUsers}
              color="primary"
              subtitle={`Active: ${overview.activeClients || 0}`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Vendors"
              value={overview.totalVendors || 0}
              icon={IconTruckDelivery}
              color="success"
              subtitle={`Active: ${overview.activeVendors || 0}`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Deals"
              value={overview.totalDeals || 0}
              icon={IconBriefcase}
              color="warning"
              subtitle={`Value: AED ${(overview.totalDealValue || 0).toLocaleString()}`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Jobs"
              value={overview.totalJobs || 0}
              icon={IconPackage}
              color="info"
              subtitle={`In Progress: ${overview.inProgressJobs || 0}`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Inventory"
              value={overview.totalInventory || 0}
              icon={IconShoppingCart}
              color="secondary"
              subtitle={`Items in stock`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Open Invoices"
              value={overview.totalInvoices || 0}
              icon={IconFileInvoice}
              color="error"
              subtitle={`Pending: ${overview.pendingInvoices || 0}`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Revenue"
              value={`AED ${(financial.totalRevenue || 0).toLocaleString()}`}
              icon={IconCurrencyDollar}
              color="success"
              subtitle={`This month`}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Outstanding"
              value={`AED ${(financial.totalOutstanding || 0).toLocaleString()}`}
              icon={IconReceipt}
              color="warning"
              subtitle={`To be collected`}
            />
          </Grid>
        </Grid>

        {data.recentActivities && data.recentActivities.length > 0 && (
          <Box mt={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" fontWeight="600" mb={2}>
                  Recent Activities
                </Typography>
                {data.recentActivities.slice(0, 10).map((activity, index) => (
                  <Box key={index} py={1} borderBottom="1px solid" borderColor="divider">
                    <Typography variant="body2">{activity.description}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
