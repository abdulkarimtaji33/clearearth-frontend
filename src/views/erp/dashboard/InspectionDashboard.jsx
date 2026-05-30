import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Button, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import KpiCard from './shared/KpiCard';

const InspectionDashboard = ({ data }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const urgentKpi = (data.kpis || []).find((k) => k.highlight);
  const urgentCount = urgentKpi ? Number(urgentKpi.value || 0) : 0;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          Inspection queue
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Your assigned inspection work
        </Typography>
      </Box>

      {urgentCount > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            mb: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.error.main, 0.3),
            bgcolor: alpha(theme.palette.error.main, 0.05),
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.error.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconAlertCircle size={24} color={theme.palette.error.main} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} color="error.main">
              {urgentCount} request{urgentCount !== 1 ? 's' : ''} require action
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New assignments are waiting for you below
            </Typography>
          </Box>
          <Chip
            label="ACTION REQUIRED"
            size="small"
            sx={{ bgcolor: theme.palette.error.main, color: '#fff', fontWeight: 800, letterSpacing: 0.5 }}
          />
        </Paper>
      )}

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 6, sm: 3 }}>
            <KpiCard {...k} color={k.highlight ? 'error' : 'primary'} highlight={k.highlight} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography fontWeight={800}>Team queue — open requests</Typography>
        </Box>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.actionables || []).length === 0 ? (
            <Typography color="text.secondary" p={4} textAlign="center">
              No open inspection requests — all clear!
            </Typography>
          ) : (
            (data.actionables || []).map((item) => (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2.5,
                  py: 1.5,
                  transition: 'background 0.14s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {item.label}
                  </Typography>
                  {item.sub && (
                    <Typography variant="caption" color="text.secondary">
                      {item.sub}
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ borderRadius: 2, fontSize: '0.78rem' }}
                  onClick={() => navigate(item.href)}
                >
                  Open
                </Button>
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default InspectionDashboard;
