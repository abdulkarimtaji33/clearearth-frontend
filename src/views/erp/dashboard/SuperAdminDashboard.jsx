import React from 'react';
import {
  Box, Grid, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBuilding } from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';

const SuperAdminDashboard = ({ data }) => {
  const theme = useTheme();

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
          System overview
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          All tenants and platform health
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconBuilding size={18} color={theme.palette.primary.main} />
            <Typography variant="subtitle2" fontWeight={800}>
              Tenants
            </Typography>
          </Stack>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              {['Tenant', 'Status', 'Created'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.tenants || []).map((t) => (
              <TableRow
                key={t.id}
                sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.14s' }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {t.company_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={t.status}
                    color={t.status === 'active' ? 'success' : 'default'}
                    sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {t.created_at?.slice?.(0, 10)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {!(data.tenants || []).length && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No tenants found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default SuperAdminDashboard;
