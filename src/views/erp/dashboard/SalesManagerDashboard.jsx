import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip, LinearProgress, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconTrophy, IconMedal } from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const SalesManagerDashboard = ({ data }) => {
  const theme = useTheme();
  const maxWon = Math.max(...(data.leaderboard || []).map((r) => parseFloat(r.total || 0)), 1);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          Team performance
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Leaderboard, pipeline and stale deals
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Stale deals & attention needed" items={data.actionables} />
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconTrophy size={18} color={theme.palette.warning.main} />
                <Typography variant="subtitle2" fontWeight={800}>
                  Won deals leaderboard
                </Typography>
              </Stack>
            </Box>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.leaderboard || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center">
                  No data yet
                </Typography>
              ) : (
                data.leaderboard.map((row, i) => {
                  const total = parseFloat(row.total || 0);
                  const pct = (total / maxWon) * 100;
                  const name = row.user
                    ? `${row.user.first_name} ${row.user.last_name}`
                    : 'Unassigned';
                  return (
                    <Box key={i} sx={{ px: 2.5, py: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          {i < 3 ? (
                            <IconMedal size={18} color={MEDAL_COLORS[i]} />
                          ) : (
                            <Typography
                              variant="caption"
                              fontWeight={800}
                              color="text.disabled"
                              sx={{ width: 18, textAlign: 'center' }}
                            >
                              {i + 1}
                            </Typography>
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            {name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={800} color="success.main">
                          AED {total.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.success.main, 0.12),
                          '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' },
                        }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>
                Pipeline by stage
              </Typography>
            </Box>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.pipeline || []).map((p) => (
                <Stack
                  key={p.status}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 2.5, py: 1.25 }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {(p.status || '').replace(/_/g, ' ')}
                  </Typography>
                  <Chip
                    size="small"
                    label={p.count}
                    variant="outlined"
                    sx={{ fontWeight: 700, minWidth: 36 }}
                  />
                </Stack>
              ))}
              {!(data.pipeline || []).length && (
                <Typography color="text.secondary" p={3} textAlign="center">
                  No pipeline data
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesManagerDashboard;
