import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip,
  TextField, MenuItem, TablePagination, InputAdornment, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconBook, IconPlus, IconEye, IconSearch, IconScale,
  IconFileInvoice, IconCashBanknote, IconReceipt, IconTruckDelivery,
  IconAdjustments,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeJournalListResponse } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOURCE_META = {
  tax_invoice:            { label: 'Tax Invoice',      color: 'primary' },
  payment_received:       { label: 'Receipt',           color: 'success' },
  expense:                { label: 'Expense',           color: 'warning' },
  expense_payment:        { label: 'Expense Payment',   color: 'warning' },
  purchase_order_approved:{ label: 'PO Approved',       color: 'secondary' },
  po_payment:             { label: 'PO Payment',        color: 'secondary' },
  opening_balance:        { label: 'Opening Balance',   color: 'default' },
  adjustment:             { label: 'Adjustment',        color: 'default' },
  manual:                 { label: 'Manual',            color: 'info' },
};

const BalanceBadge = ({ debit, credit }) => {
  const balanced = Math.abs(debit - credit) < 0.01;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: balanced ? alpha('#22c55e', 0.1) : alpha('#ef4444', 0.1),
        color: balanced ? 'success.dark' : 'error.dark',
        fontSize: '0.7rem',
        fontWeight: 700,
      }}
    >
      <IconScale size={11} />
      {balanced ? 'Balanced' : 'Unbalanced'}
    </Box>
  );
};

const JournalList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', sourceType: '', search: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page: page + 1, pageSize: rowsPerPage, ...(filters || {}) };
      const res = await apiService.getJournalEntries(params);
      if (res.success) {
        const { entries: list, total: count } = normalizeJournalListResponse(res);
        setEntries(list);
        setTotal(count);
      } else {
        setError(res.message || 'Failed to load');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (k) => (e) => {
    setFilters((p) => ({ ...(p || {}), [k]: e.target.value }));
    setPage(0);
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <PageContainer title="Journal" description="All double-entry journal entries">

      {/* ── Header ── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <IconBook size={24} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} lineHeight={1.2}>Journal</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {total > 0 ? `${total.toLocaleString()} entr${total !== 1 ? 'ies' : 'y'}` : 'Double-entry ledger'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<IconAdjustments size={16} />}
            onClick={() => navigate('/erp/journal/opening-balances')}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            Opening Balances
          </Button>
          <Button
            variant="contained"
            startIcon={<IconPlus size={16} />}
            onClick={() => navigate('/erp/journal/create')}
            sx={{
              borderRadius: 2.5, fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            Manual Entry
          </Button>
        </Stack>
      </Stack>

      {/* ── Filter bar ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3, mb: 2.5,
          border: '1px solid', borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[50], 0.8),
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.8} sx={{ textTransform: 'uppercase' }}>
            Filters
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              label="Search"
              placeholder="Description, entry #…"
              value={filters.search}
              onChange={updateFilter('search')}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={15} style={{ opacity: 0.5 }} /></InputAdornment>,
                sx: { borderRadius: 2 },
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              select size="small" label="Type" value={filters.sourceType}
              onChange={updateFilter('sourceType')}
              sx={{ width: 185, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">All types</MenuItem>
              {Object.entries(SOURCE_META).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </TextField>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <TextField
              size="small" label="From" type="date"
              value={filters.dateFrom} onChange={updateFilter('dateFrom')}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small" label="To" type="date"
              value={filters.dateTo} onChange={updateFilter('dateTo')}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {(filters.search || filters.sourceType || filters.dateFrom || filters.dateTo) && (
              <Button
                size="small" color="inherit"
                onClick={() => { setFilters({ dateFrom: '', dateTo: '', sourceType: '', search: '' }); setPage(0); }}
                sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 600 }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Table ── */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.04) }}>
                {['Entry #', 'Date', 'Description', 'Type', 'Debit (AED)', 'Credit (AED)', 'Status', ''].map((h) => (
                  <TableCell
                    key={h || 'actions'}
                    align={['Debit (AED)', 'Credit (AED)', ''].includes(h) ? 'right' : 'left'}
                    sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.secondary', whiteSpace: 'nowrap', py: 1.5 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10, border: 0 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary" mt={1.5}>Loading entries…</Typography>
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10, border: 0 }}>
                    <IconBook size={40} style={{ opacity: 0.12, marginBottom: 10 }} />
                    <Typography variant="body2" color="text.secondary">No journal entries found</Typography>
                    <Typography variant="caption" color="text.disabled">Try adjusting your filters</Typography>
                  </TableCell>
                </TableRow>
              ) : entries.map((e, idx) => {
                const totalDebit  = (e.lines || []).reduce((s, l) => s + parseFloat(l.debit  || 0), 0);
                const totalCredit = (e.lines || []).reduce((s, l) => s + parseFloat(l.credit || 0), 0);
                const meta = SOURCE_META[e.source_type] || { label: e.source_type, color: 'default' };
                const isVoided = e.status === 'voided';

                return (
                  <TableRow
                    key={e.id}
                    hover
                    onClick={() => navigate(`/erp/journal/view/${e.id}`)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isVoided ? alpha(theme.palette.error.main, 0.03) : 'transparent',
                      opacity: isVoided ? 0.65 : 1,
                      borderBottom: idx === entries.length - 1 ? 'none' : undefined,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                      '&:hover .action-btn': { opacity: 1 },
                      '& .action-btn': { opacity: 0, transition: 'opacity 0.15s' },
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main', whiteSpace: 'nowrap' }}>
                      {e.entry_number}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.82rem' }}>
                      {e.entry_date}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={e.description} fontWeight={500}>
                        {e.description}
                      </Typography>
                      {e.paid_to && (
                        <Typography variant="caption" color="text.disabled" noWrap>
                          → {e.paid_to}
                        </Typography>
                      )}
                      {e.received_from && (
                        <Typography variant="caption" color="success.main" noWrap>
                          ← {e.received_from}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meta.label}
                        size="small"
                        color={meta.color}
                        variant="soft"
                        sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: 'text.primary' }}>
                      {fmt(totalDebit)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: 'text.primary' }}>
                      {fmt(totalCredit)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Chip
                          label={e.status}
                          size="small"
                          color={e.status === 'posted' ? 'success' : 'error'}
                          variant="soft"
                          sx={{ fontWeight: 700, fontSize: '0.67rem', height: 20, borderRadius: 1 }}
                        />
                        <BalanceBadge debit={totalDebit} credit={totalCredit} />
                      </Stack>
                    </TableCell>
                    <TableCell align="right" onClick={(ev) => { ev.stopPropagation(); navigate(`/erp/journal/view/${e.id}`); }}>
                      <Button
                        className="action-btn"
                        size="small"
                        variant="outlined"
                        startIcon={<IconEye size={13} />}
                        sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 600, py: 0.5, px: 1.5, whiteSpace: 'nowrap' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5 }}>
          <Typography variant="caption" color="text.disabled">
            {total > 0 ? `${total.toLocaleString()} total entries` : ''}
          </Typography>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ border: 0 }}
          />
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default JournalList;
