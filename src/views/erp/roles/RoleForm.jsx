import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Collapse,
  IconButton,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconShield, IconPlus, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const moduleLabels = {
  users: 'Users',
  roles: 'Roles',
  contacts: 'Contacts',
  companies: 'Companies',
  suppliers: 'Suppliers',
  leads: 'Leads',
  products: 'Products',
  deals: 'Deals',
  inspection_requests: 'Inspection Requests',
  inspection_reports: 'Inspection Reports',
  operations: 'Operations',
  accounting: 'Accounting',
  grn: 'Goods Received Notes',
  quotations: 'Quotations',
  purchase_orders: 'Purchase Orders',
  reports: 'Reports',
  proforma_invoices: 'Proforma Invoices',
  tax_invoices: 'Tax Invoices',
};

const PRICE_ACTION = 'view_price';

// Groups a module's flat permission list into: plain (unscoped) actions,
// scoped actions (own/all pairs keyed by action), and the view_price permission.
const analyzeModulePermissions = (perms) => {
  const plain = [];
  const scopedByAction = {}; // action -> { own: perm|null, all: perm|null }
  let pricePermission = null;

  perms.forEach((p) => {
    if (p.action === PRICE_ACTION) {
      pricePermission = p;
      return;
    }
    if (p.scope === 'own' || p.scope === 'all') {
      if (!scopedByAction[p.action]) scopedByAction[p.action] = { own: null, all: null };
      scopedByAction[p.action][p.scope] = p;
      return;
    }
    plain.push(p);
  });

  return { plain, scopedByAction, pricePermission };
};

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [moduleRegistry, setModuleRegistry] = useState({ modules: [], actions: [], scopes: [] });
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [newPermission, setNewPermission] = useState({ module: '', action: '', scope: '', displayName: '' });
  const [creatingPermission, setCreatingPermission] = useState(false);

  const isEdit = Boolean(id);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [initialValues, setInitialValues] = useState({
    name: '',
    displayName: '',
    description: '',
  });

  const fetchRole = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getRole(id);
      if (res.success) {
        const r = res.data;
        setInitialValues({
          name: r.name || '',
          displayName: r.display_name || r.name || '',
          description: r.description || '',
        });
        setSelectedPermissionIds(new Set((r.permissions || []).map((p) => p.id)));
        setIsSystemRole(Boolean(r.is_system_role));
      }
    } catch (err) {
      setError(err.message || 'Failed to load role');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await apiService.getAllPermissions();
      if (res.success && res.data) {
        setPermissionsGrouped(typeof res.data === 'object' ? res.data : {});
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchModuleRegistry = useCallback(async () => {
    try {
      const res = await apiService.getPermissionModules();
      if (res.success && res.data) {
        setModuleRegistry(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchModuleRegistry();
    if (isEdit) fetchRole();
  }, [isEdit, fetchRole, fetchPermissions, fetchModuleRegistry]);

  const togglePermission = (permId) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  // For a scoped action pair, selecting 'own' or 'all' is mutually exclusive;
  // selecting 'none' clears both.
  const setScopeSelection = (ownPerm, allPerm, value) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (ownPerm) next.delete(ownPerm.id);
      if (allPerm) next.delete(allPerm.id);
      if (value === 'own' && ownPerm) next.add(ownPerm.id);
      if (value === 'all' && allPerm) next.add(allPerm.id);
      return next;
    });
  };

  const toggleAllInModule = (perms, enable) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => {
        if (enable) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const canEdit = !isSystemRole;

  const handleSubmit = async (values) => {
    try {
      setError('');
      const payload = {
        name: values.name.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: values.displayName.trim(),
        description: values.description?.trim() || null,
        permissions: Array.from(selectedPermissionIds),
      };
      if (isEdit) {
        await apiService.updateRole(id, payload);
        setSuccess('Role updated');
      } else {
        await apiService.createRole(payload);
        setSuccess('Role created');
      }
      setTimeout(() => navigate('/erp/roles'), 1200);
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const handleCreatePermission = async () => {
    try {
      setCreatingPermission(true);
      setError('');
      if (!newPermission.module || !newPermission.action) {
        setError('Module and action are required to create a permission');
        return;
      }
      await apiService.createPermission(newPermission);
      setNewPermission({ module: '', action: '', scope: '', displayName: '' });
      setShowCreatePermission(false);
      await fetchPermissions();
      setSuccess('Permission created');
    } catch (err) {
      setError(err.message || 'Failed to create permission');
    } finally {
      setCreatingPermission(false);
    }
  };

  if (isEdit && loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  const modules = Object.keys(permissionsGrouped).filter((m) => Array.isArray(permissionsGrouped[m]) && permissionsGrouped[m].length > 0);

  return (
    <PageContainer title={isEdit ? 'Edit Role' : 'Create Role'} description={isEdit ? 'Update role and permissions' : 'Create new role with permissions'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/roles')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit Role' : 'Create Role'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Update role details and permissions' : 'Define a new role and assign permissions'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object({
            name: Yup.string().trim().required('Name is required'),
            displayName: Yup.string().trim().required('Display name is required'),
          })}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Role Details</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Name (identifier)"
                      name="name"
                      placeholder="e.g. sales_manager"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      disabled={isEdit || isSystemRole}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 400 }}
                    />
                    <TextField
                      fullWidth
                      label="Display Name"
                      name="displayName"
                      placeholder="e.g. Sales Manager"
                      value={values.displayName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.displayName && Boolean(errors.displayName)}
                      helperText={touched.displayName && errors.displayName}
                      disabled={isSystemRole}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 400 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description (optional)"
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      disabled={isSystemRole}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 500 }}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <IconShield size={24} />
                      <Box>
                        <Typography variant="h5" fontWeight={600}>Permissions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Toggle permissions for this role. Scoped actions let you choose Own (only records this role
                          created/is assigned to) or All (every record).
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={showCreatePermission ? <IconChevronUp size={16} /> : <IconPlus size={16} />}
                      onClick={() => setShowCreatePermission((v) => !v)}
                      sx={{ textTransform: 'none' }}
                    >
                      New Permission
                    </Button>
                  </Stack>

                  <Collapse in={showCreatePermission}>
                    <Box sx={{ p: 2, mb: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="subtitle2" mb={2}>Create a custom permission</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                        <TextField
                          select
                          label="Module"
                          size="small"
                          value={newPermission.module}
                          onChange={(e) => setNewPermission((p) => ({ ...p, module: e.target.value }))}
                          sx={{ minWidth: 180 }}
                        >
                          {moduleRegistry.modules.map((m) => (
                            <MenuItem key={m} value={m}>{moduleLabels[m] || m}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Action"
                          size="small"
                          placeholder="e.g. export, read"
                          value={newPermission.action}
                          onChange={(e) => setNewPermission((p) => ({ ...p, action: e.target.value }))}
                          sx={{ minWidth: 160 }}
                        />
                        <TextField
                          select
                          label="Scope (optional)"
                          size="small"
                          value={newPermission.scope}
                          onChange={(e) => setNewPermission((p) => ({ ...p, scope: e.target.value }))}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="">None</MenuItem>
                          {moduleRegistry.scopes.map((s) => (
                            <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Display Name (optional)"
                          size="small"
                          value={newPermission.displayName}
                          onChange={(e) => setNewPermission((p) => ({ ...p, displayName: e.target.value }))}
                          sx={{ minWidth: 200 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleCreatePermission}
                          disabled={creatingPermission || !newPermission.module || !newPermission.action}
                          sx={{ mt: { xs: 1, sm: 0 } }}
                        >
                          Create
                        </Button>
                      </Stack>
                    </Box>
                  </Collapse>

                  <Divider sx={{ mb: 4 }} />

                  {isSystemRole && (
                    <Alert severity="info" sx={{ mb: 3 }}>System roles cannot be modified. Permissions are managed by the system.</Alert>
                  )}
                  {modules.length === 0 ? (
                    <Typography color="text.secondary">No permissions available. Contact your administrator.</Typography>
                  ) : (
                    <Stack spacing={4}>
                      {modules.map((module) => {
                        const perms = permissionsGrouped[module] || [];
                        const selectedCount = perms.filter((p) => selectedPermissionIds.has(p.id)).length;
                        const allSelected = selectedCount === perms.length;
                        const moduleLabel = moduleLabels[module] || module.charAt(0).toUpperCase() + module.slice(1);
                        const { plain, scopedByAction, pricePermission } = analyzeModulePermissions(perms);
                        const scopedActionNames = Object.keys(scopedByAction);

                        return (
                          <Box
                            key={module}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                px: 2,
                                py: 1.5,
                                backgroundColor: 'action.hover',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography fontWeight={600}>{moduleLabel}</Typography>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Chip
                                  size="small"
                                  label={`${selectedCount}/${perms.length}`}
                                  color={allSelected ? 'success' : 'default'}
                                  variant="outlined"
                                />
                                <Button
                                  size="small"
                                  onClick={() => toggleAllInModule(perms, !allSelected)}
                                  disabled={isSystemRole}
                                  sx={{ textTransform: 'none' }}
                                >
                                  {allSelected ? 'Deselect All' : 'Select All'}
                                </Button>
                              </Stack>
                            </Box>
                            <Table size="small">
                              <TableBody>
                                {scopedActionNames.map((action) => {
                                  const { own, all } = scopedByAction[action];
                                  const current = all && selectedPermissionIds.has(all.id)
                                    ? 'all'
                                    : (own && selectedPermissionIds.has(own.id) ? 'own' : 'none');
                                  return (
                                    <TableRow key={action} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                      <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{action}</Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 1.5 }}>
                                        <ToggleButtonGroup
                                          size="small"
                                          exclusive
                                          value={current}
                                          onChange={(e, value) => value && setScopeSelection(own, all, value)}
                                          disabled={isSystemRole}
                                        >
                                          <ToggleButton value="none" sx={{ textTransform: 'none', px: 1.5 }}>None</ToggleButton>
                                          <ToggleButton value="own" disabled={!own} sx={{ textTransform: 'none', px: 1.5 }}>Own</ToggleButton>
                                          <ToggleButton value="all" disabled={!all} sx={{ textTransform: 'none', px: 1.5 }}>All</ToggleButton>
                                        </ToggleButtonGroup>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {plain.map((perm) => (
                                  <TableRow key={perm.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Typography variant="body2">{perm.display_name || perm.name}</Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5, width: 80 }}>
                                      <Switch
                                        checked={selectedPermissionIds.has(perm.id)}
                                        onChange={() => togglePermission(perm.id)}
                                        color="primary"
                                        size="small"
                                        disabled={isSystemRole}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {pricePermission && (
                                  <TableRow sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Typography variant="body2">View Pricing / Financial Amounts</Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5, width: 80 }}>
                                      <Switch
                                        checked={selectedPermissionIds.has(pricePermission.id)}
                                        onChange={() => togglePermission(pricePermission.id)}
                                        color="primary"
                                        size="small"
                                        disabled={isSystemRole}
                                      />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2 }} disabled={!canEdit && isEdit}>
                  {isEdit ? 'Update' : 'Create'} Role
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/erp/roles')} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </form>
          )}
        </Formik>
      </Box>
    </PageContainer>
  );
};

export default RoleForm;
