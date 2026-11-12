import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconReceiptRefund, IconSearch } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CreditNoteList = () => {
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
      const res = await apiService.getCreditNotes({ page: page + 1, pageSize, search: debounced || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.totalItems ?? (res.data || []).length);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debounced]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="Credit notes">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.12), color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconReceiptRefund size={24} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>Credit notes</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} credit note{total === 1 ? '' : 's'} · to issue one, open a tax invoice and choose “Issue credit note”
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by credit note number or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography fontWeight={700}>No credit notes yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              When an invoice needs correcting or cancelling, issue a credit note from the invoice itself.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/erp/tax-invoices')} sx={{ borderRadius: 2 }}>Go to tax invoices</Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Credit note', 'Date', 'Invoice', 'Reason', 'Ex VAT', 'VAT', 'Total', 'Refunded', 'Issued by', ''].map((h, i) => (
                    <TableCell key={h} align={i >= 4 && i <= 6 ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((cn) => {
                  const by = cn.createdByUser ? [cn.createdByUser.first_name, cn.createdByUser.last_name].filter(Boolean).join(' ') : '—';
                  return (
                    <TableRow
                      key={cn.id}
                      hover
                      sx={{ cursor: cn.taxInvoice?.id ? 'pointer' : 'default' }}
                      onClick={() => cn.taxInvoice?.id && navigate(`/erp/tax-invoices/view/${cn.taxInvoice.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{cn.credit_note_number}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(cn.credit_date).slice(0, 10)}</TableCell>
                      <TableCell>{cn.taxInvoice?.tax_invoice_number || '—'}</TableCell>
                      <TableCell>{cn.reason}</TableCell>
                      <TableCell align="right">{fmt(cn.subtotal)}</TableCell>
                      <TableCell align="right">{fmt(cn.vat_amount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(cn.total)}</TableCell>
                      <TableCell align="right">{parseFloat(cn.refund_amount) > 0 ? fmt(cn.refund_amount) : '—'}</TableCell>
                      <TableCell>{by}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={(e) => { e.stopPropagation(); apiService.downloadCreditNotePdf(cn.id, cn.credit_note_number).catch((err) => setError(err.message)); }} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>PDF</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default CreditNoteList;
