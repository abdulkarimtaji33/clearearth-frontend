import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { IconSearch, IconClipboardCheck, IconFileReport } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const InspectionRequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      const response = await apiService.getInspectionRequests(params);
      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inspection requests');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <PageContainer title="Inspection Requests" description="View inspection requests and add reports">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Inspection Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              View inspection requests and add inspection reports
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search by deal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, backgroundColor: 'action.hover' },
                }}
                sx={{ minWidth: 280 }}
              />
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Deal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Report</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }} color="text.secondary">
                        No inspection requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((req) => (
                      <TableRow key={req.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/inspection-requests/${req.id}`)}>
                        <TableCell>
                          <Typography fontWeight={600}>{req.deal?.title || req.deal?.deal_number || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{req.deal?.deal_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{req.deal?.company?.company_name || req.deal?.supplier?.company_name || '-'}</TableCell>
                        <TableCell>{req.materialType?.display_name || '-'}</TableCell>
                        <TableCell>
                          {req.requestedByUser
                            ? [req.requestedByUser.first_name, req.requestedByUser.last_name].filter(Boolean).join(' ') || '-'
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {req.deal?.inspectionReport ? (
                            <Chip size="small" label="Submitted" color="success" variant="outlined" />
                          ) : (
                            <Chip size="small" label="Pending" color="warning" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/erp/inspection-requests/${req.id}`); }}>
                            {req.deal?.inspectionReport ? 'View Report' : 'Add Report'}
                          </Button>
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
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InspectionRequestList;
