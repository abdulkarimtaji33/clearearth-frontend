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
  IconGasStation,
  IconTool,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, [page, rowsPerPage, search]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVehicles({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      
      if (response.success) {
        setVehicles(response.data.items || response.data);
        setTotalCount(response.data.totalCount || response.data.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, vehicle) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(vehicle);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVehicle(null);
  };

  const handleEdit = () => {
    navigate(`/erp/vehicles/edit/${selectedVehicle.id}`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await apiService.deleteVehicle(selectedVehicle.id);
        fetchVehicles();
      } catch (err) {
        setError(err.message || 'Failed to delete vehicle');
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      maintenance: 'warning',
      inactive: 'default',
      retired: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <PageContainer title="Vehicles" description="Fleet management">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Vehicles
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/vehicles/create')}>
            Add Vehicle
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                placeholder="Search vehicles..."
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
                        <TableCell>Registration</TableCell>
                        <TableCell>Make & Model</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Mileage</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography>No vehicles found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map((vehicle) => (
                          <TableRow key={vehicle.id} hover>
                            <TableCell>
                              <Typography fontWeight="600">{vehicle.registration_number}</Typography>
                            </TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.year}</TableCell>
                            <TableCell>{vehicle.vehicle_type?.replace('_', ' ').toUpperCase()}</TableCell>
                            <TableCell>{vehicle.current_mileage?.toLocaleString() || 0} km</TableCell>
                            <TableCell>
                              <Chip
                                label={vehicle.status?.toUpperCase() || 'ACTIVE'}
                                color={getStatusColor(vehicle.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, vehicle)}>
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
          <MenuItem onClick={handleDelete}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default VehicleList;
