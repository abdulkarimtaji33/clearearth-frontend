import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_COLORS = { draft: 'default', processed: 'info', approved: 'warning', paid: 'success', cancelled: 'error' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayrollRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  if (!run) return <Alert severity="error">{error || 'Payroll run not found'}</Alert>;

  return (
    <PageContainer title="Payroll Run Detail" description="Payroll run payslips">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{MONTHS[run.period_month - 1]} {run.period_year}</Typography>
            <Chip size="small" label={run.status} color={STATUS_COLORS[run.status]} sx={{ mt: 1 }} />
          </Box>
          {canProcess && (
            <Stack direction="row" spacing={1}>
              {['draft', 'processed'].includes(run.status) && (
                <Button variant="contained" disabled={actionLoading} onClick={() => doAction(() => apiService.processHrPayrollRun(id))}>Process</Button>
              )}
              {run.status === 'processed' && (
                <Button variant="contained" color="warning" disabled={actionLoading} onClick={() => doAction(() => apiService.approveHrPayrollRun(id))}>Approve (Post to GL)</Button>
              )}
              {run.status === 'approved' && (
                <Button variant="contained" color="success" disabled={actionLoading} onClick={() => doAction(() => apiService.markHrPayrollRunPaid(id, {}))}>Mark Paid</Button>
              )}
            </Stack>
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction="row" spacing={4} mb={2}>
          <Box><Typography variant="caption" color="text.secondary">Total Gross</Typography><Typography variant="h6">{Number(run.total_gross).toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Total Deductions</Typography><Typography variant="h6">{Number(run.total_deductions).toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Total Net</Typography><Typography variant="h6">{Number(run.total_net).toLocaleString()}</Typography></Box>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell><TableCell align="right">Basic</TableCell><TableCell align="right">Gross</TableCell>
                <TableCell align="right">Deductions</TableCell><TableCell align="right">Net</TableCell><TableCell>Payment</TableCell><TableCell align="right">View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(run.payslips || []).map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.employee?.first_name} {p.employee?.last_name} ({p.employee?.employee_code})</TableCell>
                  <TableCell align="right">{Number(p.basic_salary).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(p.gross_salary).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(p.total_deductions).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(p.net_salary).toLocaleString()}</TableCell>
                  <TableCell><Chip size="small" label={p.payment_status} color={p.payment_status === 'paid' ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)}>View</Button></TableCell>
                </TableRow>
              ))}
              {(!run.payslips || run.payslips.length === 0) && <TableRow><TableCell colSpan={7} align="center">No payslips yet — process the run</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </PageContainer>
  );
};

export default PayrollRunDetail;
