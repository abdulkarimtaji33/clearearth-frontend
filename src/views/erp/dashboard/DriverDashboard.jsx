import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Stack, Button, Chip, Alert, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconMapPin, IconPhone, IconCheck, IconClockHour4 } from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import apiService from '../../../services/api';

const DriverDashboard = ({ data, onRefresh }) => {
  const theme = useTheme();
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

  const PickupCard = ({ pickup }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '2px solid',
        borderColor: alpha(theme.palette.primary.main, 0.4),
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Typography variant="h6" fontWeight={800} lineHeight={1.2} mb={0.25}>
          {pickup.deal?.title || pickup.workOrderTitle || `Work order #${pickup.workOrderId}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pickup.deal?.deal_number && `#${pickup.deal.deal_number} · `}
          {pickup.typeOfWork}
        </Typography>
      </Box>

      <Box sx={{ px: 3, py: 2.5 }}>
        {pickup.deal?.pickup_location && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<IconMapPin size={20} />}
            href={pickup.deal.pickup_location}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mb: 2,
              borderRadius: 2.5,
              py: 1.5,
              fontWeight: 700,
              fontSize: '0.95rem',
              borderWidth: 2,
              '&:hover': { borderWidth: 2 },
            }}
          >
            Open collection location
          </Button>
        )}

        {(pickup.deal?.pickup_contact_name || pickup.deal?.pickup_contact_number) && (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, px: 2, py: 1.5, mb: 2, bgcolor: alpha(theme.palette.info.main, 0.04) }}
          >
            {pickup.deal?.pickup_contact_name && (
              <Typography variant="body1" fontWeight={700} mb={0.5}>
                {pickup.deal.pickup_contact_name}
              </Typography>
            )}
            {pickup.deal?.pickup_contact_number && (
              <Button
                href={`tel:${pickup.deal.pickup_contact_number}`}
                startIcon={<IconPhone size={18} />}
                sx={{ justifyContent: 'flex-start', fontSize: '1.05rem', fontWeight: 700, p: 0 }}
              >
                {pickup.deal.pickup_contact_number}
              </Button>
            )}
          </Paper>
        )}

        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          startIcon={<IconCheck size={22} />}
          disabled={completing === pickup.taskId}
          onClick={() => markComplete(pickup.taskId)}
          sx={{
            borderRadius: 2.5,
            py: 1.75,
            fontWeight: 800,
            fontSize: '1.05rem',
            boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          {completing === pickup.taskId ? 'Saving…' : 'Mark as picked up'}
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          My pickups
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Today's assignments
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 6 }}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={800} mb={2}>
        Today's pickups
      </Typography>

      {(data.pickups || []).length === 0 ? (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 5, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}
        >
          <IconClockHour4 size={36} color={theme.palette.text.disabled} />
          <Typography color="text.secondary" mt={1.5} fontWeight={600}>
            No active pickups assigned
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            Check back later or contact your manager
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5} mb={4}>
          {data.pickups.map((p) => (
            <PickupCard key={p.taskId} pickup={p} />
          ))}
        </Stack>
      )}

      {(data.completedToday || []).length > 0 && (
        <>
          <Divider sx={{ mb: 2.5 }} />
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
            Completed today
          </Typography>
          <Stack spacing={1}>
            {data.completedToday.map((p) => (
              <Chip
                key={p.taskId}
                icon={<IconCheck size={14} />}
                label={p.deal?.title || p.workOrderTitle}
                color="success"
                variant="outlined"
                sx={{ justifyContent: 'flex-start', fontWeight: 600, height: 36, px: 0.5 }}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default DriverDashboard;
