import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack, Grid, Divider, Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCashBanknote } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_COLORS = { draft: 'default', processed: 'info', approved: 'warning', paid: 'success', cancelled: 'error' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const StatBox = ({ label, value }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
    <Typography variant="h5" fontWeight={800} mt={0.5}>{value}</Typography>
  </Paper>
);

const PayrollRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const canProcess = hasPermission('hr.payroll.process');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrPayrollRun(id);
      if (res.success) setRun(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load payroll run');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (fn) => {
    setActionLoading(true);
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;
  if (!run) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Payroll run not found'}</Alert>;

  return (
    <PageContainer title="Payroll Run Detail" description="Payroll run payslips">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={20} />} onClick={() => navigate('/erp/hr/payroll/runs')} sx={{ borderRadius: 2 }}>
            Back
          </Button>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h3" fontWeight={700}>{MONTHS[run.period_month - 1]} {run.period_year}</Typography>
              <Chip size="small" label={run.status} color={STATUS_COLORS[run.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
            </Stack>
          </Box>
          {canProcess && (
            <Stack direction="row" spacing={1}>
              {['draft', 'processed'].includes(run.status) && (
                <Button variant="contained" disabled={actionLoading} onClick={() => doAction(() => apiService.processHrPayrollRun(id))} sx={{ borderRadius: 2, fontWeight: 600 }}>Process</Button>
              )}
              {run.status === 'processed' && (
                <Button variant="contained" color="warning" disabled={actionLoading} onClick={() => doAction(() => apiService.approveHrPayrollRun(id))} sx={{ borderRadius: 2, fontWeight: 600 }}>Approve (Post to GL)</Button>
              )}
              {run.status === 'approved' && (
                <Button variant="contained" color="success" disabled={actionLoading} onClick={() => doAction(() => apiService.markHrPayrollRunPaid(id, {}))} sx={{ borderRadius: 2, fontWeight: 600 }}>Mark Paid</Button>
              )}
            </Stack>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={2.5} mb={3}>
          <Grid size={{ xs: 12, sm: 4 }}><StatBox label="Total Gross" value={Number(run.total_gross).toLocaleString()} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><StatBox label="Total Deductions" value={Number(run.total_deductions).toLocaleString()} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><StatBox label="Total Net" value={Number(run.total_net).toLocaleString()} /></Grid>
        </Grid>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Payslips</Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Employee', 'Basic', 'Gross', 'Deductions', 'Net', 'Payment', 'View'].map((h, i) => (
                      <TableCell key={i} align={i >= 1 && i <= 4 ? 'right' : i === 6 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(run.payslips || []).map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{p.employee?.first_name} {p.employee?.last_name} ({p.employee?.employee_code})</Typography></TableCell>
                      <TableCell align="right">{Number(p.basic_salary).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(p.gross_salary).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(p.total_deductions).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(p.net_salary).toLocaleString()}</TableCell>
                      <TableCell><Chip size="small" label={p.payment_status} color={p.payment_status === 'paid' ? 'success' : 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)} sx={{ borderRadius: 2, fontWeight: 600 }}>View</Button></TableCell>
                    </TableRow>
                  ))}
                  {(!run.payslips || run.payslips.length === 0) && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.secondary">No payslips yet — process the run</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default PayrollRunDetail;
