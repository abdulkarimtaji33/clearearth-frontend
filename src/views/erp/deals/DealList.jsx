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
  Grid,
  LinearProgress,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCheck,
  IconList,
  IconLayoutKanban,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const DealList = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    fetchDeals();
  }, [page, rowsPerPage, search]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeals({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
      });
      if (response.success) {
        setDeals(response.data.items || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, deal) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeal(deal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeal(null);
  };

  const handleFinalize = async (id) => {
    try {
      await apiService.finalizeDeal(id, { status: 'won' });
      fetchDeals();
    } catch (err) {
      setError(err.message || 'Failed to finalize deal');
    }
  };

  const getStageColor = (stage) => {
    const stageMap = {
      lead: 'default',
      qualification: 'info',
      proposal: 'primary',
      negotiation: 'warning',
      closed_won: 'success',
      closed_lost: 'error',
    };
    return stageMap[stage] || 'default';
  };

  const getStageProgress = (stage) => {
    const stageMap = {
      lead: 10,
      qualification: 30,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 100,
    };
    return stageMap[stage] || 0;
  };

  if (loading && deals.length === 0) {
    return (
      <PageContainer title="Deals" description="Manage deals">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Deals" description="Manage deals">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Deals
          </Typography>
          <Box display="flex" gap={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="list">
                <IconList size={18} />
              </ToggleButton>
              <ToggleButton value="kanban">
                <IconLayoutKanban size={18} />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={() => navigate('/erp/deals/create')}
            >
              Add Deal
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {viewMode === 'list' ? (
          <Card>
            <CardContent>
              <Box mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search deals..."
                  value={search}
                  onChange={handleSearch}
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
                      <TableCell>Deal Name</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Service Type</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Expected Close</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id} hover>
                        <TableCell fontWeight="600">{deal.deal_name}</TableCell>
                        <TableCell>{deal.client_name || '-'}</TableCell>
                        <TableCell>{deal.service_type}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconCurrencyDollar size={16} />
                            {(deal.expected_value || 0).toLocaleString()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={deal.deal_stage?.replace('_', ' ')}
                            size="small"
                            color={getStageColor(deal.deal_stage)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={getStageProgress(deal.deal_stage)}
                              sx={{ width: 100, height: 6, borderRadius: 5 }}
                            />
                            <Typography variant="caption">
                              {getStageProgress(deal.deal_stage)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {deal.expected_close_date
                            ? new Date(deal.expected_close_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, deal)}>
                            <IconDotsVertical size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Grid container spacing={2}>
              {['lead', 'qualification', 'proposal', 'negotiation', 'closed_won'].map((stage) => (
                <Grid size={{ xs: 12, md: 2.4 }} key={stage}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" mb={2}>
                        {stage.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {deals.filter((d) => d.deal_stage === stage).length} deals
                      </Typography>
                      {deals
                        .filter((d) => d.deal_stage === stage)
                        .map((deal) => (
                          <Card key={deal.id} sx={{ mt: 2, cursor: 'pointer' }}>
                            <CardContent>
                              <Typography variant="body2" fontWeight="600">
                                {deal.deal_name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                AED {(deal.expected_value || 0).toLocaleString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              navigate(`/erp/deals/edit/${selectedDeal?.id}`);
              handleMenuClose();
            }}
          >
            <IconEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          {selectedDeal?.deal_stage === 'negotiation' && (
            <MenuItem
              onClick={() => {
                handleFinalize(selectedDeal.id);
                handleMenuClose();
              }}
            >
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Finalize Deal
            </MenuItem>
          )}
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <IconTrash size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </PageContainer>
  );
};

export default DealList;
