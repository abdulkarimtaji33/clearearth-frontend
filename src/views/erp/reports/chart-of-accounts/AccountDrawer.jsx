import React, { useEffect, useState } from 'react';
import {
  Box, Breadcrumbs, Button, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Typography,
} from '@mui/material';
import { IconX, IconPlus, IconEdit, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import GlAmountLink from '../../../../components/erp/GlAmountLink';
import apiService from '../../../../services/api';
import { TYPE_META, pathTo, subTypeLabel, fmtMoney } from './coaUtils';

const Stat = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</Typography>
    <Typography variant="body2" fontWeight={700}>{children}</Typography>
  </Box>
);

/** Right-hand detail panel for one account. */
const AccountDrawer = ({ account, accounts, byId, onClose, onOpen, onAddSub, onEdit, onToggleActive }) => {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    setUsage(null);
    if (!account) return;
    apiService.getChartAccountUsage(account.id).then((r) => setUsage(r.data)).catch(() => setUsage(null));
  }, [account]);

  if (!account) return null;
  const meta = TYPE_META[account.type];
  const trail = pathTo(account, byId);
  const kids = accounts.filter((a) => a.parent_id === account.id).sort((x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true }));
  const balance = account.is_group ? account.rollup_balance : account.balance;

  return (
    <Drawer anchor="right" open={!!account} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>Account</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            <span style={{ fontFamily: 'monospace' }}>{account.code}</span> {account.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </Stack>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        <Chip size="small" label={meta?.one} color={meta?.color} />
        <Chip size="small" label={account.is_group ? 'Group (holds sub-accounts)' : 'Posting account'} color={account.is_group ? 'warning' : 'default'} variant="outlined" />
        <Chip size="small" label={account.is_active ? 'Active' : 'Inactive'} color={account.is_active ? 'success' : 'default'} />
        {account.is_system && <Chip size="small" label="System account" variant="outlined" />}
      </Stack>

      <Breadcrumbs separator="›" sx={{ mb: 2, fontSize: '0.8rem' }}>
        <Typography variant="caption" color="text.secondary">{meta?.label}</Typography>
        {trail.map((a) => (
          a.id === account.id
            ? <Typography key={a.id} variant="caption" fontWeight={700}>{a.code} {a.name}</Typography>
            : <Typography key={a.id} variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => onOpen(a)}>{a.code} {a.name}</Typography>
        ))}
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <Stat label={account.is_group ? 'Total of this group (AED)' : 'Balance (AED)'}>
          {account.is_group || balance == null
            ? fmtMoney(balance)
            : <GlAmountLink accountId={account.id} title="View postings that make up this balance">{fmtMoney(balance)}</GlAmountLink>}
        </Stat>
        <Stat label="Normal balance">{account.normal_balance === 'debit' ? 'Debit' : 'Credit'}</Stat>
        <Stat label="Sub-type">{subTypeLabel(account.sub_type)}</Stat>
        <Stat label="Postings">{account.line_count ?? usage?.lineCount ?? 0}</Stat>
        <Stat label="Last posting">{account.last_posted_at ? String(account.last_posted_at).slice(0, 10) : '—'}</Stat>
        <Stat label="Sub-accounts">{kids.length}</Stat>
      </Box>

      {account.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{account.description}</Typography>
      )}

      {usage?.expenseCategories?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Default account for these expense categories</Typography>
          <Stack direction="row" spacing={0.75} mt={0.5} flexWrap="wrap" useFlexGap>
            {usage.expenseCategories.map((c) => <Chip key={c.id} size="small" label={c.name} variant="outlined" />)}
          </Stack>
        </Box>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={800}>Sub-accounts</Typography>
        <Button size="small" startIcon={<IconPlus size={14} />} onClick={() => onAddSub(account)} disabled={!account.is_active}>Add sub-account</Button>
      </Stack>
      {kids.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No sub-accounts yet.</Typography>
      ) : (
        <List dense disablePadding sx={{ mb: 1 }}>
          {kids.map((k) => (
            <ListItemButton key={k.id} onClick={() => onOpen(k)} sx={{ borderRadius: 2 }}>
              <ListItemText
                primary={<><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{k.code}</span>&nbsp;{k.name}</>}
                secondary={`${k.is_group ? 'Group' : 'Posting'}${k.is_active ? '' : ' · inactive'}`}
              />
              <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{fmtMoney(k.is_group ? k.rollup_balance : k.balance)}</Typography>
            </ListItemButton>
          ))}
        </List>
      )}

      <Box sx={{ flex: 1 }} />
      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<IconEdit size={16} />} onClick={() => onEdit(account)} sx={{ borderRadius: 2 }}>Edit</Button>
        <Button
          variant="outlined"
          color={account.is_active ? 'error' : 'success'}
          startIcon={account.is_active ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          onClick={() => onToggleActive(account)}
          disabled={!!account.is_system && account.is_active}
          sx={{ borderRadius: 2 }}
        >
          {account.is_active ? 'Disable' : 'Re-activate'}
        </Button>
      </Stack>
    </Drawer>
  );
};

export default AccountDrawer;
