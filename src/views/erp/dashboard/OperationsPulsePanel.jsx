import React from 'react';
import { Box, Typography, Stack, Paper, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import {
  IconUsers, IconFileCheck, IconSend, IconCircleCheck,
  IconClipboardList, IconPackage, IconReceipt2,
  IconArrowUpRight, IconArrowDownRight, IconMinus,
} from '@tabler/icons-react';

const METRIC_ICONS = {
  leadsCreated: IconUsers,
  dealsConverted: IconFileCheck,
  quotationsSent: IconSend,
  dealsWon: IconCircleCheck,
  workOrdersScheduled: IconClipboardList,
  workOrdersCompleted: IconPackage,
  invoicesGenerated: IconReceipt2,
};

const compactCurrency = (v) => {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `AED ${(n / 1_000).toFixed(1)}K`;
  return `AED ${n.toLocaleString()}`;
};

const metricValue = (m) => (m.format === 'currency' ? compactCurrency(m.value) : Number(m.value || 0).toLocaleString());

const Sparkline = ({ points = [], color, height = 34 }) => {
  if (!points.length) return <Box sx={{ height }} />;
  return (
    <Chart
      type="area"
      height={height}
      series={[{ name: 'v', data: points.map((p) => Number(p.value) || 0) }]}
      options={{
        chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
        stroke: { width: 2, curve: 'smooth' },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] } },
        colors: [color],
        tooltip: { enabled: false },
      }}
    />
  );
};

const Delta = ({ pct }) => {
  const theme = useTheme();
  const n = Number(pct || 0);
  if (n === 0) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.4} sx={{ color: 'text.disabled' }}>
        <IconMinus size={13} />
        <Typography variant="caption" fontWeight={700}>No change</Typography>
      </Stack>
    );
  }
  const up = n > 0;
  const c = up ? theme.palette.success.main : theme.palette.error.main;
  return (
    <Stack direction="row" alignItems="center" spacing={0.4} sx={{ color: c }}>
      {up ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
      <Typography variant="caption" fontWeight={700}>{Math.abs(n).toFixed(1)}%</Typography>
      <Typography variant="caption" color="text.secondary">vs previous</Typography>
    </Stack>
  );
};

const MetricCard = ({ metric }) => {
  const theme = useTheme();
  const Icon = METRIC_ICONS[metric.key] || IconFileCheck;
  const c = theme.palette.primary.main;
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1.25} mb={1}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(c, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={c} />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>{metric.label}</Typography>
      </Stack>
      <Typography variant="h4" fontWeight={800} lineHeight={1.15}>{metricValue(metric)}</Typography>
      <Box mt={0.5} mb={1}><Delta pct={metric.deltaPct} /></Box>
      <Box sx={{ mt: 'auto' }}><Sparkline points={metric.trend} color={c} /></Box>
    </Paper>
  );
};

const Card = ({ title, subtitle, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
    <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    <Box mt={2}>{children}</Box>
  </Paper>
);

/** Business metrics for the selected date range (range is controlled from the dashboard header). */
const OperationsPulsePanel = ({ pulse }) => {
  const theme = useTheme();
  const metrics = pulse?.metrics || [];
  const dt = pulse?.dealsByType?.period || { otc: 0, otp: 0, foc: 0 };
  const dtTotal = (dt.otc || 0) + (dt.otp || 0) + (dt.foc || 0);
  const rp = pulse?.receivablesPayables || {};
  const net = (rp.receivables || 0) - (rp.payables || 0);
  const types = [
    { label: 'Offer to charge', short: 'OTC', value: dt.otc || 0, color: theme.palette.primary.main },
    { label: 'Offer to purchase', short: 'OTP', value: dt.otp || 0, color: theme.palette.warning.main },
    { label: 'Free of charge', short: 'FOC', value: dt.foc || 0, color: theme.palette.secondary.main },
  ];
  const aging = [
    { label: '0–30 days', key: '0-30', color: theme.palette.success.main },
    { label: '31–60', key: '31-60', color: theme.palette.success.main },
    { label: '61–90', key: '61-90', color: theme.palette.warning.main },
    { label: '90+', key: '90+', color: theme.palette.error.main },
  ];

  return (
    <Box mb={3.5}>
      <Typography variant="subtitle1" fontWeight={800} mb={1.5}>
        Performance <Typography component="span" variant="body2" color="text.secondary">· {pulse?.periodLabel || '—'}</Typography>
      </Typography>

      <Grid container spacing={2} mb={2}>
        {metrics.map((m) => (
          <Grid key={m.key} size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard metric={m} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card title="Deals by type" subtitle="Deals created in this period">
            <Stack direction="row" spacing={3} mb={2}>
              {types.map((t) => (
                <Box key={t.short}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: t.color }}>{t.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{t.label}</Typography>
                </Box>
              ))}
            </Stack>
            <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'action.hover' }}>
              {dtTotal > 0 && types.map((t) => <Box key={t.short} sx={{ width: `${(t.value / dtTotal) * 100}%`, bgcolor: t.color }} />)}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card title="Receivables & payables" subtitle="Outstanding balance right now">
            <Stack direction="row" spacing={1.5} mb={2}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>To receive</Typography>
                <Typography variant="h6" fontWeight={800}>{compactCurrency(rp.receivables)}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>To pay</Typography>
                <Typography variant="h6" fontWeight={800}>{compactCurrency(rp.payables)}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Net</Typography>
                <Typography variant="h6" fontWeight={800} color={net >= 0 ? 'success.main' : 'error.main'}>{compactCurrency(net)}</Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Receivables by age</Typography>
            <Stack direction="row" spacing={1} mt={0.75}>
              {aging.map((b) => (
                <Box key={b.key} sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: alpha(b.color, 0.08) }}>
                  <Typography variant="body2" fontWeight={800} sx={{ color: b.color }}>{compactCurrency(rp.receivablesAging?.[b.key] || 0)}</Typography>
                  <Typography variant="caption" color="text.secondary">{b.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperationsPulsePanel;
