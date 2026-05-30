import React from 'react';
import { Box, Grid, Typography, Divider } from '@mui/material';
import {
  IconBuildingFactory2, IconAlertCircle, IconCoin, IconPackage,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';

const KPI_ICONS = {
  'Work orders in progress': IconBuildingFactory2,
  'Overdue tasks': IconAlertCircle,
  'Expenses pending approval': IconCoin,
  'GRNs pending': IconPackage,
};

const OperationsDashboard = ({ data }) => (
  <Box>
    <Box mb={3}>
      <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
        Operations
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.25}>
        Throughput, bottlenecks and approvals
      </Typography>
    </Box>

    <Grid container spacing={2.5} mb={3.5}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            {...k}
            icon={KPI_ICONS[k.label]}
            color={k.value > 0 && k.label?.includes('Overdue') ? 'error' : 'primary'}
            highlight={k.value > 0 && k.label?.includes('Overdue')}
          />
        </Grid>
      ))}
    </Grid>

    <ActionableList title="Bottlenecks & approvals" items={data.actionables} />
  </Box>
);

export default OperationsDashboard;
