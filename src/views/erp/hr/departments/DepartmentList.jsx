import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stack,
  Skeleton, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconPlus, IconEdit, IconTrash, IconBuildingCommunity, IconCircleCheck, IconCircleOff, IconSitemap,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, PersonCell, EmptyState, tableSx, dialogPaperProps,
} from '../components/HrUi';

const getInitials = (name) => (name || '').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase() || '?';

const DepartmentList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = hasPermission('hr.settings.manage');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrDepartments({ pageSize: 200 });
      if (res.success) setDepartments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deleteHrDepartment(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete department');
      setDeleteTarget(null);
    }
  };

  const stats = useMemo(() => ({
    active: departments.filter((d) => d.status === 'active').length,
    inactive: departments.filter((d) => d.status !== 'active').length,
    nested: departments.filter((d) => d.parent).length,
  }), [departments]);

  const colCount = canManage ? 6 : 5;

  return (
    <HrPage
      title="Departments"
      description="HR departments"
      subtitle="Organise teams and reporting structure across the company."
      actions={canManage && (
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/hr/departments/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 2.5 }}>
          New Department
        </Button>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={190} sx={{ mb: 3 }}>
        <StatTile icon={IconBuildingCommunity} label="Departments" value={departments.length} loading={loading} />
        <StatTile icon={IconCircleCheck} label="Active" value={stats.active} tone="success" loading={loading} />
        <StatTile icon={IconCircleOff} label="Inactive" value={stats.inactive} tone="secondary" loading={loading} />
        <StatTile icon={IconSitemap} label="Sub-departments" value={stats.nested} tone="info" loading={loading} />
      </StatGrid>

      <SectionCard
        icon={IconBuildingCommunity}
        title="All departments"
        subtitle={departments.length > 0 ? `${departments.length} department${departments.length !== 1 ? 's' : ''}` : undefined}
        noPadding
      >
        {!loading && departments.length === 0 ? (
          <EmptyState
            icon={IconBuildingCommunity}
            title="No departments yet"
            message="Create departments to group employees and define the reporting hierarchy."
            action={canManage && (
              <Button variant="outlined" startIcon={<IconPlus size={16} />} onClick={() => navigate('/erp/hr/departments/create')} sx={{ borderRadius: 2 }}>
                New Department
              </Button>
            )}
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Head</TableCell>
                  <TableCell>Status</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(colCount)].map((__, j) => (
                        <TableCell key={j}><Skeleton variant="text" width={j === 0 ? 160 : 80} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  departments.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
                          <Box sx={{
                            width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
                            fontSize: 12.5, fontWeight: 700,
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main',
                          }}
                          >
                            {getInitials(d.name)}
                          </Box>
                          <Typography variant="body2" fontWeight={600} noWrap>{d.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {d.code ? (
                          <Box
                            component="span"
                            sx={{
                              fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, px: 1, py: 0.25, borderRadius: 1,
                              bgcolor: (t) => alpha(t.palette.text.primary, 0.06), color: 'text.secondary',
                            }}
                          >
                            {d.code}
                          </Box>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={d.parent?.name ? 'text.primary' : 'text.disabled'} noWrap>{d.parent?.name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {d.headEmployee
                          ? <PersonCell person={d.headEmployee} size={30} secondary={d.headEmployee.employee_code} />
                          : <Typography variant="body2" color="text.disabled">Not assigned</Typography>}
                      </TableCell>
                      <TableCell><StatusChip status={d.status} /></TableCell>
                      {canManage && (
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigate(`/erp/hr/departments/edit/${d.id}`)} sx={{ borderRadius: 1.5 }}><IconEdit size={18} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(d)} sx={{ borderRadius: 1.5 }}><IconTrash size={18} /></IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete department</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} sx={{ borderRadius: 2, fontWeight: 600 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default DepartmentList;
