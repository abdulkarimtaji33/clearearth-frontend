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
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import { IconArrowLeft, IconReceipt, IconFileInvoice, IconEdit, IconCoin } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const PAYMENT_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };

const fmtQty = (q) => {
  const n = parseFloat(q);
  if (!Number.isFinite(n)) return '—';
  return n % 1 === 0 ? String(n) : n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
};

const lineVatShare = (lineTotal, subtotal, vatAmount) => {
  const lt = parseFloat(lineTotal) || 0;
  const st = parseFloat(subtotal) || 0;
  const va = parseFloat(vatAmount) || 0;
  if (st <= 0 || va <= 0) return 0;
  return (lt / st) * va;
};

const TaxInvoiceView = () => {
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
      const res = await apiService.getTaxInvoice(id);
      if (res.success && res.data) setRow(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRow(); }, [fetchRow]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <PageContainer title="Tax invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error || !row) {
    return (
      <PageContainer title="Tax invoice">
        <Alert severity="error">{error || 'Not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/erp/tax-invoices')}>Back to list</Button>
      </PageContainer>
    );
  }

  const items = (row.items || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cur = row.currency || 'AED';
  const pf = row.proformaInvoice;
  const createdName = row.createdByUser
    ? [row.createdByUser.first_name, row.createdByUser.last_name].filter(Boolean).join(' ') || row.createdByUser.email
    : '—';
  const attUrl = row.attachment_path ? apiService.getUploadUrl(row.attachment_path) : null;

  const totalNum = parseFloat(row.total) || 0;
  const paidNum = row.paid_amount != null ? parseFloat(row.paid_amount) : null;
  const remainingNum = paidNum != null ? Math.max(0, totalNum - paidNum) : null;
  const isPartial = row.payment_status === 'partial';
  const isPaid = row.payment_status === 'paid';

  return (
    <PageContainer title="Tax invoice">
      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>

        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/tax-invoices')} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={22} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h5" fontWeight={800}>Tax Invoice</Typography>
                <Chip
                  size="small"
                  label={(row.payment_status || 'unpaid').replace(/_/g, ' ')}
                  color={PAYMENT_COLOR[row.payment_status] || 'default'}
                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{row.tax_invoice_number || `#${row.id}`}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {pf?.id && (
              <Button variant="outlined" startIcon={<IconFileInvoice size={16} />} onClick={() => navigate(`/erp/proforma-invoices/view/${pf.id}`)} sx={{ borderRadius: 2 }}>
                View Proforma
              </Button>
            )}
            <Button variant="contained" startIcon={<IconEdit size={16} />} onClick={() => navigate(`/erp/tax-invoices/edit/${id}`)} sx={{ borderRadius: 2 }}>
              Edit
            </Button>
          </Stack>
        </Stack>

        {/* Summary */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={3}>
              {/* Amounts */}
              <Stack spacing={1} sx={{ minWidth: 240 }}>
                <Stack direction="row" justifyContent="space-between" spacing={4}>
                  <Typography variant="body2" color="text.secondary">Subtotal (ex VAT)</Typography>
                  <Typography variant="body2" fontWeight={600}>{cur} {fmt(row.subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" spacing={4}>
                  <Typography variant="body2" color="text.secondary">VAT {fmt(row.vat_percentage)}%</Typography>
                  <Typography variant="body2" fontWeight={600}>{cur} {fmt(row.vat_amount)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" spacing={4}>
                  <Typography variant="subtitle2" fontWeight={700}>Invoice total</Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">{cur} {fmt(row.total)}</Typography>
                </Stack>

                {(isPartial || isPaid) && paidNum != null && (
                  <Stack direction="row" justifyContent="space-between" spacing={4}>
                    <Typography variant="body2" color="text.secondary">Amount paid</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">{cur} {fmt(paidNum)}</Typography>
                  </Stack>
                )}

                {isPartial && remainingNum != null && (
                  <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.35), borderRadius: 2, px: 1.5, py: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <IconCoin size={15} color={theme.palette.warning.dark} />
                        <Typography variant="body2" fontWeight={700} color="warning.dark">Balance due</Typography>
                      </Stack>
                      <Typography variant="subtitle2" fontWeight={800} color="warning.dark">{cur} {fmt(remainingNum)}</Typography>
                    </Stack>
                  </Box>
                )}

                {isPaid && (
                  <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.3), borderRadius: 2, px: 1.5, py: 0.75 }}>
                    <Typography variant="body2" fontWeight={700} color="success.dark" textAlign="center">Fully paid</Typography>
                  </Box>
                )}
              </Stack>

              {/* Meta */}
              <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">Invoice date <strong>{row.invoice_date || '—'}</strong></Typography>
                <Typography variant="caption" color="text.secondary">Due <strong>{row.due_date || '—'}</strong></Typography>
                {row.payment_method && <Typography variant="caption" color="text.secondary">Method <strong>{row.payment_method}</strong></Typography>}
                {row.reference_no && <Typography variant="caption" color="text.secondary">Reference <strong>{row.reference_no}</strong></Typography>}
                <Typography variant="caption" color="text.secondary">Created by <strong>{createdName}</strong></Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Deal link */}
          {pf?.deal?.id && (
            <Box sx={{ px: 3, py: 1.5, borderBottom: attUrl || row.remarks ? '1px solid' : undefined, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>Client / deal</Typography>
              <Link component="button" type="button" onClick={() => navigate(`/erp/deals/view/${pf.deal.id}`)} sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                {pf.deal.deal_number ? `${pf.deal.deal_number} — ` : ''}{pf.deal.title || 'Deal'}
              </Link>
              {pf.quotation?.id && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  From quotation{' '}
                  <Link component="button" type="button" onClick={() => navigate(`/erp/quotations/view/${pf.quotation.id}`)} sx={{ fontWeight: 600 }}>#{pf.quotation.id}</Link>
                </Typography>
              )}
            </Box>
          )}

          {/* Attachment */}
          {attUrl && (
            <Box sx={{ px: 3, py: 1.5, borderBottom: row.remarks ? '1px solid' : undefined, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>Attachment</Typography>
              <Link href={attUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Open file</Link>
            </Box>
          )}

          {/* Remarks */}
          {row.remarks && (
            <Box sx={{ px: 3, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>Remarks</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{row.remarks}</Typography>
            </Box>
          )}
        </Paper>

        {/* Line items */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Line items</Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 580 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  {['#', 'Description', 'UOM', 'Qty', 'Unit price', 'Ex VAT', 'VAT', 'Incl. VAT'].map((h, i) => (
                    <TableCell
                      key={h}
                      align={i >= 3 ? 'right' : 'left'}
                      sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', pl: i === 0 ? 2.5 : undefined, pr: i === 7 ? 2.5 : undefined, whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No line items</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it, idx) => {
                    const ps = it.productService;
                    const share = lineVatShare(it.line_total, row.subtotal, row.vat_amount);
                    const lineIncl = (parseFloat(it.line_total) || 0) + share;
                    const desc = (it.description || '').trim() || ps?.name || '—';
                    return (
                      <TableRow key={it.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ pl: 2.5, color: 'text.secondary', width: 36 }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{desc}</Typography>
                          {ps?.name && desc !== ps.name && (
                            <Typography variant="caption" color="text.secondary">{ps.name}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{it.unit_of_measure || ps?.unit_of_measure || '—'}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmtQty(it.quantity)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{cur} {fmt(it.unit_price)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{cur} {fmt(it.line_total)}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{cur} {fmt(share)}</TableCell>
                        <TableCell align="right" sx={{ pr: 2.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{cur} {fmt(lineIncl)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Stack spacing={0.75} alignItems="flex-end">
              <Stack direction="row" spacing={5}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight={700}>{cur} {fmt(row.subtotal)}</Typography>
              </Stack>
              <Stack direction="row" spacing={5}>
                <Typography variant="body2" color="text.secondary">VAT {fmt(row.vat_percentage)}%</Typography>
                <Typography variant="body2" fontWeight={700}>{cur} {fmt(row.vat_amount)}</Typography>
              </Stack>
              <Divider flexItem sx={{ width: '100%', maxWidth: 300 }} />
              <Stack direction="row" spacing={5}>
                <Typography variant="subtitle2" fontWeight={800}>Total (incl. VAT)</Typography>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">{cur} {fmt(row.total)}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 340, textAlign: 'right' }}>
                Per-line VAT is apportioned. Rounding of ±{cur}0.01 possible; invoice total is authoritative.
              </Typography>
            </Stack>
          </Box>
        </Paper>

      </Box>
    </PageContainer>
  );
};

export default TaxInvoiceView;
