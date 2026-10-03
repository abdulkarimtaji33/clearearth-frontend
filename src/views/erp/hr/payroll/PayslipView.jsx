import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Divider, Alert, Button, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconDownload, IconReceipt2, IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { useParams } from 'react-router';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, DetailGrid, DetailItem, StatusChip, PersonAvatar, LoadingBlock,
  fmtMoney, fullName, cardSx,
} from '../components/HrUi';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const LineItem = ({ label, value, muted }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2} py={1}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500} color={muted ? 'text.secondary' : 'text.primary'} sx={{ whiteSpace: 'nowrap' }}>{value}</Typography>
  </Stack>
);

const LineColumn = ({ icon: Icon, title, tone, items, totalLabel, total }) => (
  <Box sx={{ ...cardSx, overflow: 'hidden' }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 2, py: 1.25, bgcolor: (t) => alpha(t.palette[tone].main, 0.08), borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Box sx={{ color: `${tone}.main`, display: 'flex' }}><Icon size={18} /></Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>
        {title}
      </Typography>
    </Stack>
    <Box sx={{ px: 2 }}>
      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
        {items.map((it) => <LineItem key={it.label} {...it} />)}
      </Stack>
    </Box>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: (t) => alpha(t.palette.text.primary, 0.025) }}
    >
      <Typography variant="body2" fontWeight={700}>{totalLabel}</Typography>
      <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>{total}</Typography>
    </Stack>
  </Box>
);

const PayslipView = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getHrPayslip(id);
      if (res.success) setPayslip(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load payslip');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const download = async () => {
    setDownloading(true);
    try { await apiService.downloadHrPayslipPdf(id); } catch (err) { setError(err.message || 'Download failed'); } finally { setDownloading(false); }
  };

  const shell = (children, extra = {}) => (
    <HrPage title="Payslip" description="Payslip breakdown" back={-1} maxWidth={900} {...extra}>
      {children}
    </HrPage>
  );

  if (loading) return shell(<LoadingBlock py={12} />);
  if (error && !payslip) return shell(<Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>);
  if (!payslip) return null;

  const run = payslip.payrollRun;
  const period = run?.period_month ? `${MONTHS[run.period_month - 1]} ${run.period_year}` : '';
  const employee = payslip.employee;

  const earnings = [
    { label: 'Basic salary', value: fmtMoney(payslip.basic_salary || 0) },
    { label: 'Housing allowance', value: fmtMoney(payslip.housing_allowance || 0) },
    { label: 'Transport allowance', value: fmtMoney(payslip.transport_allowance || 0) },
    { label: 'Other allowance', value: fmtMoney(payslip.other_allowance || 0) },
    { label: 'Commission', value: fmtMoney(payslip.commission_amount || 0) },
  ];
  const deductions = [
    { label: 'Proration deduction', value: fmtMoney(payslip.proration_deduction || 0) },
    { label: 'Other deductions', value: fmtMoney(payslip.other_deductions || 0) },
  ];

  return shell(
    <>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <SectionCard noPadding>
        {/* Document header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ px: { xs: 2, sm: 3.5 }, py: { xs: 2.5, sm: 3 }, bgcolor: (t) => alpha(t.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={2} alignItems="center" minWidth={0}>
            <PersonAvatar person={employee} size={52} />
            <Box minWidth={0}>
              <Typography variant="h5" fontWeight={700} noWrap>{fullName(employee) || 'Employee'}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {[employee?.employee_code, period && `Pay period ${period}`].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color: 'text.secondary', display: 'flex' }}><IconReceipt2 size={18} /></Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} lineHeight={1}>Payslip</Typography>
            <StatusChip status={payslip.payment_status} />
          </Stack>
        </Stack>

        <Box sx={{ px: { xs: 2, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
          <DetailGrid min={160} sx={{ mb: 3 }}>
            <DetailItem label="Employee" value={fullName(employee)} />
            <DetailItem label="Employee code" value={employee?.employee_code} />
            <DetailItem label="Pay period" value={period} />
            <DetailItem label="Absent days" value={payslip.absent_days ?? 0} />
            <DetailItem label="Unpaid leave days" value={payslip.unpaid_leave_days ?? 0} />
          </DetailGrid>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
            <LineColumn
              icon={IconArrowUpRight}
              title="Earnings"
              tone="success"
              items={earnings}
              totalLabel="Gross salary"
              total={fmtMoney(payslip.gross_salary || 0)}
            />
            <LineColumn
              icon={IconArrowDownRight}
              title="Deductions"
              tone="error"
              items={deductions}
              totalLabel="Total deductions"
              total={fmtMoney(payslip.total_deductions || 0)}
            />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{
              mt: 3, px: { xs: 2, sm: 3 }, py: 2.5, borderRadius: 3,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.3),
            }}
          >
            <Box>
              <Typography variant="overline" color="primary.main" fontWeight={700} lineHeight={1.2}>Net pay</Typography>
              <Typography variant="body2" color="text.secondary">Gross salary minus total deductions</Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {fmtMoney(payslip.net_salary || 0)}
            </Typography>
          </Stack>
        </Box>
      </SectionCard>
    </>,
    {
      subtitle: period ? `Salary breakdown for ${period}` : 'Salary breakdown for the period',
      actions: (
        <Button
          variant="contained"
          startIcon={<IconDownload size={18} />}
          disabled={downloading}
          onClick={download}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      ),
    },
  );
};

export default PayslipView;
