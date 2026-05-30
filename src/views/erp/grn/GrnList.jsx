import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPackage, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { draft: 'default', submitted: 'info', approved: 'success' };

const GrnList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getGrns({ page: page + 1, pageSize: rowsPerPage, status: status || undefined });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="GRN" description="Goods received notes">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPackage size={22} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Goods Received (GRN)</Typography>
            <Typography variant="body2" color="text.secondary">{total} record{total !== 1 ? 's' : ''}</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/grn/create')} sx={{ borderRadius: 2.5 }}>
          New GRN
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ width: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
          </TextField>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['GRN #', 'Work Order', 'Deal', 'Items', 'Status', 'Created', ''].map((h) => (
                  <TableCell key={h || 'a'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No GRNs found</Typography></TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/grn/view/${r.id}`)}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.grn_number}</TableCell>
                  <TableCell>{r.workOrder?.title || r.work_order_id || '—'}</TableCell>
                  <TableCell>{r.deal ? `${r.deal.deal_number} ${r.deal.title}` : '—'}</TableCell>
                  <TableCell>{r.items?.length || 0}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 700 }} /></TableCell>
                  <TableCell>{r.created_at?.slice?.(0, 10) || '—'}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/erp/grn/view/${r.id}`); }}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>
    </PageContainer>
  );
};

export default GrnList;
