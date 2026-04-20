import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import { IconArrowLeft, IconFileInvoice, IconReceipt } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const ProformaInvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRow = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getProformaInvoice(id);
      if (res.success) setRow(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <PageContainer title="Proforma invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error || !row) {
    return (
      <PageContainer title="Proforma invoice">
        <Alert severity="error">{error || 'Not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/erp/proforma-invoices')}>Back to list</Button>
      </PageContainer>
    );
  }

  const items = (row.items || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cur = row.currency || 'AED';
  const createdName = row.createdByUser
    ? [row.createdByUser.first_name, row.createdByUser.last_name].filter(Boolean).join(' ') || row.createdByUser.email
    : '—';

  return (
    <PageContainer title="Proforma invoice">
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/proforma-invoices')} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFileInvoice size={24} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>Proforma invoice</Typography>
              <Typography variant="body2" color="text.secondary">{row.proforma_number || `#${row.id}`}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {row.taxInvoice?.id ? (
              <Button variant="contained" color="primary" startIcon={<IconReceipt size={18} />} onClick={() => navigate(`/erp/tax-invoices/view/${row.taxInvoice.id}`)} sx={{ borderRadius: 2 }}>
                View tax invoice
              </Button>
            ) : (
              <Button variant="contained" color="primary" startIcon={<IconReceipt size={18} />} onClick={() => navigate(`/erp/tax-invoices/create/${row.id}`)} sx={{ borderRadius: 2 }}>
                Convert to tax invoice
              </Button>
            )}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, px: 3, py: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Total</Typography>
              <Typography variant="h3" fontWeight={800} color="primary.main">{cur} {fmt(row.total)}</Typography>
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">Date: <strong>{row.invoice_date || '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Due: <strong>{row.due_date || '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Quotation: <strong>#{row.quotation?.id ?? '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Created by: <strong>{createdName}</strong></Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Deal</Typography>
          </Box>
          <Stack sx={{ px: 2.5, py: 2 }} spacing={1}>
            {row.deal?.id ? (
              <Link
                component="button"
                type="button"
                onClick={() => navigate(`/erp/deals/view/${row.deal.id}`)}
                sx={{ fontWeight: 600, textAlign: 'left', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {row.deal.deal_number ? `${row.deal.deal_number} — ` : ''}{row.deal.title || 'Deal'}
              </Link>
            ) : (
              <Typography variant="body2" fontWeight={600}>{row.deal?.title || row.deal?.deal_number || '—'}</Typography>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Line items</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <TableCell sx={{ fontWeight: 700, pl: 2.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>UOM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Unit</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 2.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Line</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No lines</Typography></TableCell></TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell sx={{ pl: 2.5 }}>{it.description || it.productService?.name || '—'}</TableCell>
                      <TableCell>{it.unit_of_measure || it.productService?.unit_of_measure || '—'}</TableCell>
                      <TableCell align="right">{fmt(it.quantity)}</TableCell>
                      <TableCell align="right">{fmt(it.unit_price)}</TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}>{fmt(it.line_total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={1} alignItems="flex-end">
              <Typography variant="body2">Subtotal: <strong>{cur} {fmt(row.subtotal)}</strong></Typography>
              <Typography variant="body2">VAT ({fmt(row.vat_percentage)}%): <strong>{cur} {fmt(row.vat_amount)}</strong></Typography>
              <Typography variant="h6" fontWeight={800}>Total: {cur} {fmt(row.total)}</Typography>
            </Stack>
          </Box>
        </Paper>

        {row.remarks && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.75}>Remarks</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{row.remarks}</Typography>
          </>
        )}
      </Box>
    </PageContainer>
  );
};

export default ProformaInvoiceView;
