import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconCashBanknote } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_COLORS = { draft: 'default', processed: 'info', approved: 'warning', paid: 'success', cancelled: 'error' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayrollRunList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCashBanknote size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Payroll Runs</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {rows.length > 0 ? `${rows.length} payroll run${rows.length !== 1 ? 's' : ''}` : 'Process and review payroll periods'}
            </Typography>
          </Box>
          {canProcess && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
              New Run
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Period', 'Status', 'Gross', 'Deductions', 'Net', 'View'].map((h, i) => (
                    <TableCell key={i} align={i >= 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <IconCashBanknote size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No payroll runs yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/hr/payroll/runs/${r.id}`)}>
                      <TableCell><Typography variant="body2" fontWeight={700}>{MONTHS[r.period_month - 1]} {r.period_year}</Typography></TableCell>
                      <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">{Number(r.total_gross).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(r.total_deductions).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(r.total_net).toLocaleString()}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Button size="small" onClick={() => navigate(`/erp/hr/payroll/runs/${r.id}`)} sx={{ borderRadius: 2, fontWeight: 600 }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Payroll period is month/year based, not a calendar date — dropdown selectors intentionally retained */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>New Payroll Run</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField select label="Month" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Year" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={createRun} sx={{ borderRadius: 2 }}>Create</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PayrollRunList;
