import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  MenuItem,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import { IconArrowLeft, IconReceipt } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { PAYMENT_METHOD_OPTIONS } from '../../../constants/paymentMethods';

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

const TaxInvoiceCreate = () => {
  const { proformaId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [proformaLabel, setProformaLabel] = useState('');

  const load = useCallback(async () => {
    if (!proformaId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getTaxPreviewFromProforma(proformaId);
      if (!res.success || !res.data) {
        setError('Could not load proforma');
        return;
      }
      const d = res.data;
      const pf = d.proformaInvoice || {};
      setProformaLabel(pf.proformaNumber || `#${proformaId}`);
      setInvoiceDate(d.defaults?.invoiceDate || new Date().toISOString().slice(0, 10));
      setDueDate(d.defaults?.dueDate || pf.dueDate || '');
      setPaymentStatus(d.defaults?.paymentStatus || 'unpaid');
      setPaymentMethod(d.defaults?.paymentMethod || '');
      setReferenceNo(d.defaults?.referenceNo || '');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [proformaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!proformaId) return;
    try {
      setSaving(true);
      setError('');
      let attachmentPath = null;
      if (file) {
        const up = await apiService.uploadTaxInvoiceAttachment(file);
        attachmentPath = up.data?.path || null;
      }
      await apiService.createTaxInvoice({
        proformaInvoiceId: parseInt(proformaId, 10),
        invoiceDate,
        dueDate: dueDate || null,
        paymentStatus,
        paymentMethod: paymentMethod || null,
        referenceNo: referenceNo || null,
        attachmentPath,
        remarks: remarks || null,
      });
      navigate('/erp/tax-invoices');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Tax invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Create tax invoice">
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(`/erp/proforma-invoices/view/${proformaId}`)} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={24} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>Create tax invoice</Typography>
              <Typography variant="body2" color="text.secondary">Proforma {proformaLabel} — line items copy from proforma after save.</Typography>
            </Box>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.info.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Dates</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2.5 }}>
            <TextField label="Invoice date" type="date" size="small" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Due date" type="date" size="small" value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.info.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Payment</Typography>
          </Box>
          <Stack spacing={2} sx={{ p: 2.5 }}>
            <TextField select label="Payment status" size="small" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} fullWidth>
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
              fullWidth
            >
              <MenuItem value="">
                <em>Not set</em>
              </MenuItem>
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Reference no." size="small" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} fullWidth placeholder="Transaction / bank reference" />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Supporting document</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>Optional PDF, scan, or signed copy.</Typography>
          <Button variant="outlined" component="label" sx={{ borderRadius: 2, alignSelf: 'flex-start' }}>
            {file ? file.name : 'Attach file'}
            <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
          <Divider sx={{ my: 2 }} />
          <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth />
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="flex-end">
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Create tax invoice'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default TaxInvoiceCreate;
