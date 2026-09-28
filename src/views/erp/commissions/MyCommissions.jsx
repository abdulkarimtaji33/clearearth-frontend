import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, Grid, Paper, Stack, TablePagination,
} from '@mui/material';
import { IconCoin, IconCheck, IconClock } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_META = {
  accrued: { label: 'Accrued', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  in_payroll: { label: 'In Payroll', color: 'info' },
};

const StatCard = ({ icon, label, value, color }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{
        width: 40, height: 40, borderRadius: 2, bgcolor: `${color}.main`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          AED {Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const MyCommissions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getMyCommissions({ page: page + 1, limit: rowsPerPage });
      if (res.success) setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const commissions = data?.commissions || [];

  return (
    <PageContainer title="My Commissions" description="Your sales commission history">
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900}>My Commissions</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Commission earned on your approved quotations
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={<IconClock size={20} />} label="Accrued" value={data?.totalAccrued} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={<IconCheck size={20} />} label="Paid" value={data?.totalPaid} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={<IconCoin size={20} />} label="Total Earned" value={(data?.totalAccrued || 0) + (data?.totalPaid || 0) + (data?.totalInPayroll || 0)} color="primary" />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : commissions.length === 0 ? (
            <Box py={6} textAlign="center">
              <IconCoin size={40} style={{ opacity: 0.2 }} />
              <Typography color="text.secondary" mt={1}>No commissions yet</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Quotation</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Quotation Amount</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Commission</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commissions.map((c) => {
                      const meta = STATUS_META[c.status] || { label: c.status, color: 'default' };
                      return (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {c.quotation?.reference_number ? `QT-${c.quotation.reference_number}` : `#${c.quotation_id}`}
                          </TableCell>
                          <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                          <TableCell align="right">AED {Number(c.quotation_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right">{c.commission_percentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            AED {Number(c.commission_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 700 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={data?.total || 0}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default MyCommissions;
