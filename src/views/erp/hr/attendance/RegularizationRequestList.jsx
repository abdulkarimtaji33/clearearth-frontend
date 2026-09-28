import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack,
} from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };

const RegularizationRequestList = () => {
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
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Regularization Requests</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell><TableCell>Date</TableCell><TableCell>Requested In</TableCell>
                  <TableCell>Requested Out</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.employee?.first_name} {r.employee?.last_name}</TableCell>
                    <TableCell>{r.attendance_date}</TableCell>
                    <TableCell>{r.requested_check_in ? new Date(r.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{r.requested_check_out ? new Date(r.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} /></TableCell>
                    <TableCell align="right">
                      {r.status === 'pending' && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" color="success" onClick={() => review(r.id, 'approved')}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => review(r.id, 'rejected')}>Reject</Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center">No requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default RegularizationRequestList;
