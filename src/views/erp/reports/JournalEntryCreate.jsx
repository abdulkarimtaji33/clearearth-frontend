import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, TextField, MenuItem,
  IconButton, Checkbox, FormControlLabel, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconPlus, IconTrash, IconBook2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import SelectWithAddNew from '../../../components/erp/SelectWithAddNew';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';
import {
  PAID_TO_OPTIONS,
  PAID_TO_STORAGE_KEY,
  RECEIVED_FROM_OPTIONS,
  RECEIVED_FROM_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../../constants/expenseFormOptions';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EMPTY_LINE = { accountId: '', debit: '', credit: '', description: '' };

const JournalEntryCreate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [autoReverse, setAutoReverse] = useState(false);
  const [reverseDate, setReverseDate] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [customPaidTo, setCustomPaidTo] = useState(() => loadStoredOptions(PAID_TO_STORAGE_KEY));
  const [customReceivedFrom, setCustomReceivedFrom] = useState(() => loadStoredOptions(RECEIVED_FROM_STORAGE_KEY));

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) setAccounts(asArray(res.data).filter((a) => !a.is_group && a.is_active));
    });
  }, []);

  const paidToOptions = useMemo(
    () => mergeSelectOptions(PAID_TO_OPTIONS, customPaidTo, paidTo),
    [customPaidTo, paidTo]
  );
  const receivedFromOptions = useMemo(
    () => mergeSelectOptions(RECEIVED_FROM_OPTIONS, customReceivedFrom, receivedFrom),
    [customReceivedFrom, receivedFrom]
  );

  const addCustomPaidTo = useCallback((v) => {
    setCustomPaidTo((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAID_TO_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const addCustomReceivedFrom = useCallback((v) => {
    setCustomReceivedFrom((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(RECEIVED_FROM_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setLine = (i, k, v) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => setLines((p) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01;

  const handleSubmit = async () => {
    if (!entryDate) { setError('Entry date is required.'); return; }
    if (!description) { setError('Description is required.'); return; }
    if (!isBalanced) { setError(`Entry must balance. Current difference: AED ${fmt(diff)}`); return; }
    const validLines = lines.filter((l) => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (validLines.length < 2) { setError('At least 2 lines are required.'); return; }

    setSaving(true);
    try {
      const payload = {
        entryDate,
        description,
        paidTo: paidTo || undefined,
        receivedFrom: receivedFrom || undefined,
        autoReverse,
        reverseDate: autoReverse ? reverseDate : undefined,
        lines: validLines.map((l) => ({
          accountId: parseInt(l.accountId, 10),
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || undefined,
        })),
      };
      const res = await apiService.createJournalEntry(payload);
      if (res.success) {
        navigate(`/erp/journal/view/${res.data.id}`);
      } else {
        setError(res.message || 'Failed to create entry');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="New Journal Entry" description="Create a manual double-entry journal entry">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/journal')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBook2 size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>New Journal Entry</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={2}>Entry details</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <TextField label="Entry Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} required />
            <TextField label="Description / Memo" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ flex: 1, minWidth: 280 }} required />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Optional counterparty tags — shown in General Ledger and searchable there
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <SelectWithAddNew
                label="Paid to"
                value={paidTo}
                onChange={setPaidTo}
                options={paidToOptions}
                allowEmpty
                emptyLabel="None — outbound payment"
                addDialogTitle="Add payee"
                addFieldLabel="Payee name"
                onOptionAdded={addCustomPaidTo}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectWithAddNew
                label="Received from"
                value={receivedFrom}
                onChange={setReceivedFrom}
                options={receivedFromOptions}
                allowEmpty
                emptyLabel="None — inbound receipt"
                addDialogTitle="Add payer"
                addFieldLabel="Payer name"
                onOptionAdded={addCustomReceivedFrom}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={2} mt={2} alignItems="center">
            <FormControlLabel
              control={<Checkbox checked={autoReverse} onChange={(e) => setAutoReverse(e.target.checked)} />}
              label="Auto-reverse this entry"
            />
            {autoReverse && (
              <TextField label="Reverse Date" type="date" value={reverseDate} onChange={(e) => setReverseDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ width: 200 }} />
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={800}>Journal Lines (Debits must equal Credits)</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 280 }}>Account</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Line Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 160 }} align="right">Debit (AED)</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 160 }} align="right">Credit (AED)</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField select size="small" value={line.accountId} onChange={(e) => setLine(i, 'accountId', e.target.value)} fullWidth>
                        <MenuItem value="">— Select account —</MenuItem>
                        {accounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>{a.code} — {a.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={line.description} onChange={(e) => setLine(i, 'description', e.target.value)} fullWidth placeholder="Optional note…" />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" type="number" value={line.debit} onChange={(e) => { setLine(i, 'debit', e.target.value); if (e.target.value) setLine(i, 'credit', ''); }}
                        inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }} sx={{ width: 140 }} placeholder="0.00" />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" type="number" value={line.credit} onChange={(e) => { setLine(i, 'credit', e.target.value); if (e.target.value) setLine(i, 'debit', ''); }}
                        inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }} sx={{ width: 140 }} placeholder="0.00" />
                    </TableCell>
                    <TableCell>
                      {lines.length > 2 && (
                        <IconButton size="small" color="error" onClick={() => removeLine(i)}><IconTrash size={16} /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                    <Button size="small" startIcon={<IconPlus size={14} />} onClick={addLine}>Add Line</Button>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(totalDebit)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(totalCredit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {isBalanced && totalDebit > 0
              ? <Alert severity="success" sx={{ py: 0.5, borderRadius: 2 }}>Balanced — Debits = Credits = AED {fmt(totalDebit)}</Alert>
              : <Alert severity={totalDebit > 0 || totalCredit > 0 ? 'error' : 'info'} sx={{ py: 0.5, borderRadius: 2 }}>
                  {totalDebit === 0 && totalCredit === 0 ? 'Enter amounts above' : `Out of balance by AED ${fmt(diff)}`}
                </Alert>}
          </Box>
        </Paper>

        <Box>
          <Button variant="contained" size="large" onClick={handleSubmit} disabled={saving || !isBalanced || totalDebit === 0} sx={{ borderRadius: 2, mr: 1 }}>
            {saving ? 'Posting…' : 'Post Journal Entry'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/erp/journal')} sx={{ borderRadius: 2 }}>Cancel</Button>
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default JournalEntryCreate;
