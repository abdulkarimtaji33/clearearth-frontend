import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack,
} from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

const LeaveApprovalQueue = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listHrLeaveRequests({ status: 'pending' });
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try { await apiService.approveHrLeaveRequest(id); load(); } catch (err) { setError(err.message || 'Failed to approve'); }
  };
  const reject = async (id) => {
    try { await apiService.rejectHrLeaveRequest(id); load(); } catch (err) { setError(err.message || 'Failed to reject'); }
  };

  return (
    <PageContainer title="Leave Approvals" description="Leave requests awaiting your approval">
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Leave Approvals</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Scoped to your direct reports unless you have full HR access.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>Start</TableCell>
                  <TableCell>End</TableCell><TableCell>Days</TableCell><TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.employee?.first_name} {r.employee?.last_name}</TableCell>
                    <TableCell>{r.leaveType?.name}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.days_count}</TableCell>
                    <TableCell>{r.reason || '-'}</TableCell>
                    <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="contained" color="success" onClick={() => approve(r.id)}>Approve</Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => reject(r.id)}>Reject</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={8} align="center">No pending requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default LeaveApprovalQueue;
