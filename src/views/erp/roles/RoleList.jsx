import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconLock,
  IconPlus,
  IconRestore,
  IconSearch,
  IconShieldLock,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_COLORS } from './RoleForm';

const colorFor = (role, index) => role.color || ROLE_COLORS[index % ROLE_COLORS.length];

const RoleList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('roles.create');
  const canUpdate = hasPermission('roles.update');
  const canDelete = hasPermission('roles.delete');

  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPermissions, setTotalPermissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null); // 'delete' | 'clone' | 'reset'
  const [cloneName, setCloneName] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const [res, cat] = await Promise.all([apiService.getRoles({ pageSize: 200, search }), apiService.getAccessCatalog()]);
      if (res.success) {
        setRoles(Array.isArray(res.data) ? res.data : []);
        setTotal(res.pagination?.totalItems || 0);
      }
      if (cat.success) setTotalPermissions(cat.data.totalPermissions || 0);
    } catch (err) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchRoles, 250);
    return () => clearTimeout(t);
  }, [fetchRoles]);

  const systemRoles = useMemo(() => roles.filter((r) => r.is_system_role), [roles]);
  const customRoles = useMemo(() => roles.filter((r) => !r.is_system_role), [roles]);

  const openMenu = (e, role) => { setAnchorEl(e.currentTarget); setSelected(role); };
  const closeMenu = () => setAnchorEl(null);

  const run = async (fn, okMsg) => {
    try {
      setBusy(true);
      setError('');
      await fn();
      setSuccess(okMsg);
      setDialog(null);
      fetchRoles();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const renderCard = (role, i) => {
    const pct = totalPermissions ? Math.min(100, (role.permissionCount / totalPermissions) * 100) : 0;
    return (
      <Grid item xs={12} sm={6} lg={4} key={role.id}>
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', transition: 'box-shadow .15s', '&:hover': { boxShadow: 4 } }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ bgcolor: colorFor(role, i), width: 42, height: 42 }}>
                {role.isLocked ? <IconLock size={20} /> : <IconShieldLock size={20} />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>{role.display_name || role.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{role.name}</Typography>
              </Box>
              <IconButton size="small" onClick={(e) => openMenu(e, role)}><IconDotsVertical size={18} /></IconButton>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {role.description || 'No description'}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">Access</Typography>
                <Typography variant="caption" fontWeight={600}>{role.isLocked ? 'Full access' : `${role.permissionCount} / ${totalPermissions} permissions`}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={role.isLocked ? 100 : pct} sx={{ height: 6, borderRadius: 3 }} />
            </Box>

            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap sx={{ flex: 1, alignContent: 'flex-end' }}>
              <Chip size="small" icon={<IconUsers size={14} />} label={`${role.userCount} user${role.userCount === 1 ? '' : 's'}`} variant="outlined" />
              <Chip size="small" label={role.is_system_role ? 'System' : 'Custom'} color={role.is_system_role ? 'primary' : 'default'} variant="outlined" />
              {role.isCustomized && <Chip size="small" label="Customised" color="warning" variant="outlined" />}
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              startIcon={role.isLocked ? <IconLock size={16} /> : <IconEdit size={16} />}
              onClick={() => navigate(`/erp/roles/edit/${role.id}`)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {role.isLocked ? 'View access' : canUpdate ? 'Edit access' : 'View access'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <PageContainer title="Roles & Access" description="Manage roles and permissions">
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Roles &amp; Access</Typography>
            <Typography variant="body2" color="text.secondary">
              Decide who can see and do what. Open a role to change its permissions, data scope and field visibility; manage individual exceptions from Users.
            </Typography>
          </Box>
          {canCreate && (
            <Button variant="contained" startIcon={<IconPlus size={20} />} onClick={() => navigate('/erp/roles/create')} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Create role
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <TextField
          size="small"
          placeholder="Search roles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><IconSearch size={18} /></InputAdornment>), sx: { borderRadius: 2 } }}
          sx={{ mb: 3, minWidth: { sm: 320 } }}
        />

        {loading && roles.length === 0 ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="overline" color="text.secondary">Built-in roles ({systemRoles.length})</Typography>
            <Grid container spacing={2} sx={{ mb: 4, mt: 0 }}>{systemRoles.map(renderCard)}</Grid>

            <Typography variant="overline" color="text.secondary">Custom roles ({customRoles.length})</Typography>
            {customRoles.length === 0 ? (
              <Card elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 3, mt: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                  <Typography fontWeight={600} gutterBottom>No custom roles yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create a role for a specific job — or clone a built-in role and tweak it.
                  </Typography>
                  {canCreate && <Button variant="contained" onClick={() => navigate('/erp/roles/create')}>Create your first role</Button>}
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2} sx={{ mt: 0 }}>{customRoles.map(renderCard)}</Grid>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>{total} roles in total</Typography>
          </>
        )}

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          <MenuItem onClick={() => { navigate(`/erp/roles/edit/${selected?.id}`); closeMenu(); }}>
            <IconEdit size={18} style={{ marginRight: 8 }} />{selected?.isLocked || !canUpdate ? 'View access' : 'Edit access'}
          </MenuItem>
          {canCreate && (
            <MenuItem onClick={() => { setCloneName(`${selected?.display_name || selected?.name} copy`); setDialog('clone'); closeMenu(); }}>
              <IconCopy size={18} style={{ marginRight: 8 }} />Clone role
            </MenuItem>
          )}
          {canUpdate && selected?.canReset && selected?.isCustomized && (
            <MenuItem onClick={() => { setDialog('reset'); closeMenu(); }}>
              <IconRestore size={18} style={{ marginRight: 8 }} />Reset to default
            </MenuItem>
          )}
          {canDelete && selected && !selected.is_system_role && (
            <MenuItem onClick={() => { setDialog('delete'); closeMenu(); }} sx={{ color: 'error.main' }}>
              <IconTrash size={18} style={{ marginRight: 8 }} />Delete
            </MenuItem>
          )}
        </Menu>

        <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)}>
          <DialogTitle>Delete role</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Delete “{selected?.display_name || selected?.name}”? This cannot be undone.
              {selected?.userCount > 0 ? ` ${selected.userCount} user(s) still have this role — move them first.` : ''}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" disabled={busy} onClick={() => run(() => apiService.deleteRole(selected.id), 'Role deleted')}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialog === 'reset'} onClose={() => setDialog(null)}>
          <DialogTitle>Reset to default</DialogTitle>
          <DialogContent>
            <DialogContentText>Restore “{selected?.display_name || selected?.name}” to its original built-in permissions, data scope and field rules?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button color="warning" variant="contained" disabled={busy} onClick={() => run(() => apiService.resetRole(selected.id), 'Role restored to default')}>Reset</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialog === 'clone'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
          <DialogTitle>Clone “{selected?.display_name || selected?.name}”</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth label="New role name" value={cloneName} onChange={(e) => setCloneName(e.target.value)} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={busy || !cloneName.trim()}
              onClick={() => run(async () => {
                const res = await apiService.cloneRole(selected.id, { name: cloneName, displayName: cloneName });
                if (res.success) navigate(`/erp/roles/edit/${res.data.id}`);
              }, 'Role cloned')}
            >
              Clone &amp; edit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default RoleList;
