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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconFileReport, IconClipboardCheck, IconEye, IconCheck, IconX } from '@tabler/icons-react';
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

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'error' },
  high:     { label: 'High',     color: 'warning' },
  medium:   { label: 'Medium',   color: 'info' },
  low:      { label: 'Low',      color: 'default' },
};

const RESPONSE_CONFIG = {
  pending:  { label: 'Pending',  color: 'warning' },
  accepted: { label: 'Accepted', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
};

const InspectionRequestList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [rejectDialog, setRejectDialog] = useState({ open: false, req: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage, search };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
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
  }, [page, rowsPerPage, search, dateFrom, dateTo, statusFilter, priorityFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (req, e) => {
    e?.stopPropagation();
    try {
      setActionLoading(req.id);
      setError('');
      await apiService.acceptInspectionRequest(req.id);
      setSuccess('Inspection request accepted');
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectDialog.req || !rejectReason.trim()) return;
    try {
      setActionLoading(rejectDialog.req.id);
      setError('');
      await apiService.rejectInspectionRequest(rejectDialog.req.id, rejectReason.trim());
      setSuccess('Inspection request rejected — reason shared with sales user');
      setRejectDialog({ open: false, req: null });
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePriorityChange = async (req, priority, e) => {
    e?.stopPropagation();
    try {
      await apiService.updateInspectionRequestPriority(req.id, priority);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to update priority');
    }
  };

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
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

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
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Stage</InputLabel>
                <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} label="Stage" sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All stages</MenuItem>
                  {Object.entries(INSPECTION_STATUS_CONFIG).map(([v, c]) => (
                    <MenuItem key={v} value={v}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(0); }} label="Priority" sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
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
                    {['Deal', 'Client', 'Material', 'Priority', 'Stage', 'Response', 'Requested By', 'Actions'].map((h, i) => (
                      <TableCell key={i} align={i === 7 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <IconClipboardCheck size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary">No inspection requests found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map(req => (
                      <TableRow key={req.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.02) } }}>
                        <TableCell>
                          {req.deal?.id ? (
                            <Typography
                              component={Link}
                              to={`/erp/deals/view/${req.deal.id}`}
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
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Select
                            size="small"
                            value={req.priority || 'medium'}
                            onChange={e => handlePriorityChange(req, e.target.value, e)}
                            sx={{ minWidth: 100, fontSize: '0.75rem', borderRadius: 2 }}
                          >
                            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
                              <MenuItem key={v} value={v}>{c.label}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const cfg = INSPECTION_STATUS_CONFIG[req.status] || { label: req.status || 'Request Submitted', color: 'default' };
                            return <Chip size="small" label={cfg.label} color={cfg.color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const cfg = RESPONSE_CONFIG[req.response_status || 'pending'] || RESPONSE_CONFIG.pending;
                            return (
                              <Box>
                                <Chip size="small" label={cfg.label} color={cfg.color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                                {req.response_status === 'rejected' && req.rejection_reason && (
                                  <Typography variant="caption" color="error.main" display="block" mt={0.5} sx={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>
                                    {req.rejection_reason}
                                  </Typography>
                                )}
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {req.requestedByUser ? [req.requestedByUser.first_name, req.requestedByUser.last_name].filter(Boolean).join(' ') || '—' : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => navigate(`/erp/inspection-requests/${req.id}`)}>
                                <IconEye size={16} />
                              </IconButton>
                            </Tooltip>
                            {req.response_status !== 'accepted' && req.response_status !== 'rejected' && (
                              <>
                                <Tooltip title="Accept">
                                  <IconButton size="small" color="success" disabled={actionLoading === req.id} onClick={e => handleAccept(req, e)}>
                                    <IconCheck size={16} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton size="small" color="error" disabled={actionLoading === req.id} onClick={e => { e.stopPropagation(); setRejectDialog({ open: true, req }); setRejectReason(''); }}>
                                    <IconX size={16} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {req.deal?.inspectionReport && (
                              <Button size="small" variant="outlined" startIcon={<IconFileReport size={14} />} onClick={() => navigate(`/erp/inspection-requests/${req.id}`)} sx={{ borderRadius: 2, ml: 0.5 }}>
                                Report
                              </Button>
                            )}
                          </Stack>
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

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, req: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Inspection Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Provide a reason — this will be shared with the sales user who submitted the request.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Rejection reason"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, req: null })}>Cancel</Button>
          <Button variant="contained" color="error" disabled={!rejectReason.trim() || actionLoading} onClick={handleRejectSubmit}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default InspectionRequestList;
