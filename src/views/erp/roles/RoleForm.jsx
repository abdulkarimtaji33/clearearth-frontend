import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconDeviceFloppy, IconHistory, IconLock, IconRestore, IconShieldLock, IconUserCog } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import PermissionMatrix from '../../../components/erp/access/PermissionMatrix';
import DataScopePanel from '../../../components/erp/access/DataScopePanel';
import FieldVisibilityPanel from '../../../components/erp/access/FieldVisibilityPanel';
import AccessDiffDialog from '../../../components/erp/access/AccessDiffDialog';
import UserAccessDialog from '../../../components/erp/access/UserAccessDialog';
import apiService from '../../../services/api';

export const ROLE_COLORS = ['#5D87FF', '#13DEB9', '#FFAE1F', '#FA896B', '#7C4DFF', '#00BCD4', '#E91E63', '#607D8B'];

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const normalizeName = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const formatDate = (d) => (d ? new Date(d).toLocaleString() : '');

const describeAudit = (row) => {
  const d = row.details || {};
  switch (row.action) {
    case 'role.access.update': {
      const parts = [];
      if (d.permissionsAdded?.length) parts.push(`+${d.permissionsAdded.length} permissions`);
      if (d.permissionsRemoved?.length) parts.push(`−${d.permissionsRemoved.length} permissions`);
      if (d.scopes && Object.keys(d.scopes).length) parts.push('data scope changed');
      if (d.fieldsHidden?.length || d.fieldsShown?.length) parts.push('field visibility changed');
      return parts.join(', ') || 'Access updated';
    }
    case 'role.create': return 'Role created';
    case 'role.clone': return 'Role cloned';
    case 'role.reset': return 'Restored to default access';
    case 'role.update': return 'Details updated';
    case 'role.delete': return 'Role deleted';
    default: return row.action;
  }
};

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [catalog, setCatalog] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('permissions');

  // editable state
  const [details, setDetails] = useState({ name: '', displayName: '', description: '', color: ROLE_COLORS[0] });
  const [selected, setSelected] = useState(new Set());
  const [scopes, setScopes] = useState({});
  const [hidden, setHidden] = useState([]);
  // snapshot of what is saved
  const [orig, setOrig] = useState({ details: { name: '', displayName: '', description: '', color: ROLE_COLORS[0] }, selected: new Set(), scopes: {}, hidden: [] });

  const [allRoles, setAllRoles] = useState([]);
  const [cloneFrom, setCloneFrom] = useState('');
  const [diffOpen, setDiffOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [accessUser, setAccessUser] = useState(null);

  const readOnly = Boolean(role?.isLocked);

  const applyRole = useCallback((r) => {
    const d = { name: r.name, displayName: r.display_name || r.name, description: r.description || '', color: r.color || ROLE_COLORS[0] };
    const sel = new Set(r.permissions || []);
    setRole(r);
    setDetails(d);
    setSelected(sel);
    setScopes(r.scopes || {});
    setHidden(r.hiddenFieldGroups || []);
    setOrig({ details: d, selected: new Set(sel), scopes: { ...(r.scopes || {}) }, hidden: [...(r.hiddenFieldGroups || [])] });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cat, rolesRes] = await Promise.all([apiService.getAccessCatalog(), apiService.getRoles({ pageSize: 200 })]);
      if (cat.success) setCatalog(cat.data);
      if (rolesRes.success) setAllRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      if (id) {
        const res = await apiService.getRole(id);
        if (res.success) applyRole(res.data);
      } else if (cat.success) {
        const defScopes = Object.fromEntries((cat.data.dataScopes || []).map((d) => [d.key, d.default]));
        setScopes(defScopes);
        setOrig((o) => ({ ...o, scopes: defScopes }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, applyRole]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isEdit) return;
    if (tab === 'users') apiService.getRoleUsers(id).then((r) => r.success && setUsers(r.data || [])).catch(() => {});
    if (tab === 'history') apiService.getAccessAudit({ targetType: 'role', targetId: id, pageSize: 50 }).then((r) => r.success && setAudit(r.data || [])).catch(() => {});
  }, [tab, id, isEdit]);

  // "Start from" a template when creating
  const handleCloneFrom = async (value) => {
    setCloneFrom(value);
    if (!value) {
      setSelected(new Set());
      setScopes(Object.fromEntries((catalog?.dataScopes || []).map((d) => [d.key, d.default])));
      setHidden([]);
      return;
    }
    try {
      const res = await apiService.getRole(value);
      if (res.success) {
        setSelected(new Set(res.data.permissions || []));
        setScopes(res.data.scopes || {});
        setHidden(res.data.hiddenFieldGroups || []);
      }
    } catch (err) {
      setError(err.message || 'Could not load that role');
    }
  };

  const labelOf = useMemo(() => {
    const m = {};
    (catalog?.modules || []).forEach((mod) => mod.permissions.forEach((p) => { m[p.name] = `${mod.label}: ${p.label}`; }));
    return m;
  }, [catalog]);

  const diff = useMemo(() => {
    const added = [...selected].filter((n) => !orig.selected.has(n)).map((n) => labelOf[n] || n);
    const removed = [...orig.selected].filter((n) => !selected.has(n)).map((n) => labelOf[n] || n);
    const scopeChanges = (catalog?.dataScopes || [])
      .filter((d) => (scopes[d.key] || d.default) !== (orig.scopes[d.key] || d.default))
      .map((d) => `${d.label}: ${orig.scopes[d.key] || d.default} → ${scopes[d.key] || d.default}`);
    const fieldChanges = (catalog?.fieldGroups || [])
      .filter((g) => hidden.includes(g.key) !== orig.hidden.includes(g.key))
      .map((g) => `${g.label}: ${hidden.includes(g.key) ? 'now hidden' : 'now visible'}`);
    const detailChanges = ['displayName', 'description', 'color'].filter((k) => (details[k] || '') !== (orig.details[k] || '')).map((k) => ({ displayName: 'Display name', description: 'Description', color: 'Colour' }[k]));
    return {
      added, removed, scopes: scopeChanges, fields: fieldChanges, details: detailChanges,
      total: added.length + removed.length + scopeChanges.length + fieldChanges.length + detailChanges.length,
    };
  }, [selected, scopes, hidden, details, orig, catalog, labelOf]);

  const dirty = isEdit ? diff.total > 0 : true;

  useEffect(() => {
    const handler = (e) => { if (isEdit && diff.total > 0) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEdit, diff.total]);

  const discard = () => {
    if (role) applyRole(role);
    setSuccess('');
  };

  const doSave = async () => {
    try {
      setSaving(true);
      setError('');
      const permissions = [...selected];
      if (!isEdit) {
        const name = normalizeName(details.name || details.displayName);
        if (!name) { setError('Please give the role a name'); setSaving(false); setDiffOpen(false); return; }
        const res = await apiService.createRole({
          name,
          displayName: details.displayName || details.name,
          description: details.description,
          color: details.color,
          permissions,
          scopes,
          hiddenFieldGroups: hidden,
        });
        if (res.success) {
          setSuccess('Role created');
          navigate(`/erp/roles/edit/${res.data.id}`, { replace: true });
        }
      } else {
        if (diff.details.length) {
          await apiService.updateRole(id, { displayName: details.displayName, description: details.description, color: details.color });
        }
        if (diff.added.length || diff.removed.length || diff.scopes.length || diff.fields.length) {
          await apiService.saveRoleAccess(id, { permissions, scopes, hiddenFieldGroups: hidden });
        }
        const fresh = await apiService.getRole(id);
        if (fresh.success) applyRole(fresh.data);
        setSuccess('Saved — changes are live for everyone with this role');
      }
      setDiffOpen(false);
    } catch (err) {
      setError(err.message || 'Save failed');
      setDiffOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onSaveClick = () => {
    if (!isEdit) {
      if (!details.displayName.trim() && !details.name.trim()) { setError('Please give the role a name'); return; }
      doSave();
      return;
    }
    setDiffOpen(true);
  };

  const doReset = async () => {
    try {
      setSaving(true);
      const res = await apiService.resetRole(id);
      if (res.success) { applyRole(res.data); setSuccess('Role restored to its default access'); }
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setSaving(false);
      setResetOpen(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  const title = isEdit ? details.displayName || 'Edit role' : 'Create role';

  return (
    <PageContainer title={title} description="Roles and permissions">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/roles')} size="small">Roles</Button>
        </Stack>

        {/* Header */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: details.color, width: 48, height: 48 }}>
              {readOnly ? <IconLock size={24} /> : <IconShieldLock size={24} />}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>{title}</Typography>
              <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" useFlexGap>
                {role && <Chip size="small" label={role.is_system_role ? 'System role' : 'Custom role'} color={role.is_system_role ? 'primary' : 'default'} variant="outlined" />}
                {role?.isCustomized && <Chip size="small" label="Customised from default" color="warning" variant="outlined" />}
                {role && <Chip size="small" label={`${role.userCount} user${role.userCount === 1 ? '' : 's'}`} variant="outlined" />}
                <Chip size="small" label={`${selected.size} permissions`} variant="outlined" />
              </Stack>
            </Box>
          </Stack>
        </Stack>

        {readOnly && <Alert severity="info" sx={{ mb: 2 }}>The Super Admin role always has full access and cannot be restricted.</Alert>}
        {role?.is_system_role && !readOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a built-in role. You can customise it freely{role.canReset ? ' and use “Reset to default” to restore the original access at any time' : ''}.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Details */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {!isEdit && (
                <TextField label="Role name" size="small" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  helperText="Short identifier, e.g. site_supervisor" sx={{ minWidth: 220 }} />
              )}
              <TextField label="Display name" size="small" value={details.displayName} onChange={(e) => setDetails({ ...details, displayName: e.target.value })}
                disabled={readOnly} sx={{ minWidth: 240 }} />
              <TextField label="Description" size="small" fullWidth value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })}
                disabled={readOnly} placeholder="What is this role for?" />
              {!isEdit && (
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>Start from</InputLabel>
                  <Select label="Start from" value={cloneFrom} onChange={(e) => handleCloneFrom(e.target.value)}>
                    <MenuItem value="">Blank (no permissions)</MenuItem>
                    {allRoles.map((r) => <MenuItem key={r.id} value={r.id}>Copy of {r.display_name || r.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mt={2}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Colour</Typography>
              {ROLE_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => !readOnly && setDetails({ ...details, color: c })}
                  sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: readOnly ? 'default' : 'pointer', border: '2px solid', borderColor: details.color === c ? 'text.primary' : 'transparent' }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}>
            <Tab value="permissions" label="Permissions" />
            <Tab value="scope" label="Data scope" />
            <Tab value="fields" label="Field visibility" />
            {isEdit && <Tab value="users" label={`Users${role ? ` (${role.userCount})` : ''}`} />}
            {isEdit && <Tab value="history" label="History" icon={<IconHistory size={16} />} iconPosition="start" />}
          </Tabs>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tab === 'permissions' && <PermissionMatrix catalog={catalog} selected={selected} original={isEdit ? orig.selected : null} onChange={setSelected} readOnly={readOnly} />}
            {tab === 'scope' && <DataScopePanel catalog={catalog} scopes={scopes} onChange={setScopes} readOnly={readOnly} />}
            {tab === 'fields' && <FieldVisibilityPanel catalog={catalog} hidden={hidden} onChange={setHidden} readOnly={readOnly} />}
            {tab === 'users' && (
              users.length === 0 ? (
                <Typography color="text.secondary">No users have this role yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {users.map((u) => (
                    <Stack key={u.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: details.color }}>{(u.first_name || '?').charAt(0)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600} noWrap>{`${u.first_name} ${u.last_name}`}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                      </Box>
                      <Chip size="small" label={u.status} variant="outlined" color={u.status === 'active' ? 'success' : 'default'} />
                      {u.overrideCount > 0 && <Chip size="small" color="warning" label={`${u.overrideCount} override${u.overrideCount === 1 ? '' : 's'}`} />}
                      <Button size="small" startIcon={<IconUserCog size={16} />} onClick={() => setAccessUser(u)}>Manage access</Button>
                    </Stack>
                  ))}
                </Stack>
              )
            )}
            {tab === 'history' && (
              audit.length === 0 ? (
                <Typography color="text.secondary">No changes recorded yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {audit.map((a) => (
                    <Box key={a.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{describeAudit(a)}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.actor_name || 'System'} · {formatDate(a.created_at)}</Typography>
                      {a.details?.permissionsAdded?.length > 0 && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>+ {a.details.permissionsAdded.map((n) => labelOf[n] || n).join(', ')}</Typography>
                      )}
                      {a.details?.permissionsRemoved?.length > 0 && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>− {a.details.permissionsRemoved.map((n) => labelOf[n] || n).join(', ')}</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )
            )}
          </Box>
        </Paper>

        {/* Sticky action bar */}
        {!readOnly && (
          <Paper
            elevation={6}
            sx={{
              position: 'sticky', bottom: 12, mt: 2, p: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5,
              flexWrap: 'wrap', border: '1px solid', borderColor: dirty && isEdit ? 'warning.main' : 'divider', zIndex: 5,
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, minWidth: 180 }} color={dirty && isEdit ? 'warning.main' : 'text.secondary'}>
              {isEdit ? (diff.total ? `${diff.total} unsaved change${diff.total === 1 ? '' : 's'}` : 'All changes saved') : 'New role — configure access, then create'}
            </Typography>
            {isEdit && role?.canReset && (
              <Button color="inherit" startIcon={<IconRestore size={18} />} onClick={() => setResetOpen(true)} disabled={saving}>Reset to default</Button>
            )}
            {isEdit && <Button color="inherit" onClick={discard} disabled={saving || diff.total === 0}>Discard</Button>}
            <Button variant="contained" startIcon={<IconDeviceFloppy size={18} />} onClick={onSaveClick} disabled={saving || (isEdit && diff.total === 0)} sx={{ borderRadius: 2 }}>
              {isEdit ? 'Review & save' : 'Create role'}
            </Button>
          </Paper>
        )}
      </Box>

      <AccessDiffDialog open={diffOpen} onClose={() => setDiffOpen(false)} onConfirm={doSave} saving={saving} diff={diff} roleName={details.displayName} affectedUsers={role?.userCount || 0} />

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset “{details.displayName}” to default?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All permissions, data scopes and field rules of this role go back to the original built-in settings. Any customisation will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={doReset} disabled={saving}>Reset to default</Button>
        </DialogActions>
      </Dialog>

      {accessUser && (
        <UserAccessDialog open userId={accessUser.id} onClose={(changed) => { setAccessUser(null); if (changed && tab === 'users') apiService.getRoleUsers(id).then((r) => r.success && setUsers(r.data || [])); }} />
      )}
    </PageContainer>
  );
};

export default RoleForm;
