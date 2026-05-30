import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Stack, Button, Chip, Alert,
} from '@mui/material';
import { IconMapPin, IconPhone, IconCheck } from '@tabler/icons-react';
import KpiCard from '../shared/KpiCard';
import apiService from '../../../services/api';

const DriverDashboard = ({ data, onRefresh }) => {
  const [completing, setCompleting] = useState(null);
  const [error, setError] = useState('');

  const markComplete = async (taskId) => {
    try {
      setCompleting(taskId);
      setError('');
      await apiService.completeDriverPickup(taskId);
      onRefresh?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setCompleting(null);
    }
  };

  const PickupCard = ({ pickup, large }) => (
    <Paper
      elevation={0}
      sx={{
        p: large ? 3 : 2,
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'primary.main',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant={large ? 'h6' : 'subtitle1'} fontWeight={800} mb={0.5}>
        {pickup.deal?.title || pickup.workOrderTitle || `Work order #${pickup.workOrderId}`}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {pickup.deal?.deal_number && `#${pickup.deal.deal_number} · `}{pickup.typeOfWork}
      </Typography>
      {pickup.deal?.pickup_location && (
        <Button
          fullWidth
          variant="outlined"
          size={large ? 'large' : 'medium'}
          startIcon={<IconMapPin size={20} />}
          href={pickup.deal.pickup_location}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mb: 1.5, borderRadius: 2, py: large ? 1.5 : 1, fontWeight: 700 }}
        >
          Open collection location
        </Button>
      )}
      <Stack spacing={0.5} mb={2}>
        {pickup.deal?.pickup_contact_name && (
          <Typography variant="body1" fontWeight={600}>{pickup.deal.pickup_contact_name}</Typography>
        )}
        {pickup.deal?.pickup_contact_number && (
          <Button
            href={`tel:${pickup.deal.pickup_contact_number}`}
            startIcon={<IconPhone size={18} />}
            sx={{ justifyContent: 'flex-start', fontSize: '1.1rem', fontWeight: 700 }}
          >
            {pickup.deal.pickup_contact_number}
          </Button>
        )}
      </Stack>
      <Button
        fullWidth
        variant="contained"
        color="success"
        size="large"
        startIcon={<IconCheck size={20} />}
        disabled={completing === pickup.taskId}
        onClick={() => markComplete(pickup.taskId)}
        sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, fontSize: '1rem' }}
      >
        {completing === pickup.taskId ? 'Saving…' : 'Mark as picked up'}
      </Button>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} mb={3}>My pickups</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} mb={3}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 6 }}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={800} mb={2}>Today's pickups</Typography>
      {(data.pickups || []).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
          <Typography color="text.secondary">No active pickups assigned</Typography>
        </Paper>
      ) : (
        <Stack spacing={2} mb={4}>
          {data.pickups.map((p) => <PickupCard key={p.taskId} pickup={p} large />)}
        </Stack>
      )}

      {(data.completedToday || []).length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>Completed today</Typography>
          <Stack spacing={1}>
            {data.completedToday.map((p) => (
              <Chip key={p.taskId} icon={<IconCheck size={14} />} label={p.deal?.title || p.workOrderTitle} color="success" variant="outlined" />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default DriverDashboard;
