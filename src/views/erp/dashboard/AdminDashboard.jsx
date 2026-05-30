import React from 'react';
import { Box, Grid, Typography, Stack, Divider } from '@mui/material';
import {
  IconCurrencyDollar, IconClock, IconTrendingUp, IconBuildingBank,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';
import DashboardChart from './shared/DashboardChart';
import { useAuth } from '../../../context/AuthContext';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const KPI_ICONS = {
  'Revenue (paid) this month': IconTrendingUp,
  'Outstanding AR': IconCurrencyDollar,
  'Outstanding AP': IconClock,
  'Open deals': IconBuildingBank,
};

const AdminDashboard = ({ data }) => {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.firstName || '';

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
            {GREETING()}{firstName ? `, ${firstName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Here's your company overview
          </Typography>
        </Box>
        <Typography variant="caption" color="text.disabled">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </Stack>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...k} icon={KPI_ICONS[k.label]} />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Requires your attention" items={data.actionables} />
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      <Typography variant="subtitle1" fontWeight={800} mb={2}>
        Analytics
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardChart
            title="Work orders by status"
            subtitle="Current snapshot"
            data={data.charts?.workOrdersByStatus}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardChart
            title="Deals by status"
            subtitle="Pipeline distribution"
            data={data.charts?.dealsByStatus}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
