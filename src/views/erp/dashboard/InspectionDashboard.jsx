import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Button, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import KpiCard from './shared/KpiCard';

const PRIORITY_META = {
  critical: { color: '#D32F2F', bg: 'rgba(211,47,47,0.07)', label: 'Critical', chip: 'error' },
  high:     { color: '#E65100', bg: 'rgba(230,81,0,0.06)',  label: 'High',     chip: 'warning' },
  medium:   { color: '#1565C0', bg: 'rgba(21,101,192,0.05)',label: 'Medium',   chip: 'info' },
  low:      { color: '#2E7D32', bg: 'rgba(46,125,50,0.04)', label: 'Low',      chip: 'success' },
};

const InspectionDashboard = ({ data }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const urgentKpi = (data.kpis || []).find((k) => k.highlight);
  const urgentCount = urgentKpi ? Number(urgentKpi.value || 0) : 0;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>Inspection queue</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>Your assigned inspection work</Typography>
      </Box>

      {urgentCount > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.35), bgcolor: alpha(theme.palette.error.main, 0.05), display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(theme.palette.error.main, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconAlertCircle size={24} color={theme.palette.error.main} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} color="error.main">{urgentCount} request{urgentCount !== 1 ? 's' : ''} require action</Typography>
            <Typography variant="body2" color="text.secondary">New assignments are waiting for you below</Typography>
          </Box>
          <Chip label="ACTION REQUIRED" size="small" sx={{ bgcolor: theme.palette.error.main, color: '#fff', fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }} />
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography fontWeight={800}>Open inspection requests</Typography>
          {(data.actionables || []).length > 0 && (
            <Chip size="small" label={data.actionables.length} color="primary" sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
          )}
        </Stack>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.actionables || []).length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" fontWeight={700}>✓ All clear!</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>No open inspection requests</Typography>
            </Box>
          ) : (
            (data.actionables || []).map((item) => {
              const meta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
              return (
                <Stack key={item.id} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ px: 2.5, py: 1.5, transition: 'background 0.14s', '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', borderLeft: '4px solid', borderColor: meta.color }}
                  onClick={() => navigate(item.href)}
                >
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.label}</Typography>
                    <Chip size="small" label={meta.label} sx={{ mt: 0.5, height: 18, fontSize: '0.63rem', fontWeight: 700, bgcolor: alpha(meta.color, 0.1), color: meta.color }} />
                  </Box>
                  <Button size="small" variant="contained" sx={{ borderRadius: 2, fontSize: '0.78rem', ml: 1, flexShrink: 0, bgcolor: meta.color, '&:hover': { bgcolor: meta.color, filter: 'brightness(0.9)' } }}
                    onClick={(e) => { e.stopPropagation(); navigate(item.href); }}
                  >
                    Open
                  </Button>
                </Stack>
              );
            })
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default InspectionDashboard;
