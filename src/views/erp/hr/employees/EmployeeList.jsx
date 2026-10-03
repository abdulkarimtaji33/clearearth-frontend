import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, MenuItem, Chip, Alert,
  TablePagination, IconButton, Avatar, Skeleton, Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconSearch, IconPlus, IconEye, IconEdit, IconUserSearch, IconBriefcase,
  IconBuildingSkyscraper, IconUsers, IconCalendar,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_OPTIONS = ['onboarding', 'active', 'on_leave', 'suspended', 'exited'];
const STATUS_COLORS = { onboarding: 'info', active: 'success', on_leave: 'warning', suspended: 'error', exited: 'default' };

const textFieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const formatStatus = (s) => (s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '-');

const initialsOf = (e) => `${(e.first_name || '').charAt(0)}${(e.last_name || '').charAt(0)}`.toUpperCase() || '?';

const fullNameOf = (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || '-';

const formatDate = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-');

const SKELETON_ROWS = 6;

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

  const hasFilters = !!(search || departmentId || status);
  const columnCount = canManage ? 6 : 5;

  return (
    <PageContainer title="Employees" description="HR employee directory">
      <Box sx={{ maxWidth: 'min(1400px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        {/* Page header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h3" fontWeight={700}>Employees</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {loading ? 'Loading directory...' : `${total} ${total === 1 ? 'employee' : 'employees'} in the directory`}
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => navigate('/erp/hr/employees/create')}
              sx={{ borderRadius: 2, fontWeight: 600, px: 2.5, whiteSpace: 'nowrap' }}
            >
              Add employee
            </Button>
          )}
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          {/* Filter bar */}
          <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              size="small" placeholder="Search name or code" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ ...textFieldSx, flex: { xs: '1 1 100%', md: '1 1 280px' }, maxWidth: { md: 360 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
            />
            <TextField select size="small" label="Department" value={departmentId}
              sx={{ ...textFieldSx, flex: { xs: '1 1 45%', md: '0 0 200px' } }}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}>
              <MenuItem value="">All departments</MenuItem>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Status" value={status}
              sx={{ ...textFieldSx, flex: { xs: '1 1 45%', md: '0 0 180px' } }}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All statuses</MenuItem>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{formatStatus(s)}</MenuItem>)}
            </TextField>
          </Box>

          {error && <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{error}</Alert>}

          <TableContainer>
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.4, whiteSpace: 'nowrap' } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Reporting manager</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Skeleton variant="circular" width={36} height={36} />
                        <Box flex={1}>
                          <Skeleton variant="text" width={140} />
                          <Skeleton variant="text" width={80} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={110} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="text" width={90} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={72} height={24} /></TableCell>
                    <TableCell align="right"><Skeleton variant="circular" width={28} height={28} sx={{ display: 'inline-block' }} /></TableCell>
                  </TableRow>
                ))}

                {!loading && employees.map((e) => {
                  const photoUrl = e.profile_photo ? apiService.getUploadUrl(e.profile_photo) : undefined;
                  return (
                    <TableRow
                      key={e.id}
                      hover
                      onClick={() => navigate(`/erp/hr/employees/view/${e.id}`)}
                      sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={photoUrl} sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, bgcolor: (t) => alpha(t.palette.primary.main, 0.14), color: 'primary.main' }}>
                            {initialsOf(e)}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>{fullNameOf(e)}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{e.employee_code || '-'}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <IconBuildingSkyscraper size={15} />
                          <Typography variant="body2" color="text.primary">{e.department?.name || '-'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <IconBriefcase size={15} />
                          <Typography variant="body2" color="text.primary">{e.designation?.display_name || '-'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <IconUsers size={15} />
                          <Typography variant="body2" color="text.primary" noWrap>
                            {e.manager ? `${e.manager.first_name || ''} ${e.manager.last_name || ''}`.trim() : '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <IconCalendar size={15} />
                          <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.date_of_joining)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={formatStatus(e.employment_status)}
                          color={STATUS_COLORS[e.employment_status] || 'default'}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(ev) => ev.stopPropagation()}>
                        <IconButton size="small" aria-label="View employee" onClick={() => navigate(`/erp/hr/employees/view/${e.id}`)}>
                          <IconEye size={18} />
                        </IconButton>
                        {canManage && (
                          <IconButton size="small" aria-label="Edit employee" onClick={() => navigate(`/erp/hr/employees/edit/${e.id}`)}>
                            <IconEdit size={18} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columnCount} sx={{ py: 8, borderBottom: 0 }}>
                      <Stack alignItems="center" spacing={1.5} sx={{ color: 'text.secondary' }}>
                        <IconUserSearch size={44} style={{ opacity: 0.35 }} />
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary">No employees found</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hasFilters ? 'Try adjusting your search or filters.' : 'Employees you add will appear here.'}
                        </Typography>
                        {!hasFilters && canManage && (
                          <Button variant="outlined" size="small" startIcon={<IconPlus size={16} />} onClick={() => navigate('/erp/hr/employees/create')} sx={{ borderRadius: 2, mt: 1 }}>
                            Add employee
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && (
            <TablePagination
              component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
              rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          )}
        </Card>
      </Box>
    </PageContainer>
  );
};

export default EmployeeList;
