import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Autocomplete,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { IconArrowLeft, IconFileInvoice, IconPlus, IconTrash } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import UomSelectField from '../../../components/erp/UomSelectField';
import apiService from '../../../services/api';

const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const addDaysISO = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const ProformaInvoiceCreate = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const returnTo = searchParams.get('return') || '/erp/quotations';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([]);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [duplicates, setDuplicates] = useState([]);
  const [dropdowns, setDropdowns] = useState({ unitsOfMeasure: [] });
  const [products, setProducts] = useState([]);

  const linesSubtotal = useMemo(
    () => items.reduce((s, r) => s + num(r.lineTotal), 0),
    [items]
  );

  // VAT and total are always derived from the lines and the VAT % (never from the deal's stored amount).
  const vatAmount = useMemo(() => Number(((linesSubtotal * num(vatPercentage)) / 100).toFixed(2)), [linesSubtotal, vatPercentage]);
  const total = useMemo(() => Number((linesSubtotal + vatAmount).toFixed(2)), [linesSubtotal, vatAmount]);

  const fetchCatalog = useCallback(async () => {
    try {
      const [dropRes, prodRes] = await Promise.all([
        apiService.getAllDropdowns(),
        apiService.getAllProducts({ status: 'active' }),
      ]);
      if (dropRes.success) {
        setDropdowns({ unitsOfMeasure: dropRes.data.units_of_measure || [] });
      }
      if (prodRes.success) {
        const list = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.items || [];
        setProducts(list);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const load = useCallback(async () => {
    if (!quotationId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getProformaPreviewFromQuotation(quotationId);
      if (!res.success || !res.data) {
        setError('Could not load quotation');
        return;
      }
      const d = res.data;
      setDealTitle(d.deal?.title || d.deal?.dealNumber || '');
      setCurrency(d.deal?.currency || d.quotation?.currency || 'AED');
      const inv = new Date().toISOString().slice(0, 10);
      setInvoiceDate(inv);
      setDueDate(addDaysISO(inv, 30));
      const vatPct = num(d.deal?.vatPercentage);
      setVatPercentage(vatPct);
      setItems(
        (d.items || []).map((it, i) => ({
          key: `row-${i}`,
          productServiceId: it.productServiceId,
          description: it.description || '',
          quantity: String(it.quantity ?? ''),
          unitPrice: String(it.unitPrice ?? ''),
          lineTotal: String(it.lineTotal ?? ''),
          unitOfMeasure: it.unitOfMeasure || '',
          sortOrder: i,
        }))
      );
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateLine = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };
      if (field === 'productServiceId') {
        const pid = value;
        row.productServiceId = pid;
        const p = products.find((x) => x.id === pid || String(x.id) === String(pid));
        if (p) {
          row.description = p.name || '';
          row.unitPrice = String(p.price ?? '');
          row.unitOfMeasure = p.unit_of_measure || '';
          const q = num(row.quantity);
          const up = num(row.unitPrice);
          row.lineTotal = (q * up).toFixed(2);
        } else if (!pid) {
          row.description = '';
          row.unitPrice = '';
          row.unitOfMeasure = '';
          row.lineTotal = '0.00';
        }
      } else if (field === 'quantity' || field === 'unitPrice') {
        row[field] = value;
        const q = num(row.quantity);
        const u = num(row.unitPrice);
        row.lineTotal = (q * u).toFixed(2);
      } else if (field === 'lineTotal') {
        row.lineTotal = value;
      } else {
        row[field] = value;
      }
      next[idx] = row;
      return next;
    });
  };

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}`,
        productServiceId: null,
        description: '',
        quantity: '1',
        unitPrice: '',
        lineTotal: '0.00',
        unitOfMeasure: '',
        sortOrder: prev.length,
      },
    ]);
  };

  const removeLine = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (skipDuplicateCheck = false) => {
    if (!quotationId) return;
    try {
      setSaving(true);
      setError('');
      if (skipDuplicateCheck !== true) {
        try {
          const dup = await apiService.checkProformaDuplicate({ quotationId, total });
          if (dup.success && Array.isArray(dup.data) && dup.data.length > 0) {
            setDuplicates(dup.data);
            setSaving(false);
            return;
          }
        } catch (e) { /* the check is advisory only; never block saving */ }
      }
      const sub = items.reduce((s, r) => s + num(r.lineTotal), 0);
      await apiService.createProformaInvoice({
        quotationId: parseInt(quotationId, 10),
        invoiceDate,
        dueDate: dueDate || null,
        subtotal: sub,
        vatPercentage: num(vatPercentage),
        vatAmount: num(vatAmount),
        total: num(total),
        currency,
        remarks: remarks || null,
        items: items.map((it, idx) => ({
          productServiceId: it.productServiceId,
          description: it.description,
          quantity: num(it.quantity),
          unitPrice: num(it.unitPrice),
          lineTotal: num(it.lineTotal),
          unitOfMeasure: it.unitOfMeasure || null,
          sortOrder: idx,
        })),
      });
      navigate('/erp/proforma-invoices');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Proforma invoice">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Create proforma invoice">
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(returnTo)} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFileInvoice size={24} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>Proforma invoice</Typography>
              <Typography variant="body2" color="text.secondary">From quotation #{quotationId}{dealTitle ? ` · ${dealTitle}` : ''}</Typography>
            </Box>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Dates &amp; currency</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>Defaults to today; adjust due date as needed.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Invoice date"
              type="date"
              size="small"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Due date"
              type="date"
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Currency"
              size="small"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              sx={{ width: 120 }}
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>
              Line items (editable)
            </Typography>
            <Button size="small" variant="outlined" startIcon={<IconPlus size={16} />} onClick={addLine} sx={{ borderRadius: 2 }}>
              Add line
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', minWidth: 260 }}>
                    Product / service
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', minWidth: 150 }}>
                    UOM
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Unit price
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ width: 48, pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" display="block" gutterBottom>
                        No lines — load from the deal quotation or click Add line.
                      </Typography>
                      <Button size="small" variant="text" onClick={addLine}>
                        Add line
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row, idx) => {
                    const selectedProduct =
                      products.find((p) => p.id === row.productServiceId || String(p.id) === String(row.productServiceId)) ||
                      null;
                    return (
                      <TableRow key={row.key || idx}>
                        <TableCell>
                          <Stack spacing={1}>
                            <Autocomplete
                              size="small"
                              options={products}
                              getOptionLabel={(opt) =>
                                typeof opt === 'object' && opt ? `${opt.name} (${opt.category || opt.type || ''})` : ''
                              }
                              value={selectedProduct}
                              onChange={(_, val) => updateLine(idx, 'productServiceId', val?.id ?? null)}
                              isOptionEqualToValue={(a, b) => a?.id === b?.id}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Select product or service…" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                              )}
                              ListboxProps={{ style: { maxHeight: 280 } }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Description on invoice"
                              value={row.description || ''}
                              onChange={(e) => updateLine(idx, 'description', e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140, maxWidth: 200 }}>
                          <UomSelectField
                            value={row.unitOfMeasure || ''}
                            onChange={(v) => updateLine(idx, 'unitOfMeasure', v)}
                            unitsOfMeasure={dropdowns.unitsOfMeasure || []}
                            onUnitsChange={(next) => setDropdowns((d) => ({ ...d, unitsOfMeasure: next }))}
                            minWidth={130}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ maxWidth: 120 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.quantity}
                            onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ maxWidth: 120 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.unitPrice}
                            onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 1, maxWidth: 120 }}>
                          <TextField
                            size="small"
                            value={row.lineTotal}
                            onChange={(e) => updateLine(idx, 'lineTotal', e.target.value)}
                            inputProps={{ style: { textAlign: 'right' } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 1.5 }}>
                          <IconButton size="small" color="error" onClick={() => removeLine(idx)} aria-label="Remove line">
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Amounts &amp; tax</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>VAT is calculated automatically from VAT % × line subtotal.</Typography>
          <Stack spacing={2} alignItems="flex-start" maxWidth={420}>
            <Typography variant="body2" color="text.secondary">
              Subtotal (sum of lines): <strong>{currency} {linesSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                label="VAT %"
                size="small"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(e.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                sx={{ width: 120 }}
              />
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" display="block">VAT amount</Typography>
                <Typography variant="body1" fontWeight={700}>
                  {currency} {num(vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <TextField
                label="Total"
                size="small"
                value={total.toFixed(2)}
                InputProps={{ readOnly: true }}
                sx={{ width: 160 }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Remarks"
            fullWidth
            multiline
            minRows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Review the line totals and VAT before saving.</Typography>
            <Button variant="contained" size="large" onClick={() => handleSubmit()} disabled={saving || !quotationId} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Create proforma invoice'}
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Dialog open={duplicates.length > 0} onClose={() => setDuplicates([])} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Possible duplicate proforma</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This deal already has a proforma invoice for the same amount ({currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}):{' '}
            <strong>{duplicates.map((d) => d.proformaNumber).join(', ')}</strong>. Create another one anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDuplicates([])} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={() => { setDuplicates([]); handleSubmit(true); }} sx={{ borderRadius: 2 }}>Create anyway</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProformaInvoiceCreate;
