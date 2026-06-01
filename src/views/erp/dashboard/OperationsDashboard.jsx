import React from 'react';
import { Box, Grid, Typography, Divider, Paper, Chip, Button, Stack, Avatar } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconBuildingFactory2, IconAlertCircle, IconCoin, IconPackage, IconTruck,
  IconArrowRight, IconCalendarX, IconUser,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';

const KPI_ICONS = {
  'Work orders in progress': IconBuildingFactory2,
  'Overdue tasks': IconCalendarX,
  'Expenses pending': IconCoin,
  'GRNs pending': IconPackage,
};

const STATUS_COLOR = { not_started: 'default', in_progress: 'primary', completed: 'success' };

const daysOverdue = (endDate) => {
  if (!endDate) return 0;
  const diff = Math.floor((Date.now() - new Date(endDate).getTime()) / 86400000);
  return Math.max(0, diff);
};

const OperationsDashboard = ({ data }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>Operations</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>Throughput, bottlenecks and approvals</Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...k} icon={KPI_ICONS[k.label]} color={k.highlight ? 'error' : 'primary'} highlight={k.highlight} />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Bottlenecks & approvals" items={data.actionables} />
      </Box>

      {(data.overdueTasks || []).length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.35), overflow: 'hidden', mb: 3.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, bgcolor: alpha(theme.palette.error.main, 0.05), borderBottom: '1px solid', borderColor: alpha(theme.palette.error.main, 0.15) }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconAlertCircle size={16} color={theme.palette.error.main} />
                <Typography variant="subtitle2" fontWeight={800} color="error.main">Overdue tasks ({data.overdueTasks.length})</Typography>
              </Stack>
              <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/work-orders')} sx={{ borderRadius: 2, fontSize: '0.78rem', color: 'error.main' }}>
                View WOs
              </Button>
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {data.overdueTasks.map((t) => {
                const days = daysOverdue(t.endDate);
                return (
                  <Stack key={t.taskId} direction="row" alignItems="center" spacing={2} sx={{ px: 2.5, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(`/erp/work-orders/edit/${t.workOrderId}`)}>
                    <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: days > 3 ? 'error.main' : 'warning.main', flexShrink: 0 }} />
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>{t.workOrderTitle}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">{t.typeOfWork || 'Task'}</Typography>
                        {t.assignedTo && t.assignedTo !== 'Unassigned' && (
                          <>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <IconUser size={11} color={theme.palette.text.disabled} />
                            <Typography variant="caption" color="text.secondary">{t.assignedTo}</Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                      <Chip size="small" label={`${days}d overdue`} color="error" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      <Chip size="small" label={(t.status || '').replace(/_/g, ' ')} color={STATUS_COLOR[t.status] || 'default'} sx={{ fontWeight: 700, fontSize: '0.66rem', height: 20, textTransform: 'capitalize' }} />
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </>
      )}

      {(data.driverActivity || []).length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconTruck size={16} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight={800}>Driver activity</Typography>
            </Stack>
            <Chip size="small" label={`${data.driverActivity.length} active`} color="primary" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
          </Stack>
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {data.driverActivity.map((t) => (
              <Stack key={t.taskId} direction="row" alignItems="center" spacing={2} sx={{ px: 2.5, py: 1.4, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(`/erp/work-orders/edit/${t.workOrderId || ''}`)}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.78rem', fontWeight: 800 }}>
                  {(t.driverName || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{t.driverName || 'Unknown driver'}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{t.workOrderTitle}</Typography>
                </Box>
                <Chip size="small" label={(t.status || '').replace(/_/g, ' ')} color={STATUS_COLOR[t.status] || 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, textTransform: 'capitalize', flexShrink: 0 }} />
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default OperationsDashboard;
