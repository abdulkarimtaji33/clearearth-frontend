import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconTruckDelivery, IconFileCheck, IconFilter, IconSearch } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { getClientLabel, getSalesPerson } from '../grn/grnDisplayHelpers';

export const OUTBOUND_STATUS = {
  pending_outbound: { label: 'Pending Outbound', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
};
export const OUTBOUND_TYPE = { sale: 'Sale', disposed: 'Disposed', free_service: 'Free service' };

const OutboundList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [params] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(params.get('status') || '');
  const [type, setType] = useState(params.get('type') || '');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    setType(params.get('type') || '');
    setStatus(params.get('status') || '');
    setPage(0);
  }, [params]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getOutbounds({
        page: page + 1, pageSize: rowsPerPage, status: status || undefined, type: type || undefined,
        search: search || undefined, from: from || undefined, to: to || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status, type, search, from, to]);

  useEffect(() => { load(); }, [load]);

  const heads = ['Outbound #', 'GRN', 'Deal', 'Client / Lead', 'Sales person', 'Items', 'Type', 'Status', 'Delivery', 'Created', ''];
  const colSpan = heads.length;
  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(0); };

  return (
    <PageContainer title="Outbound" description="Outbound entries">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTruckDelivery size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Outbound</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} record{total !== 1 ? 's' : ''} · one entry is created automatically for every GRN. Open an entry to choose the type and issue the gatepass.
            </Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${total} total`} variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <TextField
              size="small" label="Search outbound / GRN / gatepass / vehicle" value={search} onChange={onFilter(setSearch)} sx={{ width: 300 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
            />
            <TextField
              select size="small" label="Status" value={status} onChange={onFilter(setStatus)} sx={{ width: 190 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconFilter size={16} /></InputAdornment> }}
            >
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="pending_outbound">Pending Outbound</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
            <TextField select size="small" label="Type" value={type} onChange={onFilter(setType)} sx={{ width: 170 }}>
              <MenuItem value="">All types</MenuItem>
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="disposed">Disposed</MenuItem>
              <MenuItem value="free_service">Free service</MenuItem>
            </TextField>
            <TextField size="small" type="date" label="Created from" value={from} onChange={onFilter(setFrom)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField size="small" type="date" label="Created to" value={to} onChange={onFilter(setTo)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          </Stack>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {heads.map((h) => (
                  <TableCell key={h || 'actions'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <IconFileCheck size={36} color={theme.palette.text.disabled} />
                    <Typography color="text.secondary" mt={1} fontWeight={600}>No outbound entries found</Typography>
                    <Typography variant="caption" color="text.disabled">Entries appear here as soon as a GRN is created. Try clearing the filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => {
                const deal = r.deal;
                const sales = getSalesPerson(deal);
                const st = OUTBOUND_STATUS[r.status] || { label: r.status, color: 'default' };
                const delivery = r.confirmed_delivery_date || r.requested_delivery_date;
                return (
                  <TableRow
                    key={r.id} hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.035) } }}
                    onClick={() => navigate(`/erp/outbound/view/${r.id}`)}
                  >
                    <TableCell>
                      <Chip size="small" label={r.outbound_number} sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link component="button" variant="body2" underline="hover" onClick={() => navigate(`/erp/grn/view/${r.grn_id}`)}>{r.grn?.grn_number || `#${r.grn_id}`}</Link>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {deal ? (
                        <Link component="button" variant="body2" fontWeight={700} underline="hover" onClick={() => navigate(`/erp/deals/view/${deal.id}`)} sx={{ textAlign: 'left' }}>
                          {deal.deal_number}
                          <Typography component="span" variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>{deal.title}</Typography>
                        </Link>
                      ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>{getClientLabel(deal)}</Typography></TableCell>
                    <TableCell>
                      {sales ? <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>{sales.name}</Typography> : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell><Chip size="small" label={r.items?.length || 0} variant="outlined" sx={{ fontWeight: 700, minWidth: 32 }} /></TableCell>
                    <TableCell>
                      {r.outbound_type ? <Chip size="small" label={OUTBOUND_TYPE[r.outbound_type]} variant="outlined" sx={{ fontWeight: 600 }} /> : <Typography variant="body2" color="text.disabled">Not set</Typography>}
                    </TableCell>
                    <TableCell><Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 700, borderRadius: 1.5 }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" noWrap>{delivery ? String(delivery).slice(0, 10) : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" noWrap>{r.created_at?.slice?.(0, 10) || '—'}</Typography></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/outbound/view/${r.id}`)}>Open</Link>
                    </TableCell>
                  </TableRow>
                );
              })}
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

export default OutboundList;
