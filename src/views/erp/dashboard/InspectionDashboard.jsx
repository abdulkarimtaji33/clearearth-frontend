import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router';
import KpiCard from '../shared/KpiCard';

const InspectionDashboard = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={1}>Inspection queue</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Your assigned inspection work</Typography>
      <Grid container spacing={2} mb={3}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
            <KpiCard {...k} color={k.highlight ? 'error' : 'primary'} highlight={k.highlight} />
          </Grid>
        ))}
      </Grid>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography fontWeight={800}>Open requests</Typography>
        </Box>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.actionables || []).length === 0 ? (
            <Typography color="text.secondary" p={3} textAlign="center">No open inspection requests</Typography>
          ) : (data.actionables || []).map((item) => (
            <Stack key={item.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
              <Button size="small" variant="contained" onClick={() => navigate(item.href)}>Open</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default InspectionDashboard;
