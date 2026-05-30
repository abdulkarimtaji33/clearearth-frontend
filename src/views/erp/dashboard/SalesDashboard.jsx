import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Chip, Button, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';

const STAGE_COLORS = {
  new: 'default',
  approved: 'info',
  quotation_sent: 'primary',
  negotiation: 'warning',
  won: 'success',
  lost: 'error',
};

const SalesDashboard = ({ data }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          My pipeline
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Your deals and action items
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              {...k}
              color={k.label?.toLowerCase().includes('follow') || k.label?.toLowerCase().includes('missing') ? 'warning' : 'primary'}
              highlight={k.label?.toLowerCase().includes('follow') && k.value > 0}
            />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Action items" items={data.actionables} />
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>
          Pipeline stages
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(data.pipeline || []).map((col) => (
            <Box
              key={col.status}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: col.count > 0 ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                textAlign: 'center',
                minWidth: 100,
              }}
            >
              <Typography variant="h6" fontWeight={800} color={col.count > 0 ? 'primary.main' : 'text.disabled'}>
                {col.count}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'capitalize' }}
              >
                {(col.status || '').replace(/_/g, ' ')}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Recent deals
          </Typography>
        </Box>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.recentDeals || []).slice(0, 8).map((d) => (
            <Stack
              key={d.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                px: 2.5,
                py: 1.25,
                transition: 'background 0.14s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {d.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {d.deal_number}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={(d.status || '').replace(/_/g, ' ')}
                  color={STAGE_COLORS[d.status] || 'default'}
                  sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.7rem' }}
                />
                <Button size="small" sx={{ borderRadius: 2 }} onClick={() => navigate(`/erp/deals/view/${d.id}`)}>
                  View
                </Button>
              </Stack>
            </Stack>
          ))}
          {!(data.recentDeals || []).length && (
            <Typography color="text.secondary" p={3} textAlign="center">
              No recent deals
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SalesDashboard;
