import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip } from '@mui/material';
import KpiCard from '../shared/KpiCard';
import ActionableList from '../shared/ActionableList';

const SalesManagerDashboard = ({ data }) => (
  <Box>
    <Typography variant="h4" fontWeight={800} mb={3}>Team performance</Typography>
    <Grid container spacing={2} mb={3}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard {...k} />
        </Grid>
      ))}
    </Grid>
    <Box mb={3}><ActionableList title="Stale deals" items={data.actionables} /></Box>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800} mb={2}>Leaderboard (won)</Typography>
          <Stack spacing={1}>
            {(data.leaderboard || []).map((row, i) => (
              <Stack key={i} direction="row" justifyContent="space-between">
                <Typography variant="body2">{row.user ? `${row.user.first_name} ${row.user.last_name}` : 'Unassigned'}</Typography>
                <Chip size="small" label={`AED ${Number(row.total || 0).toLocaleString()}`} color="success" />
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800} mb={2}>Pipeline by stage</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {(data.pipeline || []).map((p) => (
              <Chip key={p.status} label={`${p.status.replace(/_/g, ' ')}: ${p.count}`} variant="outlined" sx={{ textTransform: 'capitalize' }} />
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default SalesManagerDashboard;
