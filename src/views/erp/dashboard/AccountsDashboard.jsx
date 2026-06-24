import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Button, Divider, LinearProgress, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconReceiptTax, IconReceiptRefund, IconReceipt, IconCoin, IconArrowRight,
  IconTrendingUp, IconTrendingDown, IconAlertTriangle,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';

const KPI_LABEL_MAP = {
  'Outstanding AR': 'Accounts Receivable (money owed to you)',
  'Outstanding AP': 'Accounts Payable (money you owe)',
};

const KPI_ICONS = {
  'Outstanding AR': IconReceiptTax,
  'Outstanding AP': IconReceiptRefund,
  'Expense approvals': IconCoin,
};

const QUICK_ACTIONS = [
  { label: 'Receivables', sub: 'Track incoming payments', icon: IconReceiptTax, href: '/erp/receivables', color: 'success' },
  { label: 'Payables', sub: 'Track outgoing payments', icon: IconReceiptRefund, href: '/erp/payables', color: 'error' },
  { label: 'Payment Receipts', sub: 'Purchase payment receipts', icon: IconReceipt, href: '/erp/payment-receipts', color: 'success' },
  { label: 'Tax Invoices', sub: 'View all tax invoices', icon: IconTrendingUp, href: '/erp/tax-invoices', color: 'primary' },
  { label: 'Expenses', sub: 'Review work order expenses', icon: IconCoin, href: '/erp/accounts/work-orders', color: 'warning' },
];

const AgingBar = ({ label, buckets, color }) => {
  const theme = useTheme();
  const c = theme.palette[color]?.main || theme.palette.primary.main;
  const entries = Object.entries(buckets || {}).filter(([, v]) => parseFloat(v) > 0);
  const total = entries.reduce((s, [, v]) => s + parseFloat(v), 0);
  if (!entries.length || !total) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" fontWeight={800}>{label}</Typography>
        <Typography variant="body2" fontWeight={700} color={`${color}.main`}>
          AED {total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        {entries.map(([bucket, value]) => {
          const pct = (parseFloat(value) / total) * 100;
          const isOld = bucket.includes('90') || bucket.includes('61');
          return (
            <Box key={bucket}>
              <Stack direction="row" justifyContent="space-between" mb={0.3}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {isOld && <IconAlertTriangle size={12} color={theme.palette.warning.main} />}
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{bucket} days</Typography>
                </Stack>
                <Typography variant="caption" fontWeight={700}>
                  AED {parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate" value={pct}
                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(isOld ? theme.palette.warning.main : c, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: isOld ? 'warning.main' : c } }}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

const AccountsDashboard = ({ data }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const arTotal = (data.kpis || []).find((k) => k.label === 'Outstanding AR')?.value || 0;
  const apTotal = (data.kpis || []).find((k) => k.label === 'Outstanding AP')?.value || 0;
  const hasAging = Object.keys(data.arAgingBuckets || {}).length > 0 || Object.keys(data.apAgingBuckets || {}).length > 0;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>Accounts</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>Financial overview and quick actions</Typography>
      </Box>

      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
            <KpiCard
              {...k}
              label={KPI_LABEL_MAP[k.label] || k.label}
              icon={KPI_ICONS[k.label]}
              color={k.label === 'Expense approvals' && k.value > 0 ? 'warning' : k.label === 'Outstanding AR' ? 'success' : 'error'}
              highlight={k.label === 'Expense approvals' && k.value > 0}
            />
          </Grid>
        ))}
      </Grid>

      {/* AR vs AP comparison bar */}
      {(arTotal > 0 || apTotal > 0) && (() => {
        const maxVal = Math.max(arTotal, apTotal, 1);
        return (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3.5 }}>
            <Typography variant="subtitle2" fontWeight={800} mb={0.25}>Accounts Receivable vs Payable</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>Money owed to you vs money you owe</Typography>
            <Stack spacing={1.5}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <IconTrendingUp size={15} color={theme.palette.success.main} />
                    <Typography variant="body2" fontWeight={700} color="success.main">Accounts Receivable — money owed to you</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={800}>AED {Number(arTotal).toLocaleString()}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(arTotal / maxVal) * 100} sx={{ height: 10, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'success.main' } }} />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <IconTrendingDown size={15} color={theme.palette.error.main} />
                    <Typography variant="body2" fontWeight={700} color="error.main">Accounts Payable — money you owe</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={800}>AED {Number(apTotal).toLocaleString()}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(apTotal / maxVal) * 100} sx={{ height: 10, borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'error.main' } }} />
              </Box>
            </Stack>
          </Paper>
        );
      })()}

      {/* Aging breakdown */}
      {hasAging && (
        <Grid container spacing={2.5} mb={3.5}>
          {Object.keys(data.arAgingBuckets || {}).length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.25) }}>
                <AgingBar label="Accounts Receivable — aging breakdown" buckets={data.arAgingBuckets} color="success" />
              </Paper>
            </Grid>
          )}
          {Object.keys(data.apAgingBuckets || {}).length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.25) }}>
                <AgingBar label="AP aging breakdown" buckets={data.apAgingBuckets} color="error" />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Quick actions */}
      <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Quick actions</Typography>
      <Grid container spacing={1.5}>
        {QUICK_ACTIONS.map(({ label, sub, icon: Icon, href, color }) => {
          const c = theme.palette[color]?.main || theme.palette.primary.main;
          return (
            <Grid key={label} size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                onClick={() => navigate(href)}
                sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.15s', '&:hover': { borderColor: alpha(c, 0.5), bgcolor: alpha(c, 0.04), transform: 'translateY(-1px)', boxShadow: `0 3px 12px ${alpha(c, 0.1)}` } }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(c, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={c} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{sub}</Typography>
                </Box>
                <IconArrowRight size={16} color={theme.palette.text.disabled} />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default AccountsDashboard;
