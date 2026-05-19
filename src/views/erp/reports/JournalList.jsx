import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip,
  TextField, MenuItem, TablePagination,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBook, IconPlus, IconEye } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { normalizeJournalListResponse } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOURCE_LABELS = {
  tax_invoice: 'Tax Invoice',
  payment_received: 'Payment Received',
  expense: 'Expense',
  expense_payment: 'Expense Payment',
  purchase_order_approved: 'PO Approved',
  po_payment: 'PO Payment',
  opening_balance: 'Opening Balance',
  adjustment: 'Adjustment',
  manual: 'Manual',
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

  return (
    <PageContainer title="Journal" description="All double-entry journal entries">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBook size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Journal</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/erp/journal/opening-balances')} sx={{ borderRadius: 2 }}>
            Opening Balances
          </Button>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/journal/create')} sx={{ borderRadius: 2 }}>
            Manual Entry
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
          <TextField size="small" label="From" type="date" value={filters.dateFrom} onChange={updateFilter('dateFrom')} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField size="small" label="To" type="date" value={filters.dateTo} onChange={updateFilter('dateTo')} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField select size="small" label="Source Type" value={filters.sourceType} onChange={updateFilter('sourceType')} sx={{ width: 200 }}>
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Search description…" value={filters.search} onChange={updateFilter('search')} sx={{ flex: 1, minWidth: 200 }} />
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Entry #', 'Date', 'Description', 'Source', 'Total Debit', 'Total Credit', 'Status', ''].map((h) => (
                  <TableCell key={h} align={h.includes('Debit') || h.includes('Credit') ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No journal entries found</Typography></TableCell></TableRow>
              ) : entries.map((e) => {
                const totalDebit = (e.lines || []).reduce((s, l) => s + parseFloat(l.debit || 0), 0);
                const totalCredit = (e.lines || []).reduce((s, l) => s + parseFloat(l.credit || 0), 0);
                return (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.entry_number}</TableCell>
                    <TableCell>{e.entry_date}</TableCell>
                    <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</TableCell>
                    <TableCell><Chip label={SOURCE_LABELS[e.source_type] || e.source_type} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(totalDebit)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmt(totalCredit)}</TableCell>
                    <TableCell>
                      <Chip label={e.status} size="small" color={e.status === 'posted' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<IconEye size={14} />} onClick={() => navigate(`/erp/journal/view/${e.id}`)} sx={{ borderRadius: 2 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </PageContainer>
  );
};

export default JournalList;
