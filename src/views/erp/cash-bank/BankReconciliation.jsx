import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert, Box, Button, Card, Checkbox, Chip, CircularProgress, MenuItem, Stack, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBuildingBank, IconFileImport, IconCheck } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { filterCashBankAccounts, isPostable } from '../../../utils/accountTree';
import { localToday } from '../../../utils/dateLocal';

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Split one CSV line, respecting double quotes. */
const splitCsv = (line) => {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i += 1; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
};
const num = (s) => { const v = parseFloat(String(s || '').replace(/[^0-9.\-()]/g, '').replace(/^\((.*)\)$/, '-$1')); return Number.isNaN(v) ? 0 : v; };
const toIso = (s) => {
  const t = String(s || '').trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
};

/** Statement rows from a bank CSV: needs a date and either one amount column or deposit/withdrawal columns. */
const parseStatementCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('The file has no rows');
  const head = splitCsv(lines[0]).map((h) => h.toLowerCase());
  const find = (...names) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const di = find('date');
  const ai = head.findIndex((h) => h === 'amount' || h.includes('amount'));
  const ci = find('credit', 'deposit', 'paid in', 'money in');
  const wi = find('debit', 'withdraw', 'paid out', 'money out');
  const desc = find('description', 'narration', 'details', 'particular', 'reference');
  if (di < 0 || (ai < 0 && ci < 0 && wi < 0)) throw new Error('Could not find a Date column and an Amount (or Credit / Debit) column in the first row');
  return lines.slice(1).map((l) => {
    const c = splitCsv(l);
    const amount = ai >= 0 && ci < 0 && wi < 0 ? num(c[ai]) : num(c[ci]) - Math.abs(num(c[wi]));
    return { date: toIso(c[di]), amount: round2(amount), description: desc >= 0 ? c[desc] : '' };
  }).filter((r) => r.date && Math.abs(r.amount) > 0);
};

const dayDiff = (a, b) => Math.abs((new Date(a) - new Date(b)) / 86400000);

