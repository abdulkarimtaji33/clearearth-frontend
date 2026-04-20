import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Chip,
  Link,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import { IconArrowLeft, IconReceipt } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { paymentMethodSelectOptions } from '../../../constants/paymentMethods';

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

const PAYMENT_COLOR = { unpaid: 'warning', partial: 'info', paid: 'success' };

const fmtQty = (q) => {
  const n = parseFloat(q);
  if (!Number.isFinite(n)) return '—';
  return n % 1 === 0 ? String(n) : n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
};

/** Allocate invoice VAT to a line by value (subtotal = sum of line ex-VAT). */
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchRow = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getTaxInvoice(id);
      if (res.success && res.data) {
        const r = res.data;
        setRow(r);
        setInvoiceDate(r.invoice_date || '');
        setDueDate(r.due_date || '');
        setPaymentStatus(r.payment_status || 'unpaid');
        setPaymentMethod(r.payment_method || '');
        setReferenceNo(r.reference_no || '');
        setRemarks(r.remarks || '');
      } else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError('');
      let attachmentPath;
      if (file) {
        const up = await apiService.uploadTaxInvoiceAttachment(file);
        attachmentPath = up.data?.path;
      }
      await apiService.updateTaxInvoice(id, {
        invoiceDate,
        dueDate: dueDate || null,
        paymentStatus,
        paymentMethod: paymentMethod || null,
        referenceNo: referenceNo || null,
        remarks: remarks || null,
        ...(attachmentPath !== undefined ? { attachmentPath } : {}),
      });
      setFile(null);
      setSuccess('Changes saved');
      await fetchRow();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <PageContainer title="Tax invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error && !row) {
    return (
      <PageContainer title="Tax invoice">
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/erp/tax-invoices')}>Back to list</Button>
      </PageContainer>
    );
  }

  if (!row) return null;

  const items = (row.items || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cur = row.currency || 'AED';
  const createdName = row.createdByUser
    ? [row.createdByUser.first_name, row.createdByUser.last_name].filter(Boolean).join(' ') || row.createdByUser.email
    : '—';
  const pf = row.proformaInvoice;
  const attUrl = row.attachment_path ? apiService.getUploadUrl(row.attachment_path) : null;

  return (
    <PageContainer title="Tax invoice">
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/tax-invoices')} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={24} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight={800}>Tax invoice</Typography>
                <Chip size="small" label={(row.payment_status || '').replace(/_/g, ' ')} color={PAYMENT_COLOR[row.payment_status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">{row.tax_invoice_number || `#${row.id}`}</Typography>
            </Box>
          </Stack>
          {pf?.id && (
            <Button variant="outlined" onClick={() => navigate(`/erp/proforma-invoices/view/${pf.id}`)} sx={{ borderRadius: 2 }}>
              View proforma
            </Button>
          )}
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(theme.palette.info.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2} alignItems="flex-start">
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>Amount due</Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">{cur} {fmt(row.total)}</Typography>
              </Box>
              <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">Invoice date <strong>{row.invoice_date || '—'}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Due <strong>{row.due_date || '—'}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Created by <strong>{createdName}</strong></Typography>
              </Stack>
            </Stack>
          </Box>
          {pf?.deal?.id && (
            <Box sx={{ px: 3, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>Client / deal</Typography>
              <Link
                component="button"
                type="button"
                onClick={() => navigate(`/erp/deals/view/${pf.deal.id}`)}
                sx={{ fontWeight: 600, textAlign: 'left', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {pf.deal.deal_number ? `${pf.deal.deal_number} — ` : ''}{pf.deal.title || 'Deal'}
              </Link>
              {pf.quotation?.id && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  From quotation{' '}
                  <Link component="button" type="button" onClick={() => navigate(`/erp/quotations/view/${pf.quotation.id}`)} sx={{ fontWeight: 600 }}>
                    #{pf.quotation.id}
                  </Link>
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Payment &amp; references</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Update status, bank reference, and supporting documents.
          </Typography>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
            <TextField label="Invoice date" type="date" size="small" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
            <TextField label="Due date" type="date" size="small" value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
            <TextField select label="Payment status" size="small" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} sx={{ minWidth: 160 }}>
              {PAYMENT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Payment method"
              size="small"
              value={paymentMethod || ''}
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">
                <em>Not set</em>
              </MenuItem>
              {paymentMethodSelectOptions(paymentMethod).map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Reference no." size="small" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} sx={{ minWidth: 200 }} />
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>Attachment</Typography>
          {attUrl && (
            <Box sx={{ mb: 1.5 }}>
              <Link href={attUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>Open current file</Link>
            </Box>
          )}
          <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, alignSelf: 'flex-start' }}>
            {file ? file.name : attUrl ? 'Replace attachment' : 'Upload attachment'}
            <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
          <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth sx={{ mt: 2 }} />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Save changes'}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Line items &amp; tax detail</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Amounts ex-VAT per line; VAT is calculated on the invoice subtotal ({fmt(row.vat_percentage)}%). Per-line VAT is apportioned for reference.
            </Typography>
          </Box>
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <TableCell sx={{ fontWeight: 700, pl: 2.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', minWidth: 160 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', minWidth: 140 }}>Product / service</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>UOM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Unit price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Line ex VAT</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>VAT (apport.)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 2.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Line incl. VAT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ py: 4, textAlign: 'center' }}>
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
                      <TableRow key={it.id}>
                        <TableCell sx={{ pl: 2.5, color: 'text.secondary' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{desc}</Typography>
                          {it.description && ps?.name && it.description.trim() !== ps.name && (
                            <Typography variant="caption" color="text.secondary" display="block">Catalog: {ps.name}</Typography>
                          )}
                          {ps?.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, maxWidth: 280 }} noWrap title={ps.description}>
                              {ps.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {ps ? (
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={600}>{ps.name}</Typography>
                              {it.product_service_id && (
                                <Typography variant="caption" color="text.secondary">ID #{it.product_service_id}</Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">{it.product_service_id ? `ID #${it.product_service_id}` : '—'}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {ps?.type ? (
                            <Chip size="small" label={ps.type} variant="outlined" sx={{ textTransform: 'capitalize', fontWeight: 600, height: 22 }} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{ps?.category || '—'}</Typography>
                        </TableCell>
                        <TableCell>{it.unit_of_measure || ps?.unit_of_measure || '—'}</TableCell>
                        <TableCell align="right">{fmtQty(it.quantity)}</TableCell>
                        <TableCell align="right">{cur} {fmt(it.unit_price)}</TableCell>
                        <TableCell align="right">{cur} {fmt(it.line_total)}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{cur} {fmt(share)}</TableCell>
                        <TableCell align="right" sx={{ pr: 2.5, fontWeight: 700 }}>{cur} {fmt(lineIncl)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 2.5, py: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Stack spacing={1.25} alignItems="flex-end">
              <Typography variant="body2" color="text.secondary">
                Subtotal (taxable supply, ex VAT):{' '}
                <Typography component="span" variant="body1" fontWeight={700} color="text.primary">{cur} {fmt(row.subtotal)}</Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                VAT @ {fmt(row.vat_percentage)}%:{' '}
                <Typography component="span" variant="body1" fontWeight={700} color="text.primary">{cur} {fmt(row.vat_amount)}</Typography>
              </Typography>
              <Divider flexItem sx={{ width: '100%', maxWidth: 360 }} />
              <Typography variant="h6" fontWeight={800}>
                Total amount due (incl. VAT): {cur} {fmt(row.total)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'right' }}>
                Currency: {cur}. Sum of line “incl. VAT” may differ by {cur}0.01 from total due to rounding; invoice total is authoritative.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default TaxInvoiceView;
