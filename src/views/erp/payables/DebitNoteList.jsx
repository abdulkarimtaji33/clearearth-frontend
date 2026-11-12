import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CircularProgress, InputAdornment, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconReceiptRefund, IconSearch } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DebitNoteList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const h = setTimeout(() => { setDebounced(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(h);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSupplierDebitNotes({ page: page + 1, pageSize, search: debounced || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.totalItems ?? (res.data || []).length);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debounced]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="Supplier debit notes">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReceiptRefund size={24} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>Supplier debit notes</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} debit note{total === 1 ? '' : 's'} · to record one, open Vendor Bills and choose “Debit note” on the bill
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, p: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Search by debit note number, supplier or reason…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography fontWeight={700}>No debit notes yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              When goods go back to a supplier or a bill was too high, record a debit note against the bill.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/erp/vendor-bills')} sx={{ borderRadius: 2 }}>Go to vendor bills</Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Debit note', 'Date', 'Supplier', 'Bill', 'Reason', 'Ex VAT', 'VAT', 'Total'].map((h, i) => (
                    <TableCell key={h} align={i >= 5 ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/debit-notes/${n.id}`)}>
                    <TableCell sx={{ fontWeight: 700 }}>{n.debit_note_number}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(n.note_date).slice(0, 10)}</TableCell>
                    <TableCell>{n.party_name}</TableCell>
                    <TableCell>{n.vendorBill?.bill_number || '—'}</TableCell>
                    <TableCell>{n.reason}</TableCell>
                    <TableCell align="right">{fmt(n.subtotal)}</TableCell>
                    <TableCell align="right">{fmt(n.vat_amount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(n.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default DebitNoteList;
