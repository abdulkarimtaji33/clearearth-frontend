import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert, Autocomplete, Box, Button, Card, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCoins, IconPlus, IconSearch } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import apiService from '../../../services/api';
import { overdrawInfo } from '../../../utils/accountTree';
import { localToday } from '../../../utils/dateLocal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

const SupplierAdvances = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [openOnly, setOpenOnly] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Record advance dialog
  const emptyForm = () => ({ supplier: null, amount: '', date: localToday(), method: 'Bank transfer', accountId: '', ref: '', notes: '' });
  const [recOpen, setRecOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [negativeOk, setNegativeOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Apply to bill dialog
  const [applyAdv, setApplyAdv] = useState(null);
  const [applyOpts, setApplyOpts] = useState(null);
  const [applyBillId, setApplyBillId] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [applyDate, setApplyDate] = useState(localToday());
  const [applySaving, setApplySaving] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const h = setTimeout(() => { setDebounced(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(h);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSupplierAdvances({ page: page + 1, pageSize, search: debounced || undefined, openOnly: openOnly === 'open' ? 'true' : undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.totalItems ?? (res.data || []).length);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load advances');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debounced, openOnly]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiService.getSuppliers({ page: 1, pageSize: 1000 }).then((res) => setSuppliers(Array.isArray(res.data) ? res.data : res.data?.items || [])).catch(() => {});
    apiService.getChartOfAccounts({ withBalance: true }).then((res) => setAccounts(Array.isArray(res.data) ? res.data : res.data?.items || [])).catch(() => {});
  }, []);

  const amt = round2(form.amount);
  const overdraw = !!form.accountId && amt > 0 && !!overdrawInfo(accounts, form.accountId, amt);

  const saveAdvance = async () => {
    if (!form.supplier) { setFormError('Choose the supplier'); return; }
    if (!(amt > 0)) { setFormError('Enter the advance amount'); return; }
    if (!form.accountId) { setFormError('Choose the bank or cash account the advance is paid from'); return; }
    if (overdraw && !negativeOk) { setFormError('This payment takes the account below zero. Tick "Pay anyway" to continue.'); return; }
    try {
      setSaving(true); setFormError('');
      const res = await apiService.recordSupplierAdvance({
        supplierId: form.supplier.id, amount: amt, advanceDate: form.date, paymentMethod: form.method,
        paymentAccountId: parseInt(form.accountId, 10), referenceNo: form.ref || undefined, notes: form.notes || undefined,
        confirmNegative: negativeOk || undefined,
      });
      setRecOpen(false);
      setSuccess(`Advance ${res.data.advance_number} of AED ${fmt(amt)} recorded for ${res.data.party_name}`);
      await load();
    } catch (e) {
      setFormError(e.message || 'Could not record the advance');
    } finally {
      setSaving(false);
    }
  };

  const openApply = async (adv) => {
    setApplyAdv(adv); setApplyOpts(null); setApplyBillId(''); setApplyAmount(''); setApplyError(''); setApplyDate(localToday());
    try {
      const res = await apiService.getAdvanceApplyOptions(adv.supplier_id);
      setApplyOpts(res.data);
    } catch (e) {
      setApplyError(e.message || 'Could not load the supplier\'s open bills');
    }
  };

  const pickedBill = applyOpts?.bills?.find((b) => String(b.id) === String(applyBillId));
  const maxApply = pickedBill && applyAdv ? Math.min(applyAdv.remaining, pickedBill.balance_due) : 0;

  const saveApply = async () => {
    if (!pickedBill) { setApplyError('Choose the bill to apply the advance to'); return; }
    const a = applyAmount === '' ? maxApply : round2(applyAmount);
    if (!(a > 0)) { setApplyError('Enter an amount greater than zero'); return; }
    if (a > maxApply + 0.01) { setApplyError(`You can apply at most AED ${fmt(maxApply)} to this bill`); return; }
    try {
      setApplySaving(true); setApplyError('');
      await apiService.applySupplierAdvance(applyAdv.id, { vendorBillId: pickedBill.id, amount: a, appliedAt: applyDate });
      setApplyAdv(null);
      setSuccess(`AED ${fmt(a)} of advance ${applyAdv.advance_number} applied to ${pickedBill.bill_number}`);
      await load();
    } catch (e) {
      setApplyError(e.message || 'Could not apply the advance');
    } finally {
      setApplySaving(false);
    }
  };

  const head = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' };

  return (
    <PageContainer title="Supplier advances">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCoins size={24} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>Supplier advances</Typography>
          <Typography variant="body2" color="text.secondary">
            Money paid to a supplier before the bill arrives. Apply it to the bill later so you only pay the difference.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => { setForm(emptyForm()); setNegativeOk(false); setFormError(''); setRecOpen(true); }} sx={{ borderRadius: 2, fontWeight: 700 }}>
          Record advance
        </Button>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField
            fullWidth size="small" placeholder="Search by advance number, supplier or reference…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <ToggleButtonGroup exclusive size="small" value={openOnly} onChange={(_, v) => { if (v) { setOpenOnly(v); setPage(0); } }}>
            <ToggleButton value="all" sx={{ px: 2 }}>All</ToggleButton>
            <ToggleButton value="open" sx={{ px: 2, whiteSpace: 'nowrap' }}>Not fully used</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography fontWeight={700}>No advances yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paying a supplier before you have their bill? Record it here so it can be matched to the bill later.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Advance', 'Date', 'Supplier', 'Paid from', 'Reference', 'Amount', 'Used', 'Left', ''].map((h, i) => (
                    <TableCell key={h || 'act'} align={i >= 5 && i <= 7 ? 'right' : 'left'} sx={head}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{a.advance_number}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(a.advance_date).slice(0, 10)}</TableCell>
                    <TableCell>{a.party_name}</TableCell>
                    <TableCell>{a.paymentAccount ? `${a.paymentAccount.code} ${a.paymentAccount.name}` : '—'}</TableCell>
                    <TableCell>{a.reference_no || '—'}</TableCell>
                    <TableCell align="right">{fmt(a.amount)}</TableCell>
                    <TableCell align="right">{fmt(a.applied_amount)}</TableCell>
                    <TableCell align="right">
                      {a.remaining > 0.005 ? <strong>{fmt(a.remaining)}</strong> : <Chip size="small" color="success" label="Fully used" />}
                    </TableCell>
                    <TableCell align="right">
                      {a.remaining > 0.005 && <Button size="small" variant="outlined" onClick={() => openApply(a)} sx={{ borderRadius: 2 }}>Apply to bill</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        )}
      </Card>

      {/* Record advance */}
      <Dialog open={recOpen} onClose={() => !saving && setRecOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record a supplier advance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Money leaves the bank or cash account now and is held as “Advances to Suppliers” until you apply it to a bill.
          </Typography>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={suppliers} value={form.supplier}
              onChange={(_, v) => setForm((f) => ({ ...f, supplier: v }))}
              getOptionLabel={(s) => s.company_name || ''} isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(p) => <TextField {...p} required label="Supplier" />}
            />
            <Stack direction="row" spacing={2}>
              <TextField required type="number" label="Advance amount (AED)" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputProps={{ min: 0, step: 'any' }} fullWidth />
              <TextField type="date" label="Date paid" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <PaymentRecordingFields
              paymentMethod={form.method}
              onPaymentMethodChange={(v) => setForm((f) => ({ ...f, method: v }))}
              paymentAccountId={form.accountId}
              onPaymentAccountChange={(v) => setForm((f) => ({ ...f, accountId: v ? String(v) : '' }))}
              accounts={accounts}
              autoPickAccount={false}
              payAmount={amt}
              negativeConfirmed={negativeOk}
              onNegativeConfirmedChange={setNegativeOk}
            />
            <TextField label="Reference / cheque no." value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} fullWidth />
            <TextField multiline minRows={2} label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRecOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveAdvance} disabled={saving}>{saving ? 'Saving…' : 'Record advance'}</Button>
        </DialogActions>
      </Dialog>

      {/* Apply to bill */}
      <Dialog open={!!applyAdv} onClose={() => !applySaving && setApplyAdv(null)} fullWidth maxWidth="sm">
        <DialogTitle>Apply advance {applyAdv?.advance_number}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {applyAdv?.party_name} · AED {fmt(applyAdv?.remaining)} of this advance is still unused. Applying it settles part or all of a bill without moving any cash.
          </Typography>
          {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}
          {!applyOpts && !applyError && <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>}
          {applyOpts && applyOpts.bills.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>This supplier has no open bills yet. Record the bill first, then come back to apply the advance.</Alert>
          )}
          {applyOpts && applyOpts.bills.length > 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select required label="Bill to settle" value={applyBillId} onChange={(e) => { setApplyBillId(e.target.value); setApplyAmount(''); }} fullWidth>
                {applyOpts.bills.map((b) => (
                  <MenuItem key={b.id} value={String(b.id)}>
                    {b.bill_number} · invoice {b.supplier_invoice_no} · owed AED {fmt(b.balance_due)}
                  </MenuItem>
                ))}
              </TextField>
              {pickedBill && (
                <TextField
                  type="number" label="Amount to apply (AED)" value={applyAmount} onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder={String(maxApply)} inputProps={{ min: 0, step: 'any', max: maxApply }}
                  helperText={`Leave blank to apply AED ${fmt(maxApply)} (the most this bill and this advance allow)`} fullWidth
                />
              )}
              <TextField type="date" label="Apply on" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: String(applyAdv?.advance_date || '').slice(0, 10) }} fullWidth />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setApplyAdv(null)} disabled={applySaving}>Cancel</Button>
          <Button variant="contained" onClick={saveApply} disabled={applySaving || !pickedBill}>{applySaving ? 'Applying…' : 'Apply advance'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SupplierAdvances;
