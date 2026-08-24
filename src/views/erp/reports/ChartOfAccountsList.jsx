import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Checkbox, FormControlLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconList, IconPlus, IconSeeding, IconEdit, IconTrash, IconCornerDownRight,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import GlAmountLink from '../../../components/erp/GlAmountLink';
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

const EMPTY_FORM = {
  code: '', name: '', type: 'asset', subType: '', normalBalance: 'debit',
  description: '', parentId: '', isGroup: false,
};

/** Build a code-ordered forest of {account, children[]} nodes from a flat list of one `type`. */
function buildTree(list) {
  const byId = {};
  list.forEach((a) => { byId[a.id] = { account: a, children: [] }; });
  const roots = [];
  list.forEach((a) => {
    const node = byId[a.id];
    if (a.parent_id != null && byId[a.parent_id]) {
      byId[a.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes) => {
    nodes.sort((x, y) => String(x.account.code).localeCompare(String(y.account.code)));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

/** Flatten a tree back into a depth-annotated row list for rendering. */
function flattenTree(nodes, depth = 0, out = []) {
  nodes.forEach((n) => {
    out.push({ ...n.account, __depth: depth });
    flattenTree(n.children, depth + 1, out);
  });
  return out;
}

/** All ids in the subtree rooted at `accountId` (inclusive) — used to exclude self/descendants from parent pickers. */
function descendantIds(accounts, accountId) {
  const ids = new Set([accountId]);
  let grew = true;
  while (grew) {
    grew = false;
    accounts.forEach((a) => {
      if (a.parent_id != null && ids.has(a.parent_id) && !ids.has(a.id)) {
        ids.add(a.id);
        grew = true;
      }
    });
  }
  return ids;
}

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

  const openCreate = (defaults = {}) => {
    setEditAccount(null);
    setForm({ ...EMPTY_FORM, ...defaults });
    setDialogOpen(true);
  };

  const openEdit = (acc) => {
    setEditAccount(acc);
    setForm({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subType: acc.sub_type || '',
      normalBalance: acc.normal_balance,
      description: acc.description || '',
      parentId: acc.parent_id != null ? String(acc.parent_id) : '',
      isGroup: !!acc.is_group,
    });
    setDialogOpen(true);
  };

  const openAddSubAccount = (parentAcc) => {
    setEditAccount(null);
    setForm({
      ...EMPTY_FORM,
      type: parentAcc.type,
      subType: parentAcc.sub_type || '',
      normalBalance: parentAcc.normal_balance,
      parentId: String(parentAcc.id),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        type: form.type,
        subType: form.subType || undefined,
        normalBalance: form.normalBalance,
        description: form.description || undefined,
        parentId: form.parentId ? parseInt(form.parentId, 10) : null,
        isGroup: !!form.isGroup,
      };
      const res = editAccount
        ? await apiService.updateChartOfAccount(editAccount.id, payload)
        : await apiService.createChartOfAccount(payload);
      if (res.success) {
        setDialogOpen(false);
        load();
      } else {
        setError(res.message || 'Save failed');
      }
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Disable this account? It cannot be deleted if it has transactions or sub-accounts.')) return;
    try {
      const res = await apiService.deleteChartOfAccount(id);
      if (res.success) { setMsg('Account disabled.'); load(); }
      else setError(res.message || 'Failed');
    } catch (e) {
      setError(e.message || 'Failed');
    }
  };

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const subTypeOptions = SUB_TYPES[form.type] || [];

  const grouped = TYPES.reduce((acc, t) => {
    acc[t] = accounts.filter((a) => a.type === t);
    return acc;
  }, {});

  // Valid parent choices for the account currently being edited: same type, not itself/its own descendants
  const parentOptions = useMemo(() => {
    const excluded = editAccount ? descendantIds(accounts, editAccount.id) : new Set();
    return accounts.filter((a) => a.type === form.type && !excluded.has(a.id));
  }, [accounts, form.type, editAccount]);

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
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => openCreate()} sx={{ borderRadius: 2 }}>
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
          {TYPES.map((type) => {
            const typeAccounts = grouped[type] || [];
            const rows = flattenTree(buildTree(typeAccounts));
            return (
              <Paper key={type} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label={type.toUpperCase()} size="small" color={TYPE_COLOR[type]} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                      {type} Accounts ({typeAccounts.length})
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
                      {rows.length === 0 ? (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><Typography variant="caption" color="text.secondary">No {type} accounts</Typography></TableCell></TableRow>
                      ) : rows.map((acc) => (
                        <TableRow key={acc.id} sx={{ bgcolor: acc.is_group ? alpha(theme.palette.grey[500], 0.04) : 'inherit' }}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{acc.code}</TableCell>
                          <TableCell sx={{ fontWeight: acc.is_group ? 700 : 400, pl: 2 + acc.__depth * 2.5 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {acc.__depth > 0 && <IconCornerDownRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />}
                              <span>{acc.is_group ? `[${acc.name}]` : acc.name}</span>
                            </Stack>
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{acc.sub_type || '—'}</Typography></TableCell>
                          <TableCell><Chip label={acc.normal_balance} size="small" variant="outlined" /></TableCell>
                          <TableCell align="right">
                            {acc.is_group
                              ? (acc.rollup_balance != null ? <strong style={{ fontFamily: 'monospace' }}>{fmt(acc.rollup_balance)}</strong> : '—')
                              : (acc.balance != null ? <GlAmountLink accountId={acc.id} title="View postings that make up this balance">{fmt(acc.balance)}</GlAmountLink> : '—')}
                          </TableCell>
                          <TableCell>
                            {!acc.is_active
                              ? <Chip label="Inactive" size="small" color="default" />
                              : <Chip label="Active" size="small" color="success" />}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {!acc.is_group && (
                                <Tooltip title="Add sub-account">
                                  <IconButton size="small" onClick={() => openAddSubAccount(acc)}>
                                    <IconPlus size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton size="small" onClick={() => openEdit(acc)}>
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
            );
          })}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Account Code" value={form.code} onChange={setField('code')} fullWidth disabled={editAccount?.is_system} />
            <TextField label="Account Name" value={form.name} onChange={setField('name')} fullWidth />
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, parentId: '' }))}
              fullWidth
              disabled={editAccount?.is_system}
            >
              {TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Sub-type" value={form.subType} onChange={setField('subType')} fullWidth>
              <MenuItem value="">— None —</MenuItem>
              {subTypeOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Normal Balance" value={form.normalBalance} onChange={setField('normalBalance')} fullWidth disabled={editAccount?.is_system}>
              <MenuItem value="debit">Debit</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </TextField>
            <TextField
              select
              label="Parent account"
              value={form.parentId}
              onChange={setField('parentId')}
              fullWidth
              helperText="Nest this account under another of the same type to make it a sub-account"
            >
              <MenuItem value="">— None (top level) —</MenuItem>
              {parentOptions.map((a) => (
                <MenuItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isGroup}
                  onChange={(e) => setForm((p) => ({ ...p, isGroup: e.target.checked }))}
                  disabled={!!editAccount?.is_system}
                />
              }
              label="Header / group account (not directly postable — holds sub-accounts only)"
            />
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
