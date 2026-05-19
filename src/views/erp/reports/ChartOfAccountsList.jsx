import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconList, IconPlus, IconSeeding, IconEdit, IconTrash,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPE_COLOR = {
  asset: 'info', liability: 'warning', equity: 'secondary', revenue: 'success', expense: 'error',
};

const TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const SUB_TYPES = {
  asset: ['current_asset', 'fixed_asset', 'other_asset'],
  liability: ['current_liability', 'long_term_liability'],
  equity: [],
  revenue: ['operating_revenue', 'other_income'],
  expense: ['cost_of_revenue', 'operating_expense', 'finance_cost'],
};

const EMPTY_FORM = { code: '', name: '', type: 'asset', sub_type: '', normal_balance: 'debit', description: '' };

const ChartOfAccountsList = () => {
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getChartOfAccounts({ withBalance: true });
      if (res.success) setAccounts(asArray(res.data));
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    if (!window.confirm('Seed the default Chart of Accounts? This will add ~25 standard UAE accounts.')) return;
    const res = await apiService.seedChartOfAccounts();
    if (res.success) { setMsg('Chart of Accounts seeded successfully.'); load(); }
    else setError(res.message || 'Seed failed');
  };

  const openCreate = () => {
    setEditAccount(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (acc) => {
    setEditAccount(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, sub_type: acc.sub_type || '', normal_balance: acc.normal_balance, description: acc.description || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = editAccount
        ? await apiService.updateChartOfAccount(editAccount.id, form)
        : await apiService.createChartOfAccount(form);
      if (res.success) {
        setDialogOpen(false);
        load();
      } else {
        setError(res.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Disable this account? It cannot be deleted if it has transactions.')) return;
    const res = await apiService.deleteChartOfAccount(id);
    if (res.success) { setMsg('Account disabled.'); load(); }
    else setError(res.message || 'Failed');
  };

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const subTypeOptions = SUB_TYPES[form.type] || [];

  const grouped = TYPES.reduce((acc, t) => {
    acc[t] = accounts.filter((a) => a.type === t);
    return acc;
  }, {});

  return (
    <PageContainer title="Chart of Accounts" description="Master list of all accounting accounts">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconList size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Chart of Accounts</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<IconSeeding size={18} />} onClick={handleSeed} sx={{ borderRadius: 2 }}>
            Seed Defaults
          </Button>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate} sx={{ borderRadius: 2 }}>
            Add Account
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          {TYPES.map((type) => (
            <Paper key={type} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip label={type.toUpperCase()} size="small" color={TYPE_COLOR[type]} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                    {type} Accounts ({grouped[type]?.length || 0})
                  </Typography>
                </Stack>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Code', 'Name', 'Sub-type', 'Normal Balance', 'Balance (AED)', 'Status', ''].map((h) => (
                        <TableCell key={h} align={h === 'Balance (AED)' ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(grouped[type] || []).length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><Typography variant="caption" color="text.secondary">No {type} accounts</Typography></TableCell></TableRow>
                    ) : (grouped[type] || []).map((acc) => (
                      <TableRow key={acc.id} sx={{ bgcolor: acc.is_group ? alpha(theme.palette.grey[500], 0.04) : 'inherit' }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{acc.code}</TableCell>
                        <TableCell sx={{ fontWeight: acc.is_group ? 700 : 400 }}>{acc.is_group ? `[${acc.name}]` : acc.name}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{acc.sub_type || '—'}</Typography></TableCell>
                        <TableCell><Chip label={acc.normal_balance} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {acc.balance != null ? fmt(acc.balance) : '—'}
                        </TableCell>
                        <TableCell>
                          {!acc.is_active
                            ? <Chip label="Inactive" size="small" color="default" />
                            : <Chip label="Active" size="small" color="success" />}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit">
                              <span>
                                <IconButton size="small" onClick={() => openEdit(acc)} disabled={!!acc.is_system && acc.is_group}>
                                  <IconEdit size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={acc.is_system ? 'System account — cannot delete' : 'Disable'}>
                              <span>
                                <IconButton size="small" color="error" onClick={() => handleDelete(acc.id)} disabled={!!acc.is_system}>
                                  <IconTrash size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Account Code" value={form.code} onChange={setField('code')} fullWidth disabled={editAccount?.is_system} />
            <TextField label="Account Name" value={form.name} onChange={setField('name')} fullWidth />
            <TextField select label="Type" value={form.type} onChange={setField('type')} fullWidth disabled={editAccount?.is_system}>
              {TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Sub-type" value={form.sub_type} onChange={setField('sub_type')} fullWidth>
              <MenuItem value="">— None —</MenuItem>
              {subTypeOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Normal Balance" value={form.normal_balance} onChange={setField('normal_balance')} fullWidth disabled={editAccount?.is_system}>
              <MenuItem value="debit">Debit</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </TextField>
            <TextField label="Description" value={form.description} onChange={setField('description')} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ChartOfAccountsList;