const BankReconciliation = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [tab, setTab] = useState('reconcile');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [statementDate, setStatementDate] = useState(localToday());
  const [statementBalance, setStatementBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [ws, setWs] = useState(null);
  const [ticked, setTicked] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importInfo, setImportInfo] = useState('');
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiService.getChartOfAccounts({ withBalance: true }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setAccounts(filterCashBankAccounts(list).filter(isPostable));
    }).catch(() => {});
  }, []);

  const loadHistory = useCallback(() => apiService.getReconciliations().then((r) => setHistory(r.data || [])).catch(() => {}), []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const loadWorkspace = useCallback(async () => {
    if (!accountId) { setWs(null); return; }
    try {
      setLoading(true); setError('');
      const res = await apiService.getReconciliationWorkspace({ accountId, statementDate });
      setWs(res.data);
      const t = {};
      res.data.lines.forEach((l) => { if (l.ticked) t[l.id] = true; });
      setTicked(t);
      if (res.data.draft) {
        setStatementBalance(String(res.data.draft.statement_balance));
        setNotes(res.data.draft.notes || '');
      }
    } catch (e) {
      setError(e.message || 'Could not load the account');
    } finally {
      setLoading(false);
    }
  }, [accountId, statementDate]);
  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  const lines = ws?.lines || [];
  const tickedSum = useMemo(() => round2(lines.filter((l) => ticked[l.id]).reduce((s, l) => s + l.amount, 0)), [lines, ticked]);
  const cleared = round2((ws?.openingClearedBalance || 0) + tickedSum);
  const hasBalance = statementBalance !== '' && !Number.isNaN(Number(statementBalance));
  const difference = hasBalance ? round2(Number(statementBalance) - cleared) : null;
  const balanced = difference !== null && Math.abs(difference) < 0.01;
  const tickedCount = lines.filter((l) => ticked[l.id]).length;
  const shown = lines.filter((l) => (filter === 'ticked' ? ticked[l.id] : filter === 'open' ? !ticked[l.id] : true));

  const toggle = (id) => setTicked((t) => { const n = { ...t }; if (n[id]) delete n[id]; else n[id] = true; return n; });
  const toggleAll = (on) => setTicked(on ? Object.fromEntries(lines.map((l) => [l.id, true])) : {});

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = parseStatementCsv(await file.text());
      const used = new Set();
      const next = { ...ticked };
      let matched = 0;
      rows.forEach((r) => {
        const hit = lines
          .filter((l) => !used.has(l.id) && Math.abs(l.amount - r.amount) < 0.01 && dayDiff(l.date, r.date) <= 7)
          .sort((a, b) => dayDiff(a.date, r.date) - dayDiff(b.date, r.date))[0];
        if (hit) { used.add(hit.id); next[hit.id] = true; matched += 1; }
      });
      setTicked(next);
      setImportInfo(`${rows.length} statement rows read, ${matched} matched to ledger entries and ticked. ${rows.length - matched} could not be matched (not yet recorded in the books?).`);
    } catch (err) {
      setError(err.message || 'Could not read the CSV file');
    }
  };

  const save = async (complete) => {
    if (!hasBalance) { setError('Enter the closing balance shown on the bank statement'); return; }
    try {
      setSaving(true); setError('');
      const res = await apiService.saveReconciliation({
        id: ws?.draft?.id, accountId: parseInt(accountId, 10), statementDate, statementBalance: Number(statementBalance),
        lineIds: lines.filter((l) => ticked[l.id]).map((l) => l.id), notes: notes || undefined, complete,
      });
      if (complete) {
        setSuccess('Reconciliation completed. The ticked entries are now locked as reconciled.');
        await loadHistory();
        navigate(`/erp/bank-reconciliation/${res.data.id}`);
      } else {
        setSuccess(`Draft saved. Difference still to explain: AED ${fmt(res.data.difference)}`);
        await loadWorkspace(); await loadHistory();
      }
    } catch (e) {
      setError(e.message || 'Could not save the reconciliation');
    } finally {
      setSaving(false);
    }
  };

  const head = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' };
  const stat = (title, value, color) => (
    <Box sx={{ flex: 1, minWidth: 150, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette[color || 'primary'].main, 0.07) }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{title}</Typography>
      <Typography variant="h6" fontWeight={800}>{value}</Typography>
    </Box>
  );

  return (
    <PageContainer title="Bank reconciliation">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBuildingBank size={24} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>Bank reconciliation</Typography>
          <Typography variant="body2" color="text.secondary">Check your books against the bank statement. Tick what appears on the statement until the difference is zero.</Typography>
        </Box>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="reconcile" label="Reconcile" />
        <Tab value="history" label={`Saved reconciliations (${history.length})`} />
      </Tabs>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {tab === 'history' ? (
        <Card sx={{ borderRadius: 3, p: 2 }}>
          {history.length === 0 ? (
            <Box textAlign="center" py={5}><Typography fontWeight={700}>Nothing saved yet</Typography></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Statement date', 'Account', 'Statement balance', 'Cleared balance', 'Difference', 'Status'].map((h, i) => (
                      <TableCell key={h} align={i >= 2 && i <= 4 ? 'right' : 'left'} sx={head}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((r) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/bank-reconciliation/${r.id}`)}>
                      <TableCell>{String(r.statement_date).slice(0, 10)}</TableCell>
                      <TableCell>{r.account ? `${r.account.code} ${r.account.name}` : '—'}</TableCell>
                      <TableCell align="right">{fmt(r.statement_balance)}</TableCell>
                      <TableCell align="right">{fmt(r.cleared_balance)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: Math.abs(r.difference) < 0.01 ? 'success.main' : 'error.main' }}>{fmt(r.difference)}</TableCell>
                      <TableCell><Chip size="small" label={r.status === 'completed' ? 'Completed' : 'Draft'} color={r.status === 'completed' ? 'success' : 'warning'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      ) : (
        <>
          <Card sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>1. Which account and statement?</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField select size="small" label="Bank / cash account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setStatementBalance(''); setNotes(''); setImportInfo(''); }} sx={{ minWidth: 280 }}>
                {accounts.map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</MenuItem>)}
              </TextField>
              <TextField size="small" type="date" label="Statement date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField
                size="small" type="number" label="Closing balance on the statement" value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} sx={{ minWidth: 240 }}
              />
            </Stack>
            {ws?.lastCompleted && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Last completed reconciliation: statement of {ws.lastCompleted.statement_date}, balance AED {fmt(ws.lastCompleted.statement_balance)}.
              </Typography>
            )}
          </Card>

          {!accountId ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Choose the bank account you want to reconcile.</Alert>
          ) : loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : ws && (
            <>
              <Card sx={{ borderRadius: 3, p: 2.5, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>2. Tick the entries that appear on the statement</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={1.5}>
                  <Button size="small" variant="outlined" startIcon={<IconFileImport size={16} />} onClick={() => fileRef.current?.click()} sx={{ borderRadius: 2 }}>
                    Import statement CSV to auto-match
                  </Button>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
                  <Typography variant="caption" color="text.secondary">Needs a Date column and an Amount (or Credit / Debit) column. Matched by amount within 7 days.</Typography>
                </Stack>
                {importInfo && <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setImportInfo('')}>{importInfo}</Alert>}

                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap mb={2}>
                  {stat('Statement balance', hasBalance ? `AED ${fmt(statementBalance)}` : '—')}
                  {stat('Cleared (ticked) balance', `AED ${fmt(cleared)}`)}
                  {stat('Difference', difference === null ? '—' : `AED ${fmt(difference)}`, difference === null ? 'primary' : balanced ? 'success' : 'error')}
                  {stat('Book balance (ledger)', `AED ${fmt(ws.bookBalance)}`, 'info')}
                </Stack>

                <Stack direction="row" spacing={1} mb={1}>
                  {[['all', `All (${lines.length})`], ['ticked', `Ticked (${tickedCount})`], ['open', `Not ticked (${lines.length - tickedCount})`]].map(([k, l]) => (
                    <Chip key={k} label={l} clickable color={filter === k ? 'primary' : 'default'} variant={filter === k ? 'filled' : 'outlined'} onClick={() => setFilter(k)} />
                  ))}
                </Stack>

                {lines.length === 0 ? (
                  <Box textAlign="center" py={4}><Typography fontWeight={700}>Nothing to reconcile</Typography><Typography variant="body2" color="text.secondary">Every ledger entry up to this date is already reconciled.</Typography></Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 460 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox"><Checkbox size="small" checked={tickedCount === lines.length} indeterminate={tickedCount > 0 && tickedCount < lines.length} onChange={(e) => toggleAll(e.target.checked)} /></TableCell>
                          {['Date', 'Entry', 'Description', 'Money in', 'Money out'].map((h, i) => <TableCell key={h} align={i >= 3 ? 'right' : 'left'} sx={head}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shown.map((l) => (
                          <TableRow key={l.id} hover selected={!!ticked[l.id]} onClick={() => toggle(l.id)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding="checkbox"><Checkbox size="small" checked={!!ticked[l.id]} /></TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.date}</TableCell>
                            <TableCell>{l.entryNumber}</TableCell>
                            <TableCell>{l.description}</TableCell>
                            <TableCell align="right">{l.debit ? fmt(l.debit) : ''}</TableCell>
                            <TableCell align="right">{l.credit ? fmt(l.credit) : ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>

              <Card sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>3. Save</Typography>
                <TextField multiline minRows={2} fullWidth label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />
                {difference !== null && !balanced && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    The difference is <strong>AED {fmt(difference)}</strong>. Tick the missing entries, or check the closing balance you typed. You can save as a draft and come back.
                  </Alert>
                )}
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" onClick={() => save(false)} disabled={saving || !hasBalance} sx={{ borderRadius: 2 }}>Save as draft</Button>
                  <Button variant="contained" color="success" startIcon={<IconCheck size={18} />} onClick={() => save(true)} disabled={saving || !balanced} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {saving ? 'Saving…' : 'Complete reconciliation'}
                  </Button>
                </Stack>
              </Card>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default BankReconciliation;
