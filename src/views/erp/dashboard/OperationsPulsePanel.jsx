import React from 'react';
import { Box, Typography, Stack, Paper, Grid, ButtonBase } from '@mui/material';
import Chart from 'react-apexcharts';
import {
  IconUsers, IconFileCheck, IconSend, IconCircleCheck,
  IconClipboardList, IconPackage, IconReceipt2,
  IconArrowUpRight, IconArrowDownRight, IconChevronRight,
} from '@tabler/icons-react';

// ── Palette (fixed — this panel is always dark, independent of the app theme) ──
const C = {
  bg: '#0B1420',
  card: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.07)',
  amber: '#E8A33D',
  teal: '#5FBFA5',
  coral: '#E57373',
  purple: '#9C8CF0',
  text: '#E7EDF3',
  textMuted: 'rgba(231,237,243,0.55)',
};

const METRIC_ICONS = {
  leadsCreated: IconUsers,
  dealsConverted: IconFileCheck,
  quotationsSent: IconSend,
  dealsWon: IconCircleCheck,
  workOrdersScheduled: IconClipboardList,
  workOrdersCompleted: IconPackage,
  invoicesGenerated: IconReceipt2,
};

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function fmtCompactCurrency(v) {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `AED ${(n / 1_000).toFixed(1)}K`;
  return `AED ${n.toLocaleString()}`;
}

function fmtMetricValue(metric) {
  if (!metric) return '—';
  if (metric.format === 'currency') return fmtCompactCurrency(metric.value);
  return Number(metric.value || 0).toLocaleString();
}

function fmtUpdatedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Tiny no-axes/no-tooltip ApexCharts area sparkline. */
const Sparkline = ({ points = [], color = C.amber, height = 36 }) => {
  const series = [{ name: 'v', data: points.map((p) => Number(p.value) || 0) }];
  const options = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { width: 1.5, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } },
    colors: [color],
    tooltip: { enabled: false },
  };
  if (!points.length) return <Box sx={{ height }} />;
  return <Chart options={options} series={series} type="area" height={height} />;
};

/** Multi-line sparkline for OTC / OTP / FOC weekly trend. */
const MultiSparkline = ({ trend = [], height = 60 }) => {
  const series = [
    { name: 'OTC', data: trend.map((p) => p.otc || 0) },
    { name: 'OTP', data: trend.map((p) => p.otp || 0) },
    { name: 'FOC', data: trend.map((p) => p.foc || 0) },
  ];
  const options = {
    chart: { type: 'line', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { width: 1.5, curve: 'smooth' },
    colors: [C.teal, C.amber, C.purple],
    tooltip: { enabled: false },
  };
  if (!trend.length) return <Box sx={{ height }} />;
  return <Chart options={options} series={series} type="line" height={height} />;
};

const SegmentedToggle = ({ value, onChange, disabled }) => (
  <Stack direction="row" spacing={0.75} sx={{ p: 0.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}` }}>
    {PERIODS.map((p) => {
      const active = p.key === value;
      return (
        <ButtonBase
          key={p.key}
          disabled={disabled}
          onClick={() => onChange && onChange(p.key)}
          sx={{
            px: 1.75, py: 0.6, borderRadius: 2, fontSize: '0.78rem', fontWeight: 700,
            color: active ? '#1A1206' : C.textMuted,
            bgcolor: active ? C.amber : 'transparent',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: active ? C.amber : 'rgba(255,255,255,0.06)' },
          }}
        >
          {p.label}
        </ButtonBase>
      );
    })}
  </Stack>
);

const NumberedStripItem = ({ index, label, value, isLast }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: '1 1 150px', minWidth: 130 }}>
    <Box>
      <Typography sx={{ color: C.amber, fontWeight: 800, fontSize: '0.72rem', fontFamily: 'monospace', mb: 0.5 }}>
        {String(index).padStart(2, '0')}
      </Typography>
      <Typography sx={{ color: C.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ color: C.text, fontWeight: 800, fontSize: '1.05rem', mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
    {!isLast && <IconChevronRight size={16} color="rgba(231,237,243,0.25)" style={{ flexShrink: 0 }} />}
  </Stack>
);

const MetricCard = ({ metric }) => {
  const Icon = METRIC_ICONS[metric.key] || IconFileCheck;
  const delta = Number(metric.deltaPct || 0);
  const up = delta >= 0;
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative', p: 2, borderRadius: 2.5, bgcolor: C.card,
        border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${C.amber}`,
        overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ color: C.textMuted, fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, pr: 1 }}>
          {metric.label}
        </Typography>
        <Icon size={16} color="rgba(231,237,243,0.35)" style={{ flexShrink: 0 }} />
      </Stack>
      <Typography sx={{ color: C.text, fontWeight: 800, fontSize: '1.55rem', mt: 0.75, lineHeight: 1.1 }}>
        {fmtMetricValue(metric)}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mt: 0.5, mb: 1 }}>
        {up ? <IconArrowUpRight size={13} color={C.teal} /> : <IconArrowDownRight size={13} color={C.coral} />}
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: up ? C.teal : C.coral }}>
          {Math.abs(delta).toFixed(1)}%
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: C.textMuted }}>vs last period</Typography>
      </Stack>
      <Box sx={{ mt: 'auto' }}>
        <Sparkline points={metric.trend} />
      </Box>
    </Paper>
  );
};

