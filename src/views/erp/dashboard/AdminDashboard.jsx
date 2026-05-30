import React from 'react';
import { Box, Grid, Typography, Stack, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import KpiCard from '../shared/KpiCard';
import ActionableList from '../shared/ActionableList';
import DashboardChart from '../shared/DashboardChart';

const AdminDashboard = ({ data }) => (
  <Box>
    <Typography variant="h4" fontWeight={800} mb={3}>Command center</Typography>
    <Grid container spacing={2} mb={3}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard {...k} />
        </Grid>
      ))}
    </Grid>
    <Box mb={3}><ActionableList items={data.actionables} /></Box>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardChart title="Work orders by status" data={data.charts?.workOrdersByStatus} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardChart title="Deals by status" data={data.charts?.dealsByStatus} />
      </Grid>
    </Grid>
  </Box>
);

export default AdminDashboard;
