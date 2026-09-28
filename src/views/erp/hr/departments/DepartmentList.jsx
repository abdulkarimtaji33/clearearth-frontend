import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

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

  return (
    <PageContainer title="Departments" description="HR departments">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>Departments</Typography>
          {canManage && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/hr/departments/create')}>
              New Department
            </Button>
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Head</TableCell>
                  <TableCell>Status</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.code || '-'}</TableCell>
                    <TableCell>{d.parent?.name || '-'}</TableCell>
                    <TableCell>{d.headEmployee ? `${d.headEmployee.first_name} ${d.headEmployee.last_name}` : '-'}</TableCell>
                    <TableCell><Chip size="small" label={d.status} color={d.status === 'active' ? 'success' : 'default'} /></TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate(`/erp/hr/departments/edit/${d.id}`)}><IconEdit size={18} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(d)}><IconTrash size={18} /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center">No departments yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent><DialogContentText>Delete "{deleteTarget?.name}"? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DepartmentList;
