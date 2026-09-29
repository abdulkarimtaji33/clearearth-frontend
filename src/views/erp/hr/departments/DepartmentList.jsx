import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, Stack, Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconEdit, IconTrash, IconBuildingCommunity } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const DepartmentList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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

  const getInitials = (name) => (name || '').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <PageContainer title="Departments" description="HR departments">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBuildingCommunity size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Departments</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {departments.length > 0 ? `${departments.length} department${departments.length !== 1 ? 's' : ''}` : 'Manage organizational departments'}
            </Typography>
          </Box>
          {canManage && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/hr/departments/create')} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
              New Department
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Name', 'Code', 'Parent', 'Head', 'Status', canManage ? 'Actions' : ''].map((h, i) => (
                    <TableCell key={i} align={canManage && i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} sx={{ py: 2 }}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} /></TableCell></TableRow>
                  ))
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <IconBuildingCommunity size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No departments yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                            {getInitials(d.name)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700}>{d.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{d.code || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.parent?.name || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.headEmployee ? `${d.headEmployee.first_name} ${d.headEmployee.last_name}` : '-'}</Typography></TableCell>
                      <TableCell><Chip size="small" label={d.status} color={d.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigate(`/erp/hr/departments/edit/${d.id}`)} sx={{ borderRadius: 1.5 }}><IconEdit size={18} /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(d)} sx={{ borderRadius: 1.5 }}><IconTrash size={18} /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Delete Department</DialogTitle>
        <DialogContent><DialogContentText>Delete "{deleteTarget?.name}"? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DepartmentList;
