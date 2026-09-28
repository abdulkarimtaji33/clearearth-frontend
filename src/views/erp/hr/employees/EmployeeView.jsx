import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Grid, Chip, CircularProgress, Alert, Button, Stack, Divider } from '@mui/material';
import { IconEdit } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const Field = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
    <Typography variant="body1">{value || '-'}</Typography>
  </Box>
);

const EmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getHrEmployee(id);
      if (res.success) setEmployee(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return null;

  return (
    <PageContainer title={`${employee.first_name} ${employee.last_name}`} description="Employee profile">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{employee.first_name} {employee.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">{employee.employee_code}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={employee.employment_status} color={employee.employment_status === 'active' ? 'success' : 'default'} />
            {hasPermission('hr.employees.manage') && (
              <Button startIcon={<IconEdit size={18} />} onClick={() => navigate(`/erp/hr/employees/edit/${id}`)}>Edit</Button>
            )}
          </Stack>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}><Field label="Email" value={employee.email} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Phone" value={employee.phone} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Department" value={employee.department?.name} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Designation" value={employee.designation?.display_name} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Manager" value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Employment Type" value={employee.employment_type} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Date of Joining" value={employee.date_of_joining} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Date of Exit" value={employee.date_of_exit} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Login Account" value={employee.user ? employee.user.email : 'Not linked'} /></Grid>
        </Grid>
      </Card>
    </PageContainer>
  );
};

export default EmployeeView;