const OperationsPulsePanel = ({ pulse, period = 'week', onPeriodChange, loading }) => {
  const metrics = pulse?.metrics || [];
  const dealsByType = pulse?.dealsByType || { period: { otc: 0, otp: 0, foc: 0 }, trend: [] };
  const rp = pulse?.receivablesPayables || {};
  const dtPeriod = dealsByType.period || { otc: 0, otp: 0, foc: 0 };
  const dtTotal = (dtPeriod.otc || 0) + (dtPeriod.otp || 0) + (dtPeriod.foc || 0);

  return (
    <Box
      sx={{
        bgcolor: C.bg,
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        mb: 3.5,
        color: C.text,
      }}
    >
      {/* Section 1 — header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2.5}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff' }}>Operations Pulse</Typography>
          <Typography sx={{ color: C.textMuted, fontSize: '0.8rem', fontFamily: 'monospace', mt: 0.3 }}>
            {pulse?.periodLabel || '—'} · updated {fmtUpdatedAt(pulse?.updatedAt)}
          </Typography>
        </Box>
        <SegmentedToggle value={period} onChange={onPeriodChange} disabled={loading} />
      </Stack>

      {/* Section 2 — numbered strip */}
      {metrics.length > 0 && (
        <Paper elevation={0} sx={{ bgcolor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 2.5, p: 2, mb: 2.5 }}>
          <Stack direction="row" flexWrap="wrap" rowGap={2}>
            {metrics.map((m, i) => (
              <NumberedStripItem key={m.key} index={i + 1} label={m.label} value={fmtMetricValue(m)} isLast={i === metrics.length - 1} />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Section 3 — KPI cards */}
      {metrics.length > 0 && (
        <Grid container spacing={2} mb={2.5}>
          {metrics.map((m) => (
            <Grid key={m.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard metric={m} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Section 4 — two-column analytics */}
      <Grid container spacing={2}>
        {/* Deals conversion by type */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ bgcolor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 2.5, p: 2.25, height: '100%' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: C.text }}>Deals Conversion by Type</Typography>
            <Typography sx={{ color: C.textMuted, fontSize: '0.72rem', mt: 0.25, mb: 2 }}>
              OTC / OTP / FOC split · {pulse?.periodLabel || '—'}
            </Typography>

            <Stack direction="row" spacing={3} mb={2}>
              {[
                { label: 'OTC', value: dtPeriod.otc, color: C.teal },
                { label: 'OTP', value: dtPeriod.otp, color: C.amber },
                { label: 'FOC', value: dtPeriod.foc, color: C.purple },
              ].map((seg) => (
                <Box key={seg.label}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: seg.color }}>{seg.value || 0}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>{seg.label}</Typography>
                </Box>
              ))}
            </Stack>

            <Box sx={{ display: 'flex', width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }}>
              {dtTotal > 0 ? (
                <>
                  <Box sx={{ width: `${(dtPeriod.otc / dtTotal) * 100}%`, bgcolor: C.teal }} />
                  <Box sx={{ width: `${(dtPeriod.otp / dtTotal) * 100}%`, bgcolor: C.amber }} />
                  <Box sx={{ width: `${(dtPeriod.foc / dtTotal) * 100}%`, bgcolor: C.purple }} />
                </>
              ) : null}
            </Box>
            <Stack direction="row" spacing={2} mb={2}>
              {[['OTC', C.teal], ['OTP', C.amber], ['FOC', C.purple]].map(([label, color]) => (
                <Stack key={label} direction="row" alignItems="center" spacing={0.6}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
                  <Typography sx={{ fontSize: '0.68rem', color: C.textMuted }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>

            <Typography sx={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 600, mb: 0.5 }}>
              3-month trend by deal type (weekly)
            </Typography>
            <MultiSparkline trend={dealsByType.trend} />
          </Paper>
        </Grid>

        {/* Receivables & Payables */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ bgcolor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 2.5, p: 2.25, height: '100%' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: C.text }}>Receivables &amp; Payables</Typography>
            <Typography sx={{ color: C.textMuted, fontSize: '0.72rem', mt: 0.25, mb: 2 }}>
              Position as of {pulse?.periodLabel || '—'}
            </Typography>

            <Stack direction="row" spacing={1.5} mb={2}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${C.teal}` }}>
                <Typography sx={{ fontSize: '0.66rem', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Receivables</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: C.text, mt: 0.3 }}>{fmtCompactCurrency(rp.receivables)}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${C.coral}` }}>
                <Typography sx={{ fontSize: '0.66rem', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Payables</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: C.text, mt: 0.3 }}>{fmtCompactCurrency(rp.payables)}</Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 600, mb: 0.75 }}>Receivables aging</Typography>
            <Stack direction="row" spacing={1} mb={2}>
              {[
                { label: '0-30d', key: '0-30', color: C.teal },
                { label: '31-60d', key: '31-60', color: C.teal },
                { label: '61-90d', key: '61-90', color: C.amber },
                { label: '90d+', key: '90+', color: C.coral },
              ].map((b) => (
                <Box key={b.key} sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: `${b.color}22`, border: `1px solid ${b.color}55` }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: b.color }}>
                    {fmtCompactCurrency(rp.receivablesAging?.[b.key] || 0)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: C.textMuted, mt: 0.2 }}>{b.label}</Typography>
                </Box>
              ))}
            </Stack>

            <Typography sx={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 600, mb: 0.5 }}>Net position</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: (rp.receivables || 0) - (rp.payables || 0) >= 0 ? C.teal : C.coral }}>
              {fmtCompactCurrency((rp.receivables || 0) - (rp.payables || 0))}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperationsPulsePanel;
