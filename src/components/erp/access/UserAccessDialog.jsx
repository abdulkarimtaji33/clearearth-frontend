import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import PermissionMatrix from './PermissionMatrix';
import apiService from '../../../services/api';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/**
 * Manage one user's access on top of their role.
 * The matrix shows *effective* access; outlines mark where it differs from the role
 * (green = extra permission granted to this user, red = permission taken away).
 */
const UserAccessDialog = ({ open, userId, onClose }) => {
  const [data, setData] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [roleSet, setRoleSet] = useState(new Set());
  const [meta, setMeta] = useState({}); // name -> { reason, expiresAt }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [acc, cat] = await Promise.all([apiService.getUserAccess(userId), apiService.getAccessCatalog()]);
      if (acc.success) {
        setData(acc.data);
        setSelected(new Set(acc.data.permissions.filter((p) => p.granted).map((p) => p.name)));
        setRoleSet(new Set(acc.data.permissions.filter((p) => p.roleHas).map((p) => p.name)));
        setMeta(Object.fromEntries(acc.data.overrides.filter((o) => !o.expired).map((o) => [o.permission, { reason: o.reason || '', expiresAt: toDateInput(o.expiresAt) }])));
      }
      if (cat.success) setCatalog(cat.data);
    } catch (err) {
      setError(err.message || 'Failed to load access');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const labelOf = useMemo(() => {
    const m = {};
    (catalog?.modules || []).forEach((mod) => mod.permissions.forEach((p) => { m[p.name] = `${mod.label}: ${p.label}`; }));
    return m;
  }, [catalog]);

  const overrides = useMemo(() => {
    const list = [];
    (data?.permissions || []).forEach((p) => {
      const on = selected.has(p.name);
      if (on && !roleSet.has(p.name)) list.push({ permission: p.name, effect: 'grant' });
      if (!on && roleSet.has(p.name)) list.push({ permission: p.name, effect: 'revoke' });
    });
    return list;
  }, [data, selected, roleSet]);

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const payload = overrides.map((o) => ({
        ...o,
        reason: meta[o.permission]?.reason || null,
        expiresAt: meta[o.permission]?.expiresAt || null,
      }));
      const res = await apiService.saveUserAccessOverrides(userId, payload);
      if (res.success) {
        setChanged(true);
        onClose(true);
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setMetaField = (name, field, value) => setMeta((m) => ({ ...m, [name]: { ...(m[name] || {}), [field]: value } }));

  return (
    <Dialog open={open} onClose={() => onClose(changed)} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        {data ? (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={700}>{data.user.name}</Typography>
            <Chip size="small" label={`Role: ${data.user.role.display_name || data.user.role.name}`} color="primary" variant="outlined" />
            <Chip size="small" label={`${overrides.length} override${overrides.length === 1 ? '' : 's'}`} color={overrides.length ? 'warning' : 'default'} variant="outlined" />
          </Stack>
        ) : 'User access'}
        <IconButton onClick={() => onClose(changed)} sx={{ position: 'absolute', right: 12, top: 12 }}><IconX size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : data?.isSuperAdmin ? (
          <Alert severity="info">Super Admin always has full access — overrides don’t apply.</Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            <Alert severity="info" icon={false} sx={{ mb: 2 }}>
              Start from the role’s access and adjust for this person only. <b style={{ color: '#2e7d32' }}>Green outline</b> = extra permission just for this user,
              {' '}<b style={{ color: '#d32f2f' }}>red outline</b> = permission taken away. Changes to the role itself are made under Roles.
            </Alert>

            {overrides.length > 0 && (
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight={700}>Overrides for this user</Typography>
                  <Button size="small" color="inherit" onClick={() => setSelected(new Set(roleSet))}>Reset all to role</Button>
                </Stack>
                <Stack spacing={1.25}>
                  {overrides.map((o) => (
                    <Stack key={o.permission} direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                      <Chip size="small" color={o.effect === 'grant' ? 'success' : 'error'} label={o.effect === 'grant' ? 'Granted' : 'Revoked'} sx={{ width: 78 }} />
                      <Typography variant="body2" sx={{ minWidth: 220, flex: { md: 1 } }}>{labelOf[o.permission] || o.permission}</Typography>
                      <TextField size="small" placeholder="Reason (optional)" value={meta[o.permission]?.reason || ''} onChange={(e) => setMetaField(o.permission, 'reason', e.target.value)} sx={{ minWidth: 220 }} />
                      <TextField size="small" type="date" label="Expires" InputLabelProps={{ shrink: true }} value={meta[o.permission]?.expiresAt || ''} onChange={(e) => setMetaField(o.permission, 'expiresAt', e.target.value)} sx={{ width: 160 }} />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            <PermissionMatrix catalog={catalog} selected={selected} original={roleSet} onChange={setSelected} />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={() => onClose(changed)} color="inherit">Close</Button>
        {!data?.isSuperAdmin && (
          <Button variant="contained" onClick={save} disabled={saving || loading} startIcon={saving ? <CircularProgress size={16} /> : null}>
            Save user access
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserAccessDialog;
