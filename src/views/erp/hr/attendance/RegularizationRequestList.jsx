import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconClipboardList } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };

const RegularizationRequestList = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listAttendanceRegularizations({});
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id, decision) => {
    try {
      await apiService.reviewAttendanceRegularization(id, decision);
      load();
    } catch (err) {
      setError(err.message || 'Failed to review request');
    }
  };

  return (
    <PageContainer title="Regularization Requests" description="HR attendance correction approval queue">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClipboardList size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>Regularization Requests</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" ml={6.5} mb={3}>
          Attendance correction approval queue
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Employee', 'Date', 'Requested In', 'Requested Out', 'Reason', 'Status', 'Actions'].map((h, i) => (
                    <TableCell key={i} align={i === 6 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <IconClipboardList size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">No requests</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.employee?.first_name} {r.employee?.last_name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.attendance_date}</Typography></TableCell>
                      <TableCell>{r.requested_check_in ? new Date(r.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                      <TableCell>{r.requested_check_out ? new Date(r.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.reason}</Typography></TableCell>
                      <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">
                        {r.status === 'pending' && (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="contained" color="success" onClick={() => review(r.id, 'approved')} sx={{ borderRadius: 2, fontWeight: 600 }}>Approve</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => review(r.id, 'rejected')} sx={{ borderRadius: 2, fontWeight: 600 }}>Reject</Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default RegularizationRequestList;
