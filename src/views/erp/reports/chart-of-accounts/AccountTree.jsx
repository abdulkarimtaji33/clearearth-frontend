import React, { useMemo } from 'react';
import {
  Box, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconChevronRight, IconChevronDown, IconPlus, IconEdit, IconPlayerPause, IconPlayerPlay, IconFolder, IconFileText,
} from '@tabler/icons-react';
import GlAmountLink from '../../../../components/erp/GlAmountLink';
import { TYPES, TYPE_META, visibleRows, matchesFilters, subTypeLabel, fmtMoney } from './coaUtils';

const Highlight = ({ text, q }) => {
  const s = String(text ?? '');
  const needle = (q || '').trim();
  if (!needle) return <>{s}</>;
  const i = s.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)}
      <mark style={{ background: '#ffe58f', padding: 0, borderRadius: 2 }}>{s.slice(i, i + needle.length)}</mark>
      {s.slice(i + needle.length)}
    </>
  );
};

const HEADERS = ['Code', 'Account', 'Kind', 'Sub-type', 'Balance (AED)', 'Status', ''];

const Row = ({ acc, q, expandedNow, onToggle, onOpen, onAddSub, onEdit, onToggleActive, theme, showType }) => {
  const meta = TYPE_META[acc.type];
  return (
    <TableRow
      hover
      onClick={() => onOpen(acc)}
      sx={{
        cursor: 'pointer',
        opacity: acc.__context ? 0.55 : acc.is_active ? 1 : 0.6,
        bgcolor: acc.is_group ? alpha(theme.palette.grey[500], 0.05) : 'inherit',
      }}
    >
      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
        <Highlight text={acc.code} q={q} />
      </TableCell>
      <TableCell sx={{ pl: 1 + (acc.__depth || 0) * 3 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {acc.__hasKids ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle(acc.id); }} sx={{ p: 0.25 }}>
              {expandedNow ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24 }} />
          )}
          {acc.is_group ? <IconFolder size={16} color={theme.palette.warning.main} /> : <IconFileText size={16} color={theme.palette.text.disabled} />}
          <Box>
            <Typography variant="body2" fontWeight={acc.is_group ? 800 : 500} sx={{ lineHeight: 1.25 }}>
              <Highlight text={acc.name} q={q} />
            </Typography>
            {acc.is_group && acc.child_count > 0 && (
              <Typography variant="caption" color="text.secondary">
                {acc.child_count} sub-account{acc.child_count === 1 ? '' : 's'}
              </Typography>
            )}
          </Box>
          {showType && <Chip size="small" label={meta?.one || acc.type} color={meta?.color || 'default'} variant="outlined" sx={{ ml: 1 }} />}
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          label={acc.is_group ? 'Group' : 'Posting'}
          color={acc.is_group ? 'warning' : 'default'}
          variant={acc.is_group ? 'filled' : 'outlined'}
          sx={{ fontWeight: 700 }}
        />
      </TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{subTypeLabel(acc.sub_type)}</Typography></TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        {acc.is_group ? (
          acc.rollup_balance != null ? <strong style={{ fontFamily: 'monospace' }}>{fmtMoney(acc.rollup_balance)}</strong> : '—'
        ) : acc.balance != null ? (
          <GlAmountLink accountId={acc.id} title="View postings that make up this balance">{fmtMoney(acc.balance)}</GlAmountLink>
        ) : '—'}
      </TableCell>
      <TableCell>
        <Chip size="small" label={acc.is_active ? 'Active' : 'Inactive'} color={acc.is_active ? 'success' : 'default'} />
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Add a sub-account under this account">
          <span>
            <IconButton size="small" onClick={() => onAddSub(acc)} disabled={!acc.is_active}><IconPlus size={16} /></IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(acc)}><IconEdit size={16} /></IconButton>
        </Tooltip>
        <Tooltip title={acc.is_system ? 'System accounts cannot be disabled' : acc.is_active ? 'Disable' : 'Re-activate'}>
          <span>
            <IconButton size="small" color={acc.is_active ? 'error' : 'success'} onClick={() => onToggleActive(acc)} disabled={!!acc.is_system && acc.is_active}>
              {acc.is_active ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

const Head = () => (
  <TableHead>
    <TableRow>
      {HEADERS.map((h) => (
        <TableCell key={h} align={h === 'Balance (AED)' ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
      ))}
    </TableRow>
  </TableHead>
);

const AccountTree = ({ accounts, byId, filters, view, expanded, setExpanded, forceExpand, onOpen, onAddSub, onEdit, onToggleActive }) => {
  const theme = useTheme();
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const sections = useMemo(
    () => TYPES.filter((t) => filters.type === 'all' || filters.type === t).map((t) => ({
      type: t,
      ...visibleRows({ accounts, byId, filters, expanded, type: t, forceExpand }),
    })),
    [accounts, byId, filters, expanded, forceExpand]
  );

  if (view === 'flat') {
    const rows = accounts
      .filter((a) => matchesFilters(a, filters, byId))
      .sort((x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true }));
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <Head />
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No accounts match these filters</Typography></TableCell></TableRow>
              ) : rows.map((a) => (
                <Row key={a.id} acc={{ ...a, __depth: 0, __hasKids: false }} q={filters.q} theme={theme} showType
                  onOpen={onOpen} onAddSub={onAddSub} onEdit={onEdit} onToggleActive={onToggleActive} onToggle={() => {}} expandedNow={false} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  const nonEmpty = sections.filter((s) => s.rows.length > 0);
  if (nonEmpty.length === 0) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3, py: 6, textAlign: 'center' }}>
        <Typography fontWeight={700}>No accounts match these filters</Typography>
        <Typography variant="body2" color="text.secondary">Try clearing a filter or searching a different word.</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {nonEmpty.map((sec) => {
        const meta = TYPE_META[sec.type];
        return (
          <Paper key={sec.type} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.25, bgcolor: alpha(theme.palette[meta.color].main, 0.08), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip label={meta.one.toUpperCase()} size="small" color={meta.color} />
                <Typography variant="subtitle2" fontWeight={800}>{meta.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {sec.matchedCount === sec.totalOfType ? `${sec.totalOfType} accounts` : `${sec.matchedCount} of ${sec.totalOfType} accounts`}
                </Typography>
              </Stack>
            </Box>
            <TableContainer>
              <Table size="small">
                <Head />
                <TableBody>
                  {sec.rows.map((acc) => (
                    <Row key={acc.id} acc={acc} q={filters.q} theme={theme}
                      expandedNow={forceExpand || expanded.has(acc.id)}
                      onToggle={toggle} onOpen={onOpen} onAddSub={onAddSub} onEdit={onEdit} onToggleActive={onToggleActive} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default AccountTree;
