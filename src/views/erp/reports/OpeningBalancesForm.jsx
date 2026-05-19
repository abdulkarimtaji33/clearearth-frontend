import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconScale } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const OpeningBalancesForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [balances, setBalances] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getChartOfAccounts({});
      if (res.success) setAccounts((res.data || []).filter((a) => !a.is_group && a.is_active));
      else setError(res.message || 'Failed to load accounts');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setBalance = (id, val) => {
    setBalances((p) => ({ ...(p || {}), [id]: val }));
  };

  const totalDebit = accounts
    .filter((a) => a.normal_balance === 'debit')
    .reduce((sum, a) => sum + (parseFloat(balances[a.id]) || 0), 0);

  const totalCredit = accounts
    .filter((a) => a.normal_balance === 'credit')
    .reduce((sum, a) => sum + (parseFloat(balances[a.id]) || 0), 0);

  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01;

  const handleSubmit = async () => {
    if (!entryDate) { setError('Please select an opening date.'); return; }
    const lines = Object.entries(balances)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([accountId, amount]) => ({ accountId: parseInt(accountId, 10), amount: parseFloat(amount) }));
    if (lines.length === 0) { setError('Enter at least one opening balance.'); return; }

    setSaving(true);
    try {
      const res = await apiService.postOpeningBalances({ entryDate, balances: lines });
      if (res.success) {
        setMsg('Opening balances posted successfully. You can now run reports.');
        setBalances({});
      } else {
        setError(res.message || 'Failed to post opening balances');
      }
    } finally {
      setSaving(false);
    }
  };

  const groups = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  const grouped = groups.reduce((acc, t) => {
    acc[t] = accounts.filter((a) => a.type === t);
    return acc;
  }, {});

  return (
    <PageContainer title="Opening Balances" description="Enter starting balances to initialize accounting records">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/journal')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconScale size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Opening Balances</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography fontWeight={600}>Opening Date:</Typography>
          <TextField type="date" size="small" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
          <Typography variant="caption" color="text.secondary">
            This is the date as of which you are bringing in the starting balances (typically start of current fiscal year).
          </Typography>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : (
        <>
          <Stack spacing={2} mb={3}>
            {groups.map((type) => (grouped[type] || []).length === 0 ? null : (
              <Paper key={type} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>{type} Accounts</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Normal Balance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Opening Balance (AED)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grouped[type].map((acc) => (
                        <TableRow key={acc.id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{acc.normal_balance}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                              value={balances[acc.id] || ''}
                              onChange={(e) => setBalance(acc.id, e.target.value)}
                              sx={{ width: 160 }}
                              placeholder="0.00"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 3, borderColor: isBalanced ? 'success.main' : 'error.main' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Debits (Assets + Expenses)</Typography>
                  <Typography variant="h6" fontWeight={700}>AED {fmt(totalDebit)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Credits (Liabilities + Equity + Revenue)</Typography>
                  <Typography variant="h6" fontWeight={700}>AED {fmt(totalCredit)}</Typography>
                </Box>
              </Stack>
              {isBalanced
                ? <Alert severity="success" sx={{ py: 0.5 }}>Balanced — ready to post</Alert>
                : <Alert severity="warning" sx={{ py: 0.5 }}>Difference: AED {fmt(diff)} — the system will plug this to Retained Earnings</Alert>}
            </Stack>
          </Paper>

          <Button variant="contained" size="large" onClick={handleSubmit} disabled={saving || !entryDate} sx={{ borderRadius: 2 }}>
            {saving ? 'Posting…' : 'Post Opening Balances'}
          </Button>
        </>
      )}
    </PageContainer>
  );
};

export default OpeningBalancesForm;
