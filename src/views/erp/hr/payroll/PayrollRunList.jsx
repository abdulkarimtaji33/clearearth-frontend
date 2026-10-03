import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack,
} from '@mui/material';
import {
  IconPlus, IconCashBanknote, IconFileDescription, IconProgressCheck, IconRosetteDiscountCheck, IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, EmptyState, LoadingBlock,
  tableSx, inputSx, dialogPaperProps, fmtMoney,
} from '../components/HrUi';

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

  const counts = useMemo(() => rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {}), [rows]);

  const openRun = (r) => navigate(`/erp/hr/payroll/runs/${r.id}`);

  return (
    <HrPage
      title="Payroll Runs"
      description="HR payroll runs"
      subtitle="Process, approve and pay monthly payroll periods."
      actions={canProcess && (
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 2.5 }}>
          New Run
        </Button>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={180} sx={{ mb: 3 }}>
        <StatTile icon={IconCashBanknote} label="Total runs" value={rows.length} loading={loading} />
        <StatTile icon={IconFileDescription} label="Draft" value={counts.draft || 0} tone="secondary" loading={loading} />
        <StatTile icon={IconProgressCheck} label="Processed" value={counts.processed || 0} tone="info" loading={loading} />
        <StatTile icon={IconRosetteDiscountCheck} label="Approved" value={counts.approved || 0} tone="warning" loading={loading} />
        <StatTile icon={IconCashBanknote} label="Paid" value={counts.paid || 0} tone="success" loading={loading} />
      </StatGrid>

      <SectionCard
        icon={IconCashBanknote}
        title="All payroll runs"
        subtitle={rows.length > 0 ? `${rows.length} run${rows.length !== 1 ? 's' : ''}` : 'No runs created yet'}
        noPadding
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IconCashBanknote}
            title="No payroll runs yet"
            message={canProcess ? 'Create a run for a month to generate payslips for active employees.' : 'Payroll runs will appear here once HR creates them.'}
            action={canProcess && (
              <Button variant="outlined" startIcon={<IconPlus size={16} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2 }}>
                New Run
              </Button>
            )}
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net pay</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => openRun(r)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap>{MONTHS[r.period_month - 1]} {r.period_year}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(r.total_gross)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtMoney(r.total_deductions)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{fmtMoney(r.total_net)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button size="small" endIcon={<IconChevronRight size={16} />} onClick={() => openRun(r)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      {/* Payroll period is month/year based, not a calendar date — dropdown selectors intentionally retained */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          New Payroll Run
          <Typography variant="body2" color="text.secondary" component="div" mt={0.5}>
            Choose the pay period to generate payslips for.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '3fr 2fr' }, gap: 2, mt: 1 }}>
            <TextField select label="Month" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: Number(e.target.value) })} sx={inputSx}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Year" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })} sx={inputSx} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setFormOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={createRun} sx={{ borderRadius: 2, fontWeight: 600 }}>Create Run</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default PayrollRunList;
