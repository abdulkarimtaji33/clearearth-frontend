import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconTrash, IconReceipt, IconEye, IconFileInvoice } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const PAYMENT_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };

const TaxInvoiceList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await apiService.getTaxInvoices(params);
      if (res.success) {
        setRows(Array.isArray(res.data) ? res.data : []);
        setTotalCount(res.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tax invoices');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await apiService.deleteTaxInvoice(selected.id);
      setSuccess('Tax invoice deleted');
      setDeleteOpen(false);
      setSelected(null);
      fetchRows();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <PageContainer title="Tax invoices" description="Converted from proforma invoices">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconReceipt size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Tax invoices</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0
                ? `${totalCount} tax invoice${totalCount !== 1 ? 's' : ''}`
                : 'Official invoices with payment tracking and attachments.'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search by deal title or number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 260, flex: 1 }}
              />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFromChange={(v) => { setDateFrom(v); setPage(0); }}
                onToChange={(v) => { setDateTo(v); setPage(0); }}
                onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                helperText="Tax invoice date"
                compact
              />
            </Box>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.06) }}>
                    {['Number', 'Proforma', 'Deal', 'Date', 'Due', 'Payment', 'Total (AED)', ''].map((h, i) => (
                      <TableCell key={h} align={i === 6 ? 'right' : i === 7 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <IconReceipt size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary" display="block" gutterBottom>
                          No tax invoices yet.
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2 }}>
                          Open a proforma invoice and use &quot;Convert to tax invoice&quot;.
                        </Typography>
                        <Button size="small" variant="outlined" startIcon={<IconFileInvoice size={16} />} sx={{ borderRadius: 2 }} onClick={() => navigate('/erp/proforma-invoices')}>
                          Proforma invoices
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow
                        key={r.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                        onClick={() => navigate(`/erp/tax-invoices/view/${r.id}`)}
                      >
                        <TableCell><Typography variant="body2" fontWeight={700}>{r.tax_invoice_number || `#${r.id}`}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{r.proformaInvoice?.proforma_number || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{r.proformaInvoice?.deal?.title || r.proformaInvoice?.deal?.deal_number || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{r.invoice_date || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{r.due_date || '—'}</Typography></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Chip size="small" label={(r.payment_status || 'unpaid').replace(/_/g, ' ')} color={PAYMENT_COLOR[r.payment_status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={700}>{fmt(r.total)}</Typography></TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/erp/tax-invoices/view/${r.id}`)} sx={{ mr: 0.5 }}>
                              <IconEye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => { setSelected(r); setDeleteOpen(true); }}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
          </CardContent>
        </Card>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Delete tax invoice</DialogTitle>
          <DialogContent><DialogContentText>Delete {selected?.tax_invoice_number || 'this'} tax invoice?</DialogContentText></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default TaxInvoiceList;
