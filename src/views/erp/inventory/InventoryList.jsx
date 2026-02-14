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
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconSearch, IconPackage, IconTrendingUp, IconTrendingDown, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const InventoryList = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, [page, rowsPerPage, search]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInventory({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      if (response.success) {
        setInventory(response.data.items || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <PageContainer title="Inventory" description="Manage inventory">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inventory" description="Manage inventory">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Inventory
          </Typography>
          <Button variant="contained" onClick={() => navigate('/erp/inventory/lots')}>
            View Lots
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Items
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {inventory.reduce((sum, item) => sum + (item.quantity_on_hand || 0), 0)}
                    </Typography>
                  </Box>
                  <IconPackage size={40} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Value
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      AED {inventory.reduce((sum, item) => sum + (item.total_value || 0), 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <IconTrendingUp size={40} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Box mb={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material Type</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Quantity On Hand</TableCell>
                    <TableCell>Reserved</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell fontWeight="600">{item.material_type_name}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{(item.quantity_on_hand || 0).toLocaleString()}</TableCell>
                      <TableCell>{(item.quantity_reserved || 0).toLocaleString()}</TableCell>
                      <TableCell>{(item.quantity_available || 0).toLocaleString()}</TableCell>
                      <TableCell>AED {(item.total_value || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InventoryList;
