import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconUserOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [page, rowsPerPage, search]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmployees({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      
      if (response.success) {
        setEmployees(response.data.items || response.data);
        setTotalCount(response.data.totalCount || response.data.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleEdit = () => {
    navigate(`/erp/employees/edit/${selectedEmployee.id}`);
    handleMenuClose();
  };

  const handleTerminate = async () => {
    if (window.confirm('Are you sure you want to terminate this employee?')) {
      try {
        await apiService.terminateEmployee(selectedEmployee.id, {
          termination_date: new Date().toISOString().split('T')[0],
          reason: 'User initiated',
        });
        fetchEmployees();
      } catch (err) {
        setError(err.message || 'Failed to terminate employee');
      }
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await apiService.deleteEmployee(selectedEmployee.id);
        fetchEmployees();
      } catch (err) {
        setError(err.message || 'Failed to delete employee');
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      terminated: 'error',
      on_leave: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <PageContainer title="Employees" description="Manage employees">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Employees
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/employees/create')}>
            Add Employee
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={20} />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Job Title</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography>No employees found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        employees.map((employee) => (
                          <TableRow key={employee.id} hover>
                            <TableCell>{employee.employee_id || employee.id}</TableCell>
                            <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{employee.phone}</TableCell>
                            <TableCell>{employee.job_title}</TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>
                              <Chip
                                label={employee.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
                                color={getStatusColor(employee.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, employee)}>
                                <IconDotsVertical />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleTerminate}>
            <IconUserOff size={18} style={{ marginRight: 8 }} />
            Terminate
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default EmployeeList;
