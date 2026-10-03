import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
  Alert, Button, Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconCashBanknote, IconUsers, IconCoin, IconReceiptTax, IconWallet, IconCheck, IconFileInvoice,
  IconPlayerPlay, IconRosetteDiscountCheck, IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, PersonCell, EmptyState, LoadingBlock,
  tableSx, fmtMoney,
} from '../components/HrUi';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STEPS = [
  { key: 'draft', label: 'Draft', hint: 'Run created' },
  { key: 'processed', label: 'Processed', hint: 'Payslips calculated' },
  { key: 'approved', label: 'Approved', hint: 'Posted to GL' },
  { key: 'paid', label: 'Paid', hint: 'Salaries disbursed' },
];

/** Horizontal progress tracker for the run lifecycle (stacks vertically on phones). */
const RunProgress = ({ status }) => {
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${STEPS.length}, 1fr)` }, gap: { xs: 1.5, sm: 0 } }}>
      {STEPS.map((step, i) => {
        const done = current >= 0 && i < current;
        const active = i === current;
        const reached = done || active;
        const tone = status === 'paid' && active ? 'success' : 'primary';
        return (
          <Stack
            key={step.key}
            direction={{ xs: 'row', sm: 'column' }}
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            spacing={{ xs: 1.5, sm: 1 }}
            sx={{ position: 'relative', pr: { sm: 2 } }}
          >
            <Stack direction="row" alignItems="center" sx={{ width: { sm: '100%' } }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                fontWeight: 700, fontSize: 13,
                bgcolor: (t) => (done || (active && status === 'paid')
                  ? t.palette[tone].main
                  : active ? alpha(t.palette[tone].main, 0.14) : alpha(t.palette.text.primary, 0.06)),
                color: (t) => (done || (active && status === 'paid')
                  ? t.palette[tone].contrastText
                  : active ? t.palette[tone].main : t.palette.text.disabled),
                border: '2px solid',
                borderColor: (t) => (reached ? t.palette[tone].main : 'transparent'),
              }}
              >
                {done || (active && status === 'paid') ? <IconCheck size={16} stroke={3} /> : i + 1}
              </Box>
              {i < STEPS.length - 1 && (
                <Box sx={{
                  display: { xs: 'none', sm: 'block' }, flex: 1, height: 2, mx: 1, borderRadius: 1,
                  bgcolor: (t) => (done ? t.palette.primary.main : alpha(t.palette.text.primary, 0.1)),
                }}
                />
              )}
            </Stack>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={active ? 700 : 600} color={reached ? 'text.primary' : 'text.secondary'}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">{step.hint}</Typography>
            </Box>
          </Stack>
        );
      })}
    </Box>
  );
};

const sum = (list, key) => list.reduce((acc, p) => acc + (Number(p[key]) || 0), 0);

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

  const payslips = useMemo(() => run?.payslips || [], [run]);
  const totals = useMemo(() => {
    if (payslips.length === 0) {
      return { gross: run?.total_gross, deductions: run?.total_deductions, net: run?.total_net, basic: null };
    }
    return {
      basic: sum(payslips, 'basic_salary'),
      gross: sum(payslips, 'gross_salary'),
      deductions: sum(payslips, 'total_deductions'),
      net: sum(payslips, 'net_salary'),
    };
  }, [payslips, run]);

  if (loading) {
    return (
      <HrPage title="Payroll Run" description="Payroll run payslips" back="/erp/hr/payroll/runs" backLabel="Payroll runs">
        <LoadingBlock py={12} />
      </HrPage>
    );
  }
  if (!run) {
    return (
      <HrPage title="Payroll Run" description="Payroll run payslips" back="/erp/hr/payroll/runs" backLabel="Payroll runs">
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Payroll run not found'}</Alert>
      </HrPage>
    );
  }

  const period = `${MONTHS[run.period_month - 1]} ${run.period_year}`;

  const actions = canProcess && (
    <>
      {['draft', 'processed'].includes(run.status) && (
        <Button
          variant={run.status === 'draft' ? 'contained' : 'outlined'}
          startIcon={<IconPlayerPlay size={18} />}
          disabled={actionLoading}
          onClick={() => doAction(() => apiService.processHrPayrollRun(id))}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {run.status === 'processed' ? 'Re-process' : 'Process'}
        </Button>
      )}
      {run.status === 'processed' && (
        <Button
          variant="contained"
          color="warning"
          startIcon={<IconRosetteDiscountCheck size={18} />}
          disabled={actionLoading}
          onClick={() => doAction(() => apiService.approveHrPayrollRun(id))}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Approve (Post to GL)
        </Button>
      )}
      {run.status === 'approved' && (
        <Button
          variant="contained"
          color="success"
          startIcon={<IconWallet size={18} />}
          disabled={actionLoading}
          onClick={() => doAction(() => apiService.markHrPayrollRunPaid(id, {}))}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Mark Paid
        </Button>
      )}
    </>
  );

  return (
    <HrPage
      title={period}
      description="Payroll run payslips"
      back="/erp/hr/payroll/runs"
      backLabel="Payroll runs"
      subtitle={(
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <span>Payroll run</span>
          <StatusChip status={run.status} />
        </Stack>
      )}
      actions={actions}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <SectionCard sx={{ mb: 3 }}>
        {run.status === 'cancelled' ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>This payroll run was cancelled.</Alert>
        ) : (
          <RunProgress status={run.status} />
        )}
      </SectionCard>

      <StatGrid min={200} sx={{ mb: 3 }}>
        <StatTile icon={IconUsers} label="Employees" value={payslips.length} />
        <StatTile icon={IconCoin} label="Total gross" value={fmtMoney(totals.gross)} tone="info" />
        <StatTile icon={IconReceiptTax} label="Total deductions" value={fmtMoney(totals.deductions)} tone="warning" />
        <StatTile icon={IconCashBanknote} label="Total net pay" value={fmtMoney(totals.net)} tone="success" />
      </StatGrid>

      <SectionCard
        icon={IconFileInvoice}
        title="Payslips"
        subtitle={payslips.length > 0 ? `${payslips.length} employee${payslips.length !== 1 ? 's' : ''} in this run` : undefined}
        noPadding
      >
        {payslips.length === 0 ? (
          <EmptyState
            icon={IconFileInvoice}
            title="No payslips yet"
            message="Process the run to calculate payslips for all active employees."
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              sx={{
                ...tableSx,
                minWidth: 860,
                '& tfoot td': {
                  borderTop: '1px solid', borderBottom: 0, borderColor: 'divider', fontWeight: 700, fontSize: 14,
                  color: 'text.primary', bgcolor: (t) => alpha(t.palette.text.primary, 0.025), py: 1.5,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Basic</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net pay</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <PersonCell person={p.employee} secondary={p.employee?.employee_code} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtMoney(p.basic_salary)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(p.gross_salary)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtMoney(p.total_deductions)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{fmtMoney(p.net_salary)}</TableCell>
                    <TableCell><StatusChip status={p.payment_status} /></TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        endIcon={<IconChevronRight size={16} />}
                        onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Totals</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(totals.basic)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(totals.gross)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(totals.deductions)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtMoney(totals.net)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </HrPage>
  );
};

export default PayrollRunDetail;
