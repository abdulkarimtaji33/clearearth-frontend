import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, CircularProgress, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCalendarEvent, IconBeach } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

const BalanceCard = ({ balance }) => {
  const available = (parseFloat(balance.entitled_days) || 0) + (parseFloat(balance.accrued_days) || 0) - (parseFloat(balance.used_days) || 0);
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
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
  const theme = useTheme();
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
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Your HR profile isn&apos;t set up yet — contact your HR administrator to get started.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Leave" description="Your leave balances and requests">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBeach size={20} />
              </Box>
              <Typography variant="h4" fontWeight={700}>My Leave</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6.5}>
              View balances and manage your leave requests
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}>
            Request Leave
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={2.5} mb={3}>
          {balances.map((b) => (
            <Grid key={b.id} size={{ xs: 12, sm: 6, md: 3 }}><BalanceCard balance={b} /></Grid>
          ))}
        </Grid>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={1}>My Requests</Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Type', 'Start', 'End', 'Days', 'Status', 'Actions'].map((h, i) => (
                      <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.leaveType?.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.start_date}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.end_date}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{r.days_count}</Typography></TableCell>
                      <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">
                        {['pending', 'approved'].includes(r.status) && (
                          <Button size="small" color="error" onClick={() => cancelRequest(r.id)} sx={{ borderRadius: 2, fontWeight: 600 }}>Cancel</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.secondary">No leave requests yet</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Leave</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <TextField
                select
                label="Leave Type"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {leaveTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}{!t.is_paid ? ' (unpaid)' : ''}</MenuItem>)}
              </TextField>
              <DatePicker
                label="Start Date"
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(v) => setForm({ ...form, startDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <DatePicker
                label="End Date"
                value={form.endDate ? dayjs(form.endDate) : null}
                onChange={(v) => setForm({ ...form, endDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                minDate={form.startDate ? dayjs(form.startDate) : undefined}
                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
              />
              <TextField
                multiline
                rows={2}
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={!form.leaveTypeId || !form.startDate || !form.endDate} sx={{ borderRadius: 2 }}>Submit</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyLeave;
