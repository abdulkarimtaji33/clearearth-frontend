import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment,
  MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, Typography, Checkbox,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowsExchange, IconArrowRight, IconPlus, IconSearch } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { filterCashBankAccounts, isPostable, overdrawInfo } from '../../../utils/accountTree';
import { localToday } from '../../../utils/dateLocal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const label = (a) => `${a.code} — ${a.name}`;

const Transfers = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accounts, setAccounts] = useState([]);

  const empty = () => ({ from: '', to: '', amount: '', date: localToday(), ref: '', notes: '' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [negativeOk, setNegativeOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const h = setTimeout(() => { setDebounced(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(h);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCashBankTransfers({ page: page + 1, pageSize, search: debounced || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.totalItems ?? (res.data || []).length);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debounced]);
  useEffect(() => { load(); }, [load]);

  const loadAccounts = () => apiService.getChartOfAccounts({ withBalance: true })
    .then((res) => setAccounts(Array.isArray(res.data) ? res.data : res.data?.items || [])).catch(() => {});
  useEffect(() => { loadAccounts(); }, []);

  const cashBank = useMemo(() => filterCashBankAccounts(accounts).filter(isPostable), [accounts]);
  const byId = (id) => cashBank.find((a) => String(a.id) === String(id));
  const amt = Math.round((parseFloat(form.amount) || 0) * 100) / 100;
  const overdraw = form.from && amt > 0 ? overdrawInfo(accounts, form.from, amt) : null;

  const save = async () => {
    if (!form.from) { setFormError('Choose the account the money leaves'); return; }
    if (!form.to) { setFormError('Choose the account the money goes to'); return; }
    if (form.from === form.to) { setFormError('The two accounts must be different'); return; }
    if (!(amt > 0)) { setFormError('Enter the amount to transfer'); return; }
    if (overdraw && !negativeOk) { setFormError('This transfer takes the account below zero. Tick "Transfer anyway" to continue.'); return; }
    try {
      setSaving(true); setFormError('');
      const res = await apiService.createCashBankTransfer({
        fromAccountId: parseInt(form.from, 10), toAccountId: parseInt(form.to, 10), amount: amt,
        transferDate: form.date, referenceNo: form.ref || undefined, notes: form.notes || undefined, confirmNegative: negativeOk || undefined,
      });
      setOpen(false);
      setSuccess(`Transfer ${res.data.transfer_number}: AED ${fmt(amt)} moved from ${byId(form.from) ? byId(form.from).name : 'one account'} to ${byId(form.to) ? byId(form.to).name : 'the other'}`);
      await Promise.all([load(), loadAccounts()]);
    } catch (e) {
      setFormError(e.message || 'Could not record the transfer');
    } finally {
      setSaving(false);
    }
  };

  const head = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' };

  return (
    <PageContainer title="Cash & bank transfers">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconArrowsExchange size={24} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>Cash & bank transfers</Typography>
          <Typography variant="body2" color="text.secondary">
            Move money between cash and bank accounts: cash to bank, bank to cash, or bank to bank. Not an income or an expense.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => { setForm(empty()); setNegativeOk(false); setFormError(''); setOpen(true); }} sx={{ borderRadius: 2, fontWeight: 700 }}>
          New transfer
        </Button>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, p: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Search by transfer number, reference or note…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography fontWeight={700}>No transfers yet</Typography>
            <Typography variant="body2" color="text.secondary">Banked the cash on hand, or moved money between banks? Record it here.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Transfer', 'Date', 'From', '', 'To', 'Reference', 'Note', 'Amount'].map((h, i) => (
                    <TableCell key={h || 'arrow'} align={i === 7 ? 'right' : 'left'} sx={head}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{t.transfer_number}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(t.transfer_date).slice(0, 10)}</TableCell>
                    <TableCell>{t.fromAccount ? label(t.fromAccount) : '—'}</TableCell>
                    <TableCell><IconArrowRight size={16} /></TableCell>
                    <TableCell>{t.toAccount ? label(t.toAccount) : '—'}</TableCell>
                    <TableCell>{t.reference_no || '—'}</TableCell>
                    <TableCell>{t.notes || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(t.amount)}</TableCell>
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

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New transfer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            The money leaves one account and arrives in the other on the same day. Totals do not change; only where the money sits.
          </Typography>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select required label="Transfer from" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} fullWidth>
              {cashBank.map((a) => <MenuItem key={a.id} value={String(a.id)} disabled={String(a.id) === form.to}>{label(a)}</MenuItem>)}
            </TextField>
            <TextField select required label="Transfer to" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} fullWidth>
              {cashBank.map((a) => <MenuItem key={a.id} value={String(a.id)} disabled={String(a.id) === form.from}>{label(a)}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField required type="number" label="Amount (AED)" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputProps={{ min: 0, step: 'any' }} fullWidth />
              <TextField required type="date" label="Date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            {overdraw && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                This takes {label(overdraw.account)} below zero (balance AED {overdraw.balance.toFixed(2)}, it would become {overdraw.after.toFixed(2)}).
                <Box><Checkbox size="small" checked={negativeOk} onChange={(e) => setNegativeOk(e.target.checked)} /> Transfer anyway</Box>
              </Alert>
            )}
            <TextField label="Reference (deposit slip, transfer ref…)" value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} fullWidth />
            <TextField multiline minRows={2} label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Record transfer'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Transfers;
