import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconChartHistogram } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AgingSummaryView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getReceivablesAgingSummary({});
      if (res.success && res.data) setData(res.data);
      else if (!res.success) setError(res.message || 'Failed to load aging data');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <PageContainer title="AR aging">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  const b = data?.buckets || {};
  const cards = [
    { label: 'Current (0–30 days)', value: b.current, color: theme.palette.success.main },
    { label: '31–60 days', value: b.bucket_31_60, color: theme.palette.info.main },
    { label: '61–90 days', value: b.bucket_61_90, color: theme.palette.warning.main },
    { label: 'Over 90 days', value: b.bucket_over_90, color: theme.palette.error.main },
  ];

  return (
    <PageContainer title="Receivables aging" description="Outstanding balances by days open (from invoice date)">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/receivables')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconChartHistogram size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Aging summary</Typography>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} mb={3}>
        {cards.map((c) => (
          <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, borderColor: alpha(c.color, 0.35) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">{c.label}</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: c.color, mt: 0.5 }}>AED {fmt(c.value)}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={800}>By client</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Client', 'Total', '0–30', '31–60', '61–90', '90+'].map((h) => (
                  <TableCell key={h} align={h === 'Client' ? 'left' : 'right'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {asArray(data?.byClient).length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">{error ? 'Could not load data' : 'No open receivables'}</Typography></TableCell></TableRow>
              ) : asArray(data?.byClient).map((row) => (
                <TableRow key={row.companyId || row.companyName}>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell align="right">{fmt(row.total)}</TableCell>
                  <TableCell align="right">{fmt(row.current)}</TableCell>
                  <TableCell align="right">{fmt(row.bucket_31_60)}</TableCell>
                  <TableCell align="right">{fmt(row.bucket_61_90)}</TableCell>
                  <TableCell align="right">{fmt(row.bucket_over_90)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageContainer>
  );
};

export default AgingSummaryView;
