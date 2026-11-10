import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconList, IconPlus, IconSeeding, IconDownload } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';
import AccountFilters from './chart-of-accounts/AccountFilters';
import AccountTree from './chart-of-accounts/AccountTree';
import AccountDrawer from './chart-of-accounts/AccountDrawer';
import AccountDialog from './chart-of-accounts/AccountDialog';
import { DEFAULT_FILTERS, matchesFilters, toCsv } from './chart-of-accounts/coaUtils';

const STORE_KEY = 'coa_view_v1';

const loadStored = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return { filters: { ...DEFAULT_FILTERS, ...(raw.filters || {}), q: '' }, view: raw.view === 'flat' ? 'flat' : 'tree' };
  } catch {
    return { filters: { ...DEFAULT_FILTERS }, view: 'tree' };
  }
};

const ChartOfAccountsList = () => {
  const theme = useTheme();
  const stored = useMemo(loadStored, []);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [filters, setFilters] = useState(stored.filters);
  const [view, setView] = useState(stored.view);
  const [expanded, setExpanded] = useState(() => new Set());
  const [drawerId, setDrawerId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', account: null, defaults: null });
  const [confirm, setConfirm] = useState(null); // { title, text, action, label, color }

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

  // Remember filters (not the search text) and the view between visits.
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ filters: { ...filters, q: '' }, view })); } catch { /* storage unavailable */ }
  }, [filters, view]);

  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);
  const drawerAccount = drawerId != null ? byId[drawerId] || null : null;
  const matches = useMemo(() => accounts.filter((a) => matchesFilters(a, filters, byId)), [accounts, filters, byId]);
  const forceExpand = filters.q.trim() !== '' || filters.kind !== 'all' || filters.balance !== 'all';

  const openCreate = (defaults = null) => setDialog({ open: true, mode: 'create', account: null, defaults });
  const openAddSub = (acc) => setDialog({ open: true, mode: 'create', account: null, defaults: { parentId: acc.id } });
  const openEdit = (acc) => setDialog({ open: true, mode: 'edit', account: acc, defaults: null });

  const setActive = async (acc, active) => {
    try {
      const res = await apiService.updateChartOfAccount(acc.id, { isActive: active });
      if (res.success === false) throw new Error(res.message || 'Failed');
      setMsg(`${acc.code} ${acc.name} ${active ? 're-activated' : 'disabled'}.`);
      load();
    } catch (e) {
      setError(e.message || 'Failed');
    }
  };

  const askToggle = (acc) => {
    if (acc.is_active) {
      setConfirm({
        title: `Disable ${acc.code} ${acc.name}?`,
        text: 'It will stop appearing in account pickers. Existing postings stay as they are, and you can re-activate it any time.',
        label: 'Disable', color: 'error', action: () => setActive(acc, false),
      });
    } else {
      setActive(acc, true);
    }
  };

  const handleSeed = () => setConfirm({
    title: 'Seed the default chart of accounts?',
    text: 'This adds the standard UAE accounts (about 40). It only works when the chart is empty.',
    label: 'Seed defaults', color: 'primary',
    action: async () => {
      const res = await apiService.seedChartOfAccounts();
      if (res.success) { setMsg(res.data?.seeded === false ? 'Accounts already exist — nothing was added.' : 'Chart of accounts seeded.'); load(); }
      else setError(res.message || 'Seed failed');
    },
  });

  const exportCsv = () => {
    const rows = [...matches].sort((x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true }));
    const blob = new Blob([toCsv(rows, byId)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-of-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer title="Chart of Accounts" description="Master list of all accounting accounts">
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2.5}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconList size={24} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Chart of Accounts</Typography>
            <Typography variant="body2" color="text.secondary">
              {accounts.length} accounts · click any account for its details, or use + to add a sub-account
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          {accounts.length === 0 && !loading && (
            <Button variant="outlined" startIcon={<IconSeeding size={18} />} onClick={handleSeed} sx={{ borderRadius: 2 }}>Seed defaults</Button>
          )}
          <Button variant="outlined" startIcon={<IconDownload size={18} />} onClick={exportCsv} disabled={!matches.length} sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => openCreate()} sx={{ borderRadius: 2 }}>
            Add account
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : accounts.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No accounts yet. Use “Seed defaults” to start from the standard chart, or add your own.</Alert>
      ) : (
        <>
          <AccountFilters
            accounts={accounts}
            filters={filters}
            setFilters={setFilters}
            view={view}
            setView={setView}
            shown={matches.length}
            total={accounts.length}
            onExpandAll={() => setExpanded(new Set(accounts.filter((a) => a.child_count > 0).map((a) => a.id)))}
            onCollapseAll={() => setExpanded(new Set())}
          />
          <AccountTree
            accounts={accounts}
            byId={byId}
            filters={filters}
            view={view}
            expanded={expanded}
            setExpanded={setExpanded}
            forceExpand={forceExpand}
            onOpen={(a) => setDrawerId(a.id)}
            onAddSub={openAddSub}
            onEdit={openEdit}
            onToggleActive={askToggle}
          />
        </>
      )}

      <AccountDrawer
        account={drawerAccount}
        accounts={accounts}
        byId={byId}
        onClose={() => setDrawerId(null)}
        onOpen={(a) => setDrawerId(a.id)}
        onAddSub={openAddSub}
        onEdit={openEdit}
        onToggleActive={askToggle}
      />

      <AccountDialog
        open={dialog.open}
        mode={dialog.mode}
        account={dialog.account}
        defaults={dialog.defaults}
        accounts={accounts}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={(text) => { setDialog((d) => ({ ...d, open: false })); setMsg(text); load(); }}
      />

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{confirm?.title}</DialogTitle>
        <DialogContent><DialogContentText>{confirm?.text}</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" color={confirm?.color || 'primary'} onClick={() => { const a = confirm.action; setConfirm(null); a(); }}>
            {confirm?.label || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ChartOfAccountsList;
