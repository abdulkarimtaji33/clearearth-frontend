import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBook, IconSearch, IconFileCheck } from '@tabler/icons-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const KINDS = {
  purchase: {
    title: 'Purchase Register', sub: 'Offer to Purchase: purchase orders and purchase invoices (Accounts Payable)',
    party: 'Vendor', types: ['Purchase Order', 'Purchase Invoice'],
  },
  service: {
    title: 'Service Register', sub: 'Offer to Service: service orders and service invoices (Accounts Receivable)',
    party: 'Customer', types: ['Service Order', 'Service Invoice'],
  },
  sales: {
    title: 'Sales Register', sub: 'Sales orders (outbound sales) and sales invoices (Accounts Receivable)',
    party: 'Customer', types: ['Sales Order', 'Sales Invoice'],
  },
};
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLOR = { paid: 'success', open: 'warning', partial: 'info', void: 'default', unpaid: 'warning', approved: 'success', completed: 'success', dispatched: 'success', pending_outbound: 'warning' };

const RegisterList = () => {
  const { kind } = useParams();
  const meta = KINDS[kind] || KINDS.purchase;
  const navigate = useNavigate();
  const theme = useTheme();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getRegister(kind, { page: page + 1, pageSize: rowsPerPage, search: search || undefined, type: type || undefined });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
      setError('');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [kind, page, rowsPerPage, search, type]);

  useEffect(() => { setPage(0); }, [kind, type]);
  useEffect(() => { load(); }, [load]);

  const head = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', whiteSpace: 'nowrap' };

  return (
    <PageContainer title={meta.title} description={meta.sub}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBook size={24} color={theme.palette.primary.main} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>{meta.title}</Typography>
          <Typography variant="body2" color="text.secondary">{meta.sub}</Typography>
        </Box>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <TextField
              size="small" label={`Search reference or ${meta.party.toLowerCase()}`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
            />
            <TextField
              select size="small" label="Document type" value={type} sx={{ width: 220 }}
              onChange={(e) => { const next = new URLSearchParams(params); if (e.target.value) next.set('type', e.target.value); else next.delete('type'); setParams(next); }}
            >
              <MenuItem value="">All documents</MenuItem>
              {meta.types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Stack>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={head}>Type</TableCell><TableCell sx={head}>Reference</TableCell><TableCell sx={head}>{meta.party}</TableCell>
                <TableCell sx={head}>Date</TableCell><TableCell sx={head} align="right">Amount</TableCell><TableCell sx={head} align="right">Balance due</TableCell>
                <TableCell sx={head}>Status</TableCell><TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <IconFileCheck size={36} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" mt={1} fontWeight={600}>No records found</Typography>
                </TableCell></TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={`${r.type}-${r.reference}-${i}`} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(r.link)}>
                  <TableCell><Chip size="small" variant="outlined" label={r.type} sx={{ fontWeight: 600 }} /></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{r.reference}</Typography></TableCell>
                  <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>{r.party || '—'}</Typography></TableCell>
                  <TableCell>{r.date ? String(r.date).slice(0, 10) : '—'}</TableCell>
                  <TableCell align="right">{fmt(r.amount)}</TableCell>
                  <TableCell align="right">{r.balance != null ? fmt(r.balance) : '—'}</TableCell>
                  <TableCell><Chip size="small" label={String(r.status || '').replace(/_/g, ' ')} color={COLOR[r.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 700 }} /></TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}><Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(r.link)}>Open</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </PageContainer>
  );
};

export default RegisterList;
