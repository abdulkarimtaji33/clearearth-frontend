import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react';
import apiService from '../../../../services/api';
import { TYPES, TYPE_META, SUB_TYPES, subTypeLabel, descendantIds } from './coaUtils';

const Choice = ({ selected, title, hint, onClick }) => {
  const theme = useTheme();
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      sx={{
        flex: 1, cursor: 'pointer', p: 1.75, borderRadius: 2.5, border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        {selected ? <IconCircleCheck size={20} color={theme.palette.primary.main} /> : <IconCircleDashed size={20} color={theme.palette.text.disabled} />}
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        </Box>
      </Stack>
    </Box>
  );
};

const accLabel = (a) => `${a.code} — ${a.name}`;

/** Guided add (sub-account or top-level) and simple edit. */
const AccountDialog = ({ open, mode, account, defaults, accounts, onClose, onSaved }) => {
  const isEdit = mode === 'edit';
  const [kind, setKind] = useState('sub');
  const [parent, setParent] = useState(null);
  const [type, setType] = useState('expense');
  const [subType, setSubType] = useState('');
  const [normalBalance, setNormalBalance] = useState('debit');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeBasis, setCodeBasis] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSaving(false);
    setCodeTouched(false);
    setCodeBasis('');
    if (isEdit && account) {
      setKind(account.parent_id != null ? 'sub' : 'top');
      setParent(account.parent_id != null ? byId[account.parent_id] || null : null);
      setType(account.type);
      setSubType(account.sub_type || '');
      setNormalBalance(account.normal_balance);
      setCode(account.code);
      setName(account.name);
      setDescription(account.description || '');
      setIsGroup(!!account.is_group);
    } else {
      const p = defaults?.parentId != null ? byId[defaults.parentId] || null : null;
      setKind(p || !defaults?.type ? 'sub' : 'top');
      setParent(p);
      setType(p ? p.type : defaults?.type || 'expense');
      setSubType(p ? p.sub_type || '' : '');
      setNormalBalance(p ? p.normal_balance : TYPE_META[defaults?.type || 'expense'].normal);
      setCode('');
      setName('');
      setDescription('');
      setIsGroup(false);
    }
  }, [open, isEdit, account, defaults, byId]);

  // When the parent (or the top-level type) changes, inherit its settings and suggest the next code.
  useEffect(() => {
    if (!open || isEdit) return;
    if (kind === 'sub' && parent) {
      setType(parent.type);
      setSubType(parent.sub_type || '');
      setNormalBalance(parent.normal_balance);
    }
    if (kind === 'sub' && !parent) return;
    let alive = true;
    apiService
      .getNextAccountCode(kind === 'sub' ? { parentId: parent.id } : { type })
      .then((r) => {
        if (!alive) return;
        setCodeBasis(r.data?.basis || '');
        if (!codeTouched) setCode(r.data?.code || '');
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, kind, parent, type]);

  const parentOptions = useMemo(() => {
    const blocked = isEdit && account ? descendantIds(accounts, account.id) : new Set();
    return accounts
      .filter((a) => a.is_active && !blocked.has(a.id) && (!isEdit || a.type === account.type))
      .sort((x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true }));
  }, [accounts, isEdit, account]);

  const codeTaken = !isEdit && code.trim() !== '' && accounts.some((a) => String(a.code).toLowerCase() === code.trim().toLowerCase());
  const ready = isEdit
    ? name.trim() !== ''
    : name.trim() !== '' && code.trim() !== '' && !codeTaken && (kind === 'top' || !!parent);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      let res;
      if (isEdit) {
        res = await apiService.updateChartOfAccount(account.id, {
          name: name.trim(),
          subType: subType || null,
          description: description.trim() || null,
          parentId: parent ? parent.id : null,
          isGroup,
        });
      } else {
        res = await apiService.createChartOfAccount({
          code: code.trim(),
          name: name.trim(),
          type,
          subType: subType || undefined,
          normalBalance,
          description: description.trim() || undefined,
          parentId: kind === 'sub' && parent ? parent.id : null,
          isGroup,
        });
      }
      if (res.success === false) throw new Error(res.message || 'Save failed');
      onSaved(isEdit ? `Account ${code} updated.` : `Account ${code.trim()} — ${name.trim()} created.`);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const preview = (() => {
    if (!name.trim()) return 'Fill in the name to see where it will appear.';
    const what = isGroup ? 'a group (holds sub-accounts, cannot be posted to)' : 'a posting account (journal entries can use it)';
    if (kind === 'sub' && parent) return `“${name.trim()}” will appear under ${accLabel(parent)} as ${what}.`;
    return `“${name.trim()}” will be a new top-level ${TYPE_META[type].one.toLowerCase()} account, ${what}.`;
  })();

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontWeight={800}>{isEdit ? `Edit ${account?.code} ${account?.name}` : 'Add an account'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {isEdit ? 'The code and type cannot be changed once an account exists.' : 'Most accounts are sub-accounts under an existing group. Pick where it belongs and we fill in the rest.'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Stack spacing={2.5}>
          {!isEdit && (
            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>1. What are you adding?</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Choice selected={kind === 'sub'} title="A sub-account" hint="Sits under an existing account (recommended)" onClick={() => setKind('sub')} />
                <Choice selected={kind === 'top'} title="A new top-level account" hint="Starts its own branch of the chart" onClick={() => { setKind('top'); setParent(null); }} />
              </Stack>
            </Box>
          )}

          {kind === 'sub' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>{isEdit ? 'Parent account' : '2. Where does it belong?'}</Typography>
              <Autocomplete
                options={parentOptions}
                value={parent}
                onChange={(_, v) => { setParent(v); setCodeTouched(false); }}
                groupBy={(a) => TYPE_META[a.type]?.label || a.type}
                getOptionLabel={accLabel}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderOption={(props, a) => (
                  <li {...props} key={a.id}>
                    <Box sx={{ pl: a.parent_id != null ? 2 : 0 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.code}</span>&nbsp;{a.name}
                      {a.is_group && <Chip size="small" label="group" sx={{ ml: 1, height: 18 }} />}
                    </Box>
                  </li>
                )}
                renderInput={(p) => <TextField {...p} size="small" label="Search parent by code or name" />}
              />
            </Box>
          )}

          {!isEdit && kind === 'top' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>2. What type is it?</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {TYPES.map((t) => (
                  <Chip
                    key={t}
                    label={TYPE_META[t].one}
                    color={type === t ? TYPE_META[t].color : 'default'}
                    variant={type === t ? 'filled' : 'outlined'}
                    onClick={() => { setType(t); setNormalBalance(TYPE_META[t].normal); setSubType(''); setCodeTouched(false); }}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>{isEdit ? 'Details' : '3. Name and code'}</Typography>
            <Stack spacing={1.5}>
              <TextField label="Account name" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth autoFocus={isEdit} />
              <TextField
                label="Account code"
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeTouched(true); }}
                size="small"
                fullWidth
                disabled={isEdit}
                error={codeTaken}
                helperText={
                  codeTaken
                    ? 'This code is already used — pick another one'
                    : !isEdit && codeBasis
                      ? `Suggested: ${codeBasis}. You can change it.`
                      : undefined
                }
              />
              <TextField select label="Sub-type" value={subType} onChange={(e) => setSubType(e.target.value)} size="small" fullWidth>
                <MenuItem value="">— None —</MenuItem>
                {(SUB_TYPES[type] || []).map((s) => <MenuItem key={s} value={s}>{subTypeLabel(s)}</MenuItem>)}
              </TextField>
              <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} size="small" fullWidth multiline minRows={2} />
              <FormControlLabel
                control={<Checkbox checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} disabled={!!account?.is_system} />}
                label={<Typography variant="body2">This is a <strong>group</strong>: it only holds sub-accounts and cannot be posted to</Typography>}
              />
            </Stack>
          </Box>

          <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
            <Typography variant="caption" fontWeight={800} color="primary">What will happen</Typography>
            <Typography variant="body2">{preview}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!ready || saving} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDialog;
