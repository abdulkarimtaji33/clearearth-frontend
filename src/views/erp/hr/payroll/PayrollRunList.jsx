import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack,
} from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_COLORS = { draft: 'default', processed: 'info', approved: 'warning', paid: 'success', cancelled: 'error' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayrollRunList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() });

  const canProcess = hasPermission('hr.payroll.process');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listHrPayrollRuns({});
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRun = async () => {
    try {
      const res = await apiService.createHrPayrollRun(form.periodMonth, form.periodYear);
      setFormOpen(false);
      if (res.data?.id) navigate(`/erp/hr/payroll/runs/${res.data.id}`);
      else load();
    } catch (err) {
      setError(err.message || 'Failed to create payroll run');
    }
  };

  return (
    <PageContainer title="Payroll Runs" description="HR payroll runs">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>Payroll Runs</Typography>
          {canProcess && <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)}>New Run</Button>}
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell><TableCell>Status</TableCell><TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Deductions</TableCell><TableCell align="right">Net</TableCell><TableCell align="right">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{MONTHS[r.period_month - 1]} {r.period_year}</TableCell>
                    <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} /></TableCell>
                    <TableCell align="right">{Number(r.total_gross).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(r.total_deductions).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(r.total_net).toLocaleString()}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/hr/payroll/runs/${r.id}`)}>View</Button></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center">No payroll runs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Payroll Run</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField select label="Month" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: Number(e.target.value) })}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Year" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createRun}>Create</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PayrollRunList;
