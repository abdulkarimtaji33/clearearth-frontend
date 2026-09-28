import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, CircularProgress,
} from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

const BalanceCard = ({ balance }) => {
  const available = (parseFloat(balance.entitled_days) || 0) + (parseFloat(balance.accrued_days) || 0) - (parseFloat(balance.used_days) || 0);
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
        <IconCalendarEvent size={20} />
        <Typography variant="subtitle2" fontWeight={700}>{balance.leaveType?.name}</Typography>
      </Stack>
      <Typography variant="h5" fontWeight={800}>{available}</Typography>
      <Typography variant="caption" color="text.secondary">days available (used {balance.used_days})</Typography>
    </Paper>
  );
};

const MyLeave = () => {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notSetUp, setNotSetUp] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setNotSetUp(false);
      const [balRes, reqRes, typesRes] = await Promise.all([
        apiService.getMyLeaveBalances(new Date().getFullYear()),
        apiService.listHrLeaveRequests({ mine: true }),
        apiService.getHrLeaveTypes(),
      ]);
      if (balRes.success) setBalances(balRes.data || []);
      if (reqRes.success) setRequests(reqRes.data || []);
      if (typesRes.success) setLeaveTypes(typesRes.data || []);
    } catch (err) {
      if (err.status === 404 && /no employee record linked/i.test(err.message || '')) {
        setNotSetUp(true);
      } else {
        setError(err.message || 'Failed to load leave data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitRequest = async () => {
    setFormError('');
    try {
      await apiService.createHrLeaveRequest(form);
      setFormOpen(false);
      setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request');
    }
  };

  const cancelRequest = async (id) => {
    try {
      await apiService.cancelHrLeaveRequest(id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;

  if (notSetUp) {
    return (
      <PageContainer title="My Leave" description="Your leave balances and requests">
        <Alert severity="info">
          Your HR profile isn&apos;t set up yet — contact your HR administrator to get started.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Leave" description="Your leave balances and requests">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>My Leave</Typography>
        <Button variant="contained" onClick={() => setFormOpen(true)}>Request Leave</Button>
      </Box>
      <Grid container spacing={2} mb={3}>
        {balances.map((b) => (
          <Grid item xs={12} sm={6} md={3} key={b.id}><BalanceCard balance={b} /></Grid>
        ))}
      </Grid>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>My Requests</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell>
                <TableCell>Days</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.leaveType?.name}</TableCell>
                  <TableCell>{r.start_date}</TableCell>
                  <TableCell>{r.end_date}</TableCell>
                  <TableCell>{r.days_count}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} /></TableCell>
                  <TableCell align="right">
                    {['pending', 'approved'].includes(r.status) && (
                      <Button size="small" color="error" onClick={() => cancelRequest(r.id)}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && <TableRow><TableCell colSpan={6} align="center">No leave requests yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField select label="Leave Type" value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>
              {leaveTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}{!t.is_paid ? ' (unpaid)' : ''}</MenuItem>)}
            </TextField>
            <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <TextField multiline rows={2} label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={!form.leaveTypeId || !form.startDate || !form.endDate}>Submit</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyLeave;
