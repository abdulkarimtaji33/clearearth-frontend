import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, CircularProgress, Alert, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconReceipt, IconEye, IconPrinter } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';
import { extractListData } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PurchasePaymentReceiptsList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search: search || undefined };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await apiService.getPurchasePaymentReceipts(params);
      setRows(Array.isArray(res.data) ? res.data : extractListData(res));
      setTotalCount(res.pagination?.totalItems ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load payment receipts');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  return (
    <PageContainer title="Payment Receipts" description="Payment receipts for purchase orders">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={20} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>Payment Receipts</Typography>
              <Typography variant="body2" color="text.secondary">Purchase payments · {totalCount} receipt{totalCount !== 1 ? 's' : ''}</Typography>
            </Box>
          </Stack>
          <Button variant="outlined" onClick={() => navigate('/erp/payables')} sx={{ borderRadius: 2 }}>
            Open payables
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <TextField
              size="small"
              placeholder="Search receipt #, PO #, party, reference..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
              sx={{ minWidth: 280, width: '100%', maxWidth: 420 }}
            />
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(v) => { setDateFrom(v); setPage(0); }}
                onToChange={(v) => { setDateTo(v); setPage(0); }}
                onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                helperText="Payment date"
                compact
              />
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                  {['Receipt #', 'Date', 'PO #', 'Paid to', 'Method', 'Reference', 'Amount', ''].map((h) => (
                    <TableCell key={h} align={h === 'Amount' || h === '' ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No payment receipts yet</Typography></TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={700}>{r.receipt_number || `PPR-${r.id}`}</Typography></TableCell>
                    <TableCell>{fmtDate(r.paid_at)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => navigate(`/erp/purchase-orders/view/${r.po_id || r.source_id}`)}
                      >
                        #{r.po_id || r.source_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.paid_to || r.party_name || '—'}</TableCell>
                    <TableCell>{r.payment_method || '—'}</TableCell>
                    <TableCell>{r.reference_no || '—'}</TableCell>
                    <TableCell align="right"><Typography fontWeight={800}>AED {fmt(r.amount)}</Typography></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button size="small" variant="outlined" startIcon={<IconEye size={14} />} onClick={() => navigate(`/erp/payment-receipts/${r.id}`)} sx={{ borderRadius: 2 }}>
                          View
                        </Button>
                        <Button size="small" variant="contained" startIcon={<IconPrinter size={14} />} onClick={() => navigate(`/erp/payment-receipts/${r.id}?print=1`)} sx={{ borderRadius: 2 }}>
                          Print
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Card>
      </Box>
    </PageContainer>
  );
};

export default PurchasePaymentReceiptsList;
