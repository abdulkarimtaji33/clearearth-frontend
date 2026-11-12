import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCircleCheck, IconCircleDashed, IconReceiptRefund } from '@tabler/icons-react';
import apiService from '../../../services/api';

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ChoiceCard = ({ selected, title, hint, onClick }) => {
  const theme = useTheme();
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      sx={{
        flex: 1, cursor: 'pointer', p: 2, borderRadius: 2.5, border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        transition: 'all .15s', '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        {selected ? <IconCircleCheck size={22} color={theme.palette.primary.main} /> : <IconCircleDashed size={22} color={theme.palette.text.disabled} />}
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Guided "Debit note" dialog for a supplier bill: what to debit, why, and what it does to the books.
 * A debit note is what we issue to a supplier when goods are returned or the bill was too high.
 */
const DebitNoteDialog = ({ open, vendorBillId, onClose, onIssued }) => {
  const theme = useTheme();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open || !vendorBillId) return;
    setInfo(null); setError(''); setMode('full'); setAmount(''); setReason(''); setNotes('');
    setNoteDate(new Date().toISOString().slice(0, 10));
    setLoading(true);
    apiService.getBillDebitInfo(vendorBillId)
      .then((res) => setInfo(res.data))
      .catch((e) => setError(e.message || 'Could not load the bill'))
      .finally(() => setLoading(false));
  }, [open, vendorBillId]);

  const cur = info?.currency || 'AED';
  const preview = useMemo(() => {
    if (!info) return null;
    if (mode === 'full') return { subtotal: info.maxSubtotal, vat: info.maxVat, total: info.outstanding };
    const subtotal = round2(amount);
    const vat = round2((subtotal * info.vatPercentage) / 100);
    return { subtotal, vat, total: round2(subtotal + vat) };
  }, [info, mode, amount]);

  const tooMuch = preview && info && preview.total > info.outstanding + 0.01;
  const owedAfter = preview && info ? Math.max(0, round2(info.outstanding - preview.total)) : 0;
  const ready = !!info?.canDebit && !!reason && preview && preview.total > 0 && !tooMuch && !!noteDate;

  const submit = async () => {
    try {
      setSaving(true); setError('');
      const res = await apiService.createSupplierDebitNote({
        vendorBillId, reason, notes: notes.trim() || undefined, noteDate,
        amountExVat: mode === 'full' ? undefined : round2(amount),
      });
      onIssued?.(res.data);
    } catch (e) {
      setError(e.message || 'Could not record the debit note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconReceiptRefund size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>Supplier debit note</Typography>
            <Typography variant="caption" color="text.secondary">
              {info ? `For bill ${info.billNumber} · ${info.supplierName}` : 'Reduce what you owe a supplier for returned or overcharged goods'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {info && !info.canDebit && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            There is nothing left to debit on this bill. It is already fully paid or fully credited.
          </Alert>
        )}

        {info && info.canDebit && (
          <Stack spacing={3}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="body2" color="text.secondary">Bill total <strong>{cur} {fmt(info.total)}</strong></Typography>
                {info.paid > 0 && <Typography variant="body2" color="text.secondary">Paid <strong>{cur} {fmt(info.paid)}</strong></Typography>}
                {info.debited > 0 && <Typography variant="body2" color="text.secondary">Already debited <strong>{cur} {fmt(info.debited)}</strong></Typography>}
                <Typography variant="body2" fontWeight={800}>You still owe {cur} {fmt(info.outstanding)}</Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>1. How much is being debited?</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <ChoiceCard selected={mode === 'full'} title="Everything still owed" hint={`Cancels ${cur} ${fmt(info.outstanding)} including VAT`} onClick={() => setMode('full')} />
                <ChoiceCard selected={mode === 'partial'} title="Only part of it" hint="Enter the amount to take off, excluding VAT" onClick={() => setMode('partial')} />
              </Stack>
              {mode === 'partial' && (
                <TextField
                  autoFocus fullWidth type="number" label="Amount to debit (excluding VAT)" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  helperText={`VAT at ${info.vatPercentage}% is added automatically. Up to ${cur} ${fmt(info.maxSubtotal)} excluding VAT.`}
                  error={!!tooMuch}
                  sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>2. Why?</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mb={1.5}>
                {(info.reasons || []).map((r) => (
                  <Chip key={r} label={r} clickable color={reason === r ? 'primary' : 'default'} variant={reason === r ? 'filled' : 'outlined'} onClick={() => setReason(r)} sx={{ fontWeight: 600 }} />
                ))}
              </Stack>
              <TextField fullWidth multiline minRows={2} label="Note (optional)" placeholder="Supplier's credit note number, what was returned…" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField type="date" label="Debit note date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: String(info.billDate).slice(0, 10) }} sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>3. What will happen</Typography>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: tooMuch ? 'error.main' : 'divider' }}>
                {tooMuch ? (
                  <Typography variant="body2" color="error.main" fontWeight={600}>
                    That is more than you still owe on this bill ({cur} {fmt(info.outstanding)} including VAT). Lower the amount.
                  </Typography>
                ) : preview && preview.total > 0 ? (
                  <Stack spacing={0.75}>
                    <Typography variant="body2">
                      The bill goes down by <strong>{cur} {fmt(preview.total)}</strong> ({cur} {fmt(preview.subtotal)} + {cur} {fmt(preview.vat)} VAT).
                    </Typography>
                    <Typography variant="body2">After this you owe <strong>{cur} {fmt(owedAfter)}</strong> on this bill.</Typography>
                    <Typography variant="caption" color="text.secondary">
                      In the books: Accounts Payable is reduced; the expense and the recoverable VAT are reduced by the same total. The original bill stays as it is.
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Choose an amount to see what will happen.</Typography>
                )}
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!ready || saving} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
          {saving ? 'Saving…' : 'Record debit note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DebitNoteDialog;
