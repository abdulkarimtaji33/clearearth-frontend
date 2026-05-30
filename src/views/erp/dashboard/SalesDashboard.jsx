import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router';
import KpiCard from '../shared/KpiCard';
import ActionableList from '../shared/ActionableList';

const SalesDashboard = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={3}>My pipeline</Typography>
      <Grid container spacing={2} mb={3}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...k} color={k.label.includes('follow') || k.label.includes('Missing') ? 'warning' : 'primary'} highlight={k.label.includes('follow') && k.value > 0} />
          </Grid>
        ))}
      </Grid>
      <Box mb={3}><ActionableList title="Action items" items={data.actionables} /></Box>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>Pipeline</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(data.pipeline || []).map((col) => (
            <Chip key={col.status} label={`${col.status.replace(/_/g, ' ')} (${col.count})`} variant="outlined" sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
          ))}
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>Recent deals</Typography>
        <Stack spacing={1}>
          {(data.recentDeals || []).slice(0, 8).map((d) => (
            <Stack key={d.id} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight={600}>{d.deal_number} — {d.title}</Typography>
              <Button size="small" onClick={() => navigate(`/erp/deals/view/${d.id}`)}>View</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SalesDashboard;
