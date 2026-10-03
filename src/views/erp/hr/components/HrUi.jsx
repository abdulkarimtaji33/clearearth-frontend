import React from 'react';
import {
  Box, Card, Typography, Stack, Chip, Avatar, Button, Skeleton, CircularProgress,
} from '@mui/material';
import { alpha, darken, lighten, ThemeProvider } from '@mui/material/styles';
import { IconArrowLeft } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';

/**
 * Shared HR module UI kit. Every HR page builds on these primitives so the module has
 * one visual language. Layout uses CSS grid / flex (not MUI <Grid item xs>, whose legacy
 * props are ignored by MUI v7 and collapse layouts).
 */

// ---------------------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------------------

export const humanize = (s) => (s ? String(s).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');

export const fmtDate = (d, format = 'DD MMM YYYY') => {
  if (!d) return '';
  const p = dayjs(d);
  return p.isValid() ? p.format(format) : '';
};

export const fmtDateTime = (d) => fmtDate(d, 'DD MMM YYYY, HH:mm');

export const fmtMoney = (n, currency = 'AED') => {
  if (n === null || n === undefined || n === '') return '';
  const v = Number(n);
  if (Number.isNaN(v)) return '';
  return `${currency} ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fullName = (p) => (p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '');

export const initialsOf = (p) => (
  `${(p?.first_name || '').charAt(0)}${(p?.last_name || '').charAt(0)}`.toUpperCase() || '?'
);

export const daysUntil = (d) => {
  if (!d) return null;
  const p = dayjs(d);
  return p.isValid() ? p.startOf('day').diff(dayjs().startOf('day'), 'day') : null;
};

/** "2y 3m", "5m", "12d" — tenure since a joining date; '' if missing or in the future. */
export const tenureOf = (joined) => {
  if (!joined) return '';
  const start = dayjs(joined);
  if (!start.isValid()) return '';
  const now = dayjs();
  if (start.isAfter(now)) return `Joins in ${start.diff(now.startOf('day'), 'day') + 1}d`;
  const years = now.diff(start, 'year');
  const months = now.diff(start.add(years, 'year'), 'month');
  if (years > 0) return `${years}y${months ? ` ${months}m` : ''}`;
  if (months > 0) return `${months}m`;
  return `${now.diff(start, 'day')}d`;
};

// ---------------------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------------------

export const EMPLOYMENT_STATUSES = ['onboarding', 'active', 'on_leave', 'suspended', 'exited'];

const STATUS_TONE = {
  active: 'success',
  approved: 'success',
  paid: 'success',
  present: 'success',
  assigned: 'primary',
  processed: 'info',
  onboarding: 'info',
  draft: 'default',
  on_leave: 'warning',
  pending: 'warning',
  late: 'warning',
  half_day: 'warning',
  suspended: 'error',
  rejected: 'error',
  absent: 'error',
  cancelled: 'default',
  exited: 'default',
  returned: 'default',
};

export const statusTone = (s) => STATUS_TONE[s] || 'default';

/** Readable foreground for a palette tone on its own 12% tint, in light and dark mode. */
export const toneText = (theme, tone) => (theme.palette.mode === 'dark'
  ? lighten(theme.palette[tone].main, 0.25)
  : darken(theme.palette[tone].main, 0.35));

/**
 * The app theme sets text.secondary to the same value as text.primary, which flattens
 * all hierarchy. Inside HR pages we derive a real muted tone from text.primary.
 */
const withHrText = (outer) => {
  const { primary, secondary } = outer.palette.text;
  if (secondary && primary && secondary !== primary) return outer;
  return {
    ...outer,
    palette: {
      ...outer.palette,
      text: { ...outer.palette.text, secondary: alpha(primary, 0.64), disabled: alpha(primary, 0.4) },
    },
  };
};

export const HrThemeScope = ({ children }) => <ThemeProvider theme={withHrText}>{children}</ThemeProvider>;

/** Soft, dot-led status pill. */
export const StatusChip = ({ status, label, tone, size = 'small', sx }) => {
  const t = tone || statusTone(status);
  return (
    <Chip
      size={size}
      label={label || humanize(status) || 'Unknown'}
      sx={{
        fontWeight: 600,
        borderRadius: 1.5,
        height: size === 'small' ? 24 : 28,
        bgcolor: (th) => (t === 'default' ? alpha(th.palette.text.primary, 0.06) : alpha(th.palette[t].main, 0.12)),
        color: (th) => (t === 'default' ? th.palette.text.secondary : toneText(th, t)),
        '.MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.75, px: 1.1 },
        '.MuiChip-label::before': {
          content: '""', width: 6, height: 6, borderRadius: '50%',
          bgcolor: (th) => (t === 'default' ? th.palette.text.disabled : th.palette[t].main),
        },
        ...sx,
      }}
    />
  );
};

/** Expiry status for dated documents: expired / due within `warnDays` / valid / none. */
export const expiryInfo = (expiry, warnDays = 60) => {
  const days = daysUntil(expiry);
  if (days === null) return { tone: 'default', label: 'Not recorded', state: 'missing' };
  if (days < 0) return { tone: 'error', label: `Expired ${Math.abs(days)}d ago`, state: 'expired' };
  if (days <= warnDays) return { tone: 'warning', label: `Expires in ${days}d`, state: 'expiring' };
  return { tone: 'success', label: 'Valid', state: 'valid' };
};

export const ExpiryChip = ({ expiry, warnDays }) => {
  const info = expiryInfo(expiry, warnDays);
  return <StatusChip tone={info.tone} label={info.label} />;
};

// ---------------------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------------------

const AVATAR_TONES = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];

const toneForSeed = (seed) => {
  let hash = 0;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

export const PersonAvatar = ({ person, src, size = 40, sx, children }) => {
  const tone = toneForSeed(fullName(person) || person?.employee_code || person?.id);
  return (
    <Avatar
      src={src || undefined}
      sx={{
        width: size, height: size, fontSize: Math.round(size * 0.38), fontWeight: 700,
        bgcolor: (t) => alpha(t.palette[tone].main, 0.16),
        color: (t) => t.palette[tone].dark,
        ...sx,
      }}
    >
      {children || initialsOf(person)}
    </Avatar>
  );
};

/** Avatar + name + secondary line, used in tables and lists. */
export const PersonCell = ({ person, src, secondary, size = 36 }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
    <PersonAvatar person={person} src={src} size={size} />
    <Box minWidth={0}>
      <Typography variant="body2" fontWeight={600} noWrap>{fullName(person) || 'Unnamed'}</Typography>
      {secondary && <Typography variant="caption" color="text.secondary" noWrap component="div">{secondary}</Typography>}
    </Box>
  </Stack>
);

// ---------------------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------------------

export const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'background.paper',
  boxShadow: 'none',
};

/** HR page shell: centered max-width column + header with title, subtitle, back link and actions.
 * `header` replaces the default header; `bare` renders no header at all. */
export const HrPage = ({ title, description, subtitle, back, backLabel = 'Back', actions, children, maxWidth = 1400, header, bare }) => {
  const navigate = useNavigate();
  return (
    <PageContainer title={title} description={description || title}>
      <HrThemeScope>
        <Box sx={{ maxWidth: `min(${maxWidth}px, 100%)`, width: '100%', mx: 'auto', px: { xs: 0, sm: 1 }, pb: 4 }}>
          {back && (
            <Button
              size="small"
              color="inherit"
              startIcon={<IconArrowLeft size={16} />}
              onClick={() => navigate(back)}
              sx={{ mb: 1.5, ml: -1, color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'text.primary' } }}
            >
              {backLabel}
            </Button>
          )}
          {!bare && (header || (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-end' }}
              spacing={2}
              mb={3}
            >
              <Box minWidth={0}>
                <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>{title}</Typography>
                {subtitle && (
                  <Typography variant="body1" color="text.secondary" mt={0.5} component="div">{subtitle}</Typography>
                )}
              </Box>
              {actions && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                  {actions}
                </Stack>
              )}
            </Stack>
          ))}
          {children}
        </Box>
      </HrThemeScope>
    </PageContainer>
  );
};

/** Card with an optional icon/title/subtitle header and an action slot. */
export const SectionCard = ({ icon: Icon, title, subtitle, action, children, noPadding, sx, contentSx, id }) => (
  <Card id={id} elevation={0} sx={{ ...cardSx, overflow: 'hidden', ...sx }}>
    {(title || action) && (
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: noPadding ? 2 : 0, ...(noPadding && { borderBottom: '1px solid', borderColor: 'divider' }) }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
          {Icon && (
            <Box sx={{
              width: 32, height: 32, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main',
            }}
            >
              <Icon size={17} />
            </Box>
          )}
          <Box minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3} noWrap>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary" component="div">{subtitle}</Typography>}
          </Box>
        </Stack>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
    )}
    <Box sx={{ ...(noPadding ? {} : { px: { xs: 2, sm: 2.5 }, pt: title ? 2 : 2.5, pb: 2.5 }), ...contentSx }}>
      {children}
    </Box>
  </Card>
);

/** Responsive label/value grid. `min` is the minimum column width before wrapping. */
export const DetailGrid = ({ children, min = 200, gap = 2.5, sx }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, columnGap: 3, rowGap: gap, ...sx }}>
    {children}
  </Box>
);

export const DetailItem = ({ label, value, children, hint, span }) => {
  const empty = !children && (value === null || value === undefined || value === '');
  return (
    <Box minWidth={0} sx={span ? { gridColumn: '1 / -1' } : undefined}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
        {label}
      </Typography>
      {children || (
        <Typography
          variant="body2"
          fontWeight={empty ? 400 : 500}
          color={empty ? 'text.disabled' : 'text.primary'}
          sx={{ mt: 0.25, wordBreak: 'break-word' }}
        >
          {empty ? '—' : value}
        </Typography>
      )}
      {hint && <Typography variant="caption" color="text.secondary" component="div">{hint}</Typography>}
    </Box>
  );
};

/** Compact label/value row list (label left, value right). */
export const KeyValueList = ({ items }) => (
  <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
    {items.map(({ label, value, node }) => {
      const empty = !node && (value === null || value === undefined || value === '');
      return (
        <Stack key={label} direction="row" justifyContent="space-between" alignItems="center" spacing={2} py={1.1}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
          {node || (
            <Typography variant="body2" fontWeight={600} color={empty ? 'text.disabled' : 'text.primary'} textAlign="right" sx={{ wordBreak: 'break-word', minWidth: 0 }}>
              {empty ? '—' : value}
            </Typography>
          )}
        </Stack>
      );
    })}
  </Stack>
);

/** KPI tile. tone: primary | success | warning | error | info | secondary. */
export const StatTile = ({ icon: Icon, label, value, hint, tone = 'primary', loading, onClick, active }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      ...cardSx,
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.75,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .15s, box-shadow .15s',
      ...(active && { borderColor: (t) => t.palette[tone].main, boxShadow: (t) => `0 0 0 1px ${t.palette[tone].main}` }),
      ...(onClick && { '&:hover': { borderColor: (t) => alpha(t.palette[tone].main, 0.6) } }),
    }}
  >
    {Icon && (
      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, flexShrink: 0, display: 'grid', placeItems: 'center',
        bgcolor: (t) => alpha(t.palette[tone].main, 0.12), color: (t) => t.palette[tone].main,
      }}
      >
        <Icon size={22} />
      </Box>
    )}
    <Box minWidth={0}>
      <Typography variant="h4" fontWeight={700} lineHeight={1.15} noWrap>
        {loading ? <Skeleton width={48} /> : (value ?? '—')}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      {hint && <Typography variant="caption" color="text.disabled" noWrap component="div">{hint}</Typography>}
    </Box>
  </Card>
);

export const StatGrid = ({ children, min = 200, sx }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 2, ...sx }}>
    {children}
  </Box>
);

export const EmptyState = ({ icon: Icon, title, message, action, compact }) => (
  <Stack alignItems="center" textAlign="center" spacing={1} sx={{ py: compact ? 3 : 6, px: 2 }}>
    {Icon && (
      <Box sx={{
        width: compact ? 44 : 56, height: compact ? 44 : 56, borderRadius: '50%', display: 'grid', placeItems: 'center', mb: 0.5,
        bgcolor: (t) => alpha(t.palette.text.primary, 0.05), color: 'text.disabled',
      }}
      >
        <Icon size={compact ? 22 : 28} />
      </Box>
    )}
    {title && <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>}
    {message && <Typography variant="body2" color="text.secondary" maxWidth={420}>{message}</Typography>}
    {action && <Box pt={1}>{action}</Box>}
  </Stack>
);

export const LoadingBlock = ({ py = 6 }) => (
  <Box display="flex" justifyContent="center" py={py}><CircularProgress size={28} /></Box>
);

/** Shared table styling — uppercase muted header, roomy rows, subtle hover. */
export const tableSx = {
  '& thead th': {
    color: 'text.secondary', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em',
    whiteSpace: 'nowrap', bgcolor: (t) => alpha(t.palette.text.primary, 0.025), borderColor: 'divider', py: 1.25,
  },
  '& tbody td': { borderColor: 'divider', py: 1.5 },
  '& tbody tr:last-of-type td': { borderBottom: 0 },
  '& tbody tr.MuiTableRow-hover:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.035) },
};

/** Toolbar row above a table (search + filters + actions). */
export const FilterBar = ({ children, sx }) => (
  <Box sx={{
    p: { xs: 1.5, sm: 2 }, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
    borderBottom: '1px solid', borderColor: 'divider', ...sx,
  }}
  >
    {children}
  </Box>
);

export const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export const dialogPaperProps = { sx: { borderRadius: 3 } };
