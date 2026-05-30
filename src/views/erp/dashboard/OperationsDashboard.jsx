import React from 'react';
import { Box, Grid, Typography, Divider, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconBuildingFactory2, IconAlertCircle, IconCoin, IconPackage, IconTruck,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import ActionableList from './shared/ActionableList';

const KPI_ICONS = {
  'Work orders in progress': IconBuildingFactory2,
  'Overdue tasks': IconAlertCircle,
  'Expenses pending': IconCoin,
  'GRNs pending': IconPackage,
};

const TASK_STATUS_COLOR = { not_started: 'default', in_progress: 'info', completed: 'success' };

const OperationsDashboard = ({ data }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          Operations
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Throughput, bottlenecks and approvals
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              {...k}
              icon={KPI_ICONS[k.label]}
              color={k.highlight ? 'error' : 'primary'}
              highlight={k.highlight}
            />
          </Grid>
        ))}
      </Grid>

      <Box mb={3.5}>
        <ActionableList title="Bottlenecks & approvals" items={data.actionables} />
      </Box>

      {(data.overdueTasks || []).length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.3), overflow: 'hidden', mb: 3.5 }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconAlertCircle size={16} color={theme.palette.error.main} />
                <Typography variant="subtitle2" fontWeight={800} color="error.main">
                  Overdue tasks ({data.overdueTasks.length})
                </Typography>
              </Stack>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.03) }}>
                  {['Work order', 'Task', 'Assigned to', 'Due date', 'Status', ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.overdueTasks.map((t) => (
                  <TableRow key={t.taskId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.workOrderTitle}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{t.typeOfWork || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{t.assignedTo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main" fontWeight={600}>{t.endDate}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={(t.status || '').replace(/_/g, ' ')} color={TASK_STATUS_COLOR[t.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" sx={{ borderRadius: 2 }} onClick={() => navigate(`/erp/work-orders/edit/${t.workOrderId}`)}>Open</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {(data.driverActivity || []).length > 0 && (
        <>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconTruck size={16} color={theme.palette.primary.main} />
                <Typography variant="subtitle2" fontWeight={800}>Driver activity</Typography>
              </Stack>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  {['Driver', 'Work order', 'Status', 'Start date'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.driverActivity.map((t) => (
                  <TableRow key={t.taskId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{t.driverName}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{t.workOrderTitle}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" label={(t.status || '').replace(/_/g, ' ')} color={TASK_STATUS_COLOR[t.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{t.startDate || '—'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default OperationsDashboard;
