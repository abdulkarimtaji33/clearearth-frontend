import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Link,
  InputAdornment,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const TaxInvoiceEdit = () => {
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
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [editableItems, setEditableItems] = useState([]);

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
        setPaidAmount(r.paid_amount != null ? String(r.paid_amount) : '');
        setPaymentMethod(r.payment_method || '');
        setReferenceNo(r.reference_no || '');
        setRemarks(r.remarks || '');
        setEditableItems((r.items || []).map(it => ({
          id: it.id,
          name: it.productService?.name || it.description || `Item ${it.id}`,
          quantity: String(parseFloat(it.quantity) || 1),
          unitPrice: parseFloat(it.unit_price) || 0,
          unitOfMeasure: it.unit_of_measure || '',
        })));
      } else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRow(); }, [fetchRow]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      let attachmentPath;
      if (file) {
        const up = await apiService.uploadTaxInvoiceAttachment(file);
        attachmentPath = up.data?.path;
      }
      const pa = paidAmount !== '' ? parseFloat(paidAmount) : null;
      await apiService.updateTaxInvoice(id, {
        invoiceDate,
        dueDate: dueDate || null,
        paymentStatus,
        paidAmount: pa,
        paymentMethod: paymentMethod || null,
        referenceNo: referenceNo || null,
        remarks: remarks || null,
        ...(attachmentPath !== undefined ? { attachmentPath } : {}),
        items: editableItems.map(it => ({ id: it.id, quantity: parseFloat(it.quantity) || 1 })),
      });
      navigate(`/erp/tax-invoices/view/${id}`);
    } catch (e) {
      setError(e.message || 'Save failed');
      setSaving(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cur = row?.currency || 'AED';
  const totalNum = parseFloat(row?.total || 0);
  const paidNum = paidAmount !== '' ? parseFloat(paidAmount) : null;
  const balanceNum = paidNum != null ? Math.max(0, totalNum - paidNum) : null;
  const attUrl = row?.attachment_path ? apiService.getUploadUrl(row.attachment_path) : null;

  if (loading) {
    return (
      <PageContainer title="Edit tax invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error && !row) {
    return (
      <PageContainer title="Edit tax invoice">
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/erp/tax-invoices')}>Back to list</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit tax invoice">
      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>

        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(`/erp/tax-invoices/view/${id}`)} sx={{ borderRadius: 2 }}>
            Back
          </Button>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconReceipt size={22} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Edit Tax Invoice</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{row?.tax_invoice_number || `#${id}`}</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Editable line items */}
        {editableItems.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" fontSize="0.72rem" letterSpacing={0.8}>
                Line Items — edit quantities (amounts recalculate automatically)
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Service / Product</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>UOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Unit Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', width: 120 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Line Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editableItems.map((item, idx) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const lineTotal = qty * item.unitPrice;
                    return (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{item.unitOfMeasure || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{cur} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...editableItems];
                              updated[idx] = { ...updated[idx], quantity: e.target.value };
                              setEditableItems(updated);
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {cur} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ minWidth: 240 }}>
                {(() => {
                  const newSub = editableItems.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * it.unitPrice, 0);
                  const vatPct = parseFloat(row?.vat_percentage) || 0;
                  const newVat = (newSub * vatPct) / 100;
                  const newTotal = newSub + newVat;
                  return (
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Subtotal:</Typography>
                        <Typography variant="caption" fontWeight={600}>{cur} {newSub.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                      </Stack>
                      {vatPct > 0 && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">VAT ({vatPct}%):</Typography>
                          <Typography variant="caption" fontWeight={600}>{cur} {newVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                        </Stack>
                      )}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={700}>Total:</Typography>
                        <Typography variant="body2" fontWeight={700} color="primary.main">{cur} {newTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                      </Stack>
                    </Stack>
                  );
                })()}
              </Box>
            </Box>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Stack spacing={3}>

            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
              <TextField
                label="Invoice date"
                type="date"
                size="small"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Due date"
                type="date"
                size="small"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
            </Stack>

            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
              <TextField
                select
                label="Payment status"
                size="small"
                value={paymentStatus}
                onChange={(e) => {
                  const v = e.target.value;
                  setPaymentStatus(v);
                  if (v === 'unpaid') setPaidAmount('');
                  if (v === 'paid') setPaidAmount(fmt(row?.total).replace(/,/g, ''));
                }}
                sx={{ minWidth: 180 }}
              >
                {PAYMENT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>

              {(paymentStatus === 'partial' || paymentStatus === 'paid') && (
                <TextField
                  label="Amount paid"
                  size="small"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  sx={{ minWidth: 200 }}
                  helperText={
                    paymentStatus === 'partial' && balanceNum != null
                      ? `Balance due: ${cur} ${fmt(balanceNum)}`
                      : undefined
                  }
                />
              )}
            </Stack>

            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
              <TextField
                select
                label="Payment method"
                size="small"
                value={paymentMethod || ''}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value=""><em>Not set</em></MenuItem>
                {paymentMethodSelectOptions(paymentMethod).map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Reference no."
                size="small"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </Stack>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>Attachment</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {attUrl && (
                  <Link href={attUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Current file</Link>
                )}
                <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2 }}>
                  {file ? file.name : attUrl ? 'Replace' : 'Upload'}
                  <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Button>
              </Stack>
            </Box>

            <TextField
              label="Remarks"
              multiline
              minRows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
                {saving ? <CircularProgress size={22} color="inherit" /> : 'Save changes'}
              </Button>
              <Button variant="outlined" onClick={() => navigate(`/erp/tax-invoices/view/${id}`)} disabled={saving} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default TaxInvoiceEdit;
