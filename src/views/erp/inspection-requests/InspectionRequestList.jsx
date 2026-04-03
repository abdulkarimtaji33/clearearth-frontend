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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconFileReport, IconClipboardCheck } from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import apiService from '../../../services/api';

const INSPECTION_STATUS_CONFIG = {
  request_submitted:    { label: 'Request Submitted',   color: 'default' },
  team_assigned:        { label: 'Team Assigned',       color: 'info' },
  inspection_completed: { label: 'Inspection Completed', color: 'warning' },
  report_submitted:     { label: 'Report Submitted',    color: 'success' },
};

const InspectionRequestList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.status = statusFilter;
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
  }, [page, rowsPerPage, search, dateFrom, dateTo, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <PageContainer title="Inspection Requests" description="View inspection requests and add reports">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconClipboardCheck size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>Inspection Requests</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              {totalCount > 0 ? `${totalCount} request${totalCount !== 1 ? 's' : ''}` : 'View and manage field inspection requests'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                size="small"
                placeholder="Search by deal..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
                sx={{ minWidth: 220, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Stage</InputLabel>
                <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Stage" sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All stages</MenuItem>
                  {Object.entries(INSPECTION_STATUS_CONFIG).map(([v, c]) => (
                    <MenuItem key={v} value={v}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <ListDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={v => { setDateFrom(v); setPage(0); }} onToChange={v => { setDateTo(v); setPage(0); }} onClear={() => { setDateFrom(''); setDateTo(''); setPage(0); }} helperText="Request created" compact />
            </Box>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                    {['Deal', 'Client', 'Material', 'Stage', 'Requested By', ''].map((h, i) => (
                      <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>

                        <IconClipboardCheck size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary">No inspection requests found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map(req => (
                      <TableRow key={req.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.02) } }} onClick={() => navigate(`/erp/inspection-requests/${req.id}`)}>
                        <TableCell>
                          {req.deal?.id ? (
                            <Typography
                              component={Link}
                              to={`/erp/deals/view/${req.deal.id}`}
                              onClick={(e) => e.stopPropagation()}
                              variant="body2"
                              fontWeight={700}
                              color="primary.main"
                              sx={{ textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {req.deal?.deal_number || `#${req.deal.id}`}
                            </Typography>
                          ) : (
                            <Typography variant="body2" fontWeight={700} color="primary.main">{req.deal?.deal_number || '—'}</Typography>
                          )}
                          <Typography variant="body2" fontWeight={500}>{req.deal?.title || '—'}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{req.deal?.company?.company_name || req.deal?.supplier?.company_name || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{req.materialType?.display_name || '—'}</Typography></TableCell>
                        <TableCell>
                          {(() => {
                            const cfg = INSPECTION_STATUS_CONFIG[req.status] || { label: req.status || 'Request Submitted', color: 'default' };
                            return <Chip size="small" label={cfg.label} color={cfg.color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {req.requestedByUser ? [req.requestedByUser.first_name, req.requestedByUser.last_name].filter(Boolean).join(' ') || '—' : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <Button size="small" variant={req.deal?.inspectionReport ? 'outlined' : 'contained'} startIcon={req.deal?.inspectionReport ? <IconFileReport size={14} /> : null} onClick={() => navigate(`/erp/inspection-requests/${req.id}`)} sx={{ borderRadius: 2 }}>
                            {req.deal?.inspectionReport ? 'View Report' : 'Open'}
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
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InspectionRequestList;
