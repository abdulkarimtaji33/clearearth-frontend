import React from 'react';
import { Box, Grid, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import KpiCard from '../shared/KpiCard';

const SuperAdminDashboard = ({ data }) => (
  <Box>
    <Typography variant="h4" fontWeight={800} mb={3}>System overview</Typography>
    <Grid container spacing={2} mb={3}>
      {(data.kpis || []).map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
          <KpiCard {...k} />
        </Grid>
      ))}
    </Grid>
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Tenant', 'Status', 'Created'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {(data.tenants || []).map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.company_name}</TableCell>
              <TableCell><Chip size="small" label={t.status} color={t.status === 'active' ? 'success' : 'default'} /></TableCell>
              <TableCell>{t.created_at?.slice?.(0, 10)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

export default SuperAdminDashboard;
