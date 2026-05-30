import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import KpiCard from '../shared/KpiCard';
import ActionableList from '../shared/ActionableList';

const OperationsDashboard = ({ data }) => (
  <Box>
    <Typography variant="h4" fontWeight={800} mb={3}>Operations</Typography>
    <Grid container spacing={2} mb={3}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard {...k} color={k.value > 0 && k.label.includes('Overdue') ? 'error' : 'primary'} />
        </Grid>
      ))}
    </Grid>
    <ActionableList title="Bottlenecks & approvals" items={data.actionables} />
  </Box>
);

export default OperationsDashboard;
