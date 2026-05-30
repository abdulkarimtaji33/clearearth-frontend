import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import KpiCard from '../shared/KpiCard';
import ActionableList from '../shared/ActionableList';

const AccountsDashboard = ({ data }) => (
  <Box>
    <Typography variant="h4" fontWeight={800} mb={3}>Accounts</Typography>
    <Grid container spacing={2} mb={3}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
          <KpiCard {...k} />
        </Grid>
      ))}
    </Grid>
    <ActionableList title="Quick actions" items={data.actionables} />
  </Box>
);

export default AccountsDashboard;
