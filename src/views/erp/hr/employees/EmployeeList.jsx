import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, MenuItem, Chip, Alert,
  CircularProgress, TablePagination, IconButton,
} from '@mui/material';
import { IconSearch, IconPlus, IconEye, IconEdit } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_COLORS = { onboarding: 'info', active: 'success', on_leave: 'warning', suspended: 'error', exited: 'default' };

const EmployeeList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const canManage = hasPermission('hr.employees.manage');

  useEffect(() => {
    apiService.getHrDepartments({ pageSize: 200 }).then((res) => { if (res.success) setDepartments(res.data || []); }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrEmployees({ page: page + 1, pageSize: rowsPerPage, search, departmentId, status });
      if (res.success) {
        setEmployees(res.data || []);
        setTotal(res.pagination?.totalItems || (res.data || []).length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, departmentId, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <PageContainer title="Employees" description="HR employee directory">
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Typography variant="h5" fontWeight={700}>Employees</Typography>
          {canManage && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/erp/hr/employees/create')}>
              New Employee
            </Button>
          )}
        </Box>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            size="small" placeholder="Search name or code" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
          />
          <TextField select size="small" label="Department" value={departmentId} sx={{ minWidth: 180 }}
            onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} sx={{ minWidth: 160 }}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {['onboarding', 'active', 'on_leave', 'suspended', 'exited'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>{e.employee_code}</TableCell>
                      <TableCell>{e.first_name} {e.last_name}</TableCell>
                      <TableCell>{e.department?.name || '-'}</TableCell>
                      <TableCell>{e.designation?.display_name || '-'}</TableCell>
                      <TableCell><Chip size="small" label={e.employment_status} color={STATUS_COLORS[e.employment_status] || 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate(`/erp/hr/employees/view/${e.id}`)}><IconEye size={18} /></IconButton>
                        {canManage && (
                          <IconButton size="small" onClick={() => navigate(`/erp/hr/employees/edit/${e.id}`)}><IconEdit size={18} /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center">No employees found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
              rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default EmployeeList;
