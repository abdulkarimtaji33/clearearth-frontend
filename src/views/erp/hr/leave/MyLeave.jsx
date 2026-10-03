import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconCalendarEvent, IconBeach, IconPlus, IconUserOff, IconListDetails, IconCalendarOff } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatusChip, EmptyState, LoadingBlock,
  tableSx, inputSx, dialogPaperProps, cardSx, fmtDate,
} from '../components/HrUi';

const BALANCE_TONES = ['primary', 'success', 'info', 'warning', 'secondary'];

const BalanceCard = ({ balance, tone = 'primary' }) => {
  const total = (parseFloat(balance.entitled_days) || 0) + (parseFloat(balance.accrued_days) || 0);
  const used = parseFloat(balance.used_days) || 0;
  const available = total - used;
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  return (
    <Card elevation={0} sx={{ ...cardSx, p: 2.25, height: '100%' }}>
      <Stack direction="row" spacing={1.25} alignItems="center" mb={1.5} minWidth={0}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
          bgcolor: (t) => alpha(t.palette[tone].main, 0.12), color: (t) => t.palette[tone].main,
        }}
        >
          <IconCalendarEvent size={17} />
        </Box>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{balance.leaveType?.name || 'Leave'}</Typography>
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={0.75}>
        <Typography variant="h3" fontWeight={700} lineHeight={1.1}>{available}</Typography>
        <Typography variant="body2" color="text.secondary">days left</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mt: 1.5, height: 6, borderRadius: 3,
          bgcolor: (t) => alpha(t.palette[tone].main, 0.12),
          '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: (t) => t.palette[tone].main },
        }}
      />
      <Stack direction="row" justifyContent="space-between" mt={1}>
        <Typography variant="caption" color="text.secondary">Used {used}</Typography>
        <Typography variant="caption" color="text.secondary">of {total}</Typography>
      </Stack>
    </Card>
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

  const pageProps = {
    title: 'My Leave',
    description: 'Your leave balances and requests',
    subtitle: 'View your balances for this year and manage your leave requests.',
  };

  if (loading) {
    return (
      <HrPage {...pageProps}>
        <LoadingBlock py={12} />
      </HrPage>
    );
  }

  if (notSetUp) {
    return (
      <HrPage {...pageProps}>
        <Card elevation={0} sx={cardSx}>
          <EmptyState
            icon={IconUserOff}
            title="HR profile not set up"
            message="Your HR profile isn't set up yet — contact your HR administrator to get started."
          />
        </Card>
      </HrPage>
    );
  }

  return (
    <HrPage
      {...pageProps}
      actions={(
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 2.5, boxShadow: 'none' }}>
          Request Leave
        </Button>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Balances · {new Date().getFullYear()}</Typography>
        {balances.length === 0 ? (
          <Card elevation={0} sx={cardSx}>
            <EmptyState icon={IconBeach} title="No leave balances" message="No leave entitlements have been allocated to you for this year." compact />
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 2 }}>
            {balances.map((b, i) => (
              <BalanceCard key={b.id} balance={b} tone={BALANCE_TONES[i % BALANCE_TONES.length]} />
            ))}
          </Box>
        )}
      </Box>

      <SectionCard
        icon={IconListDetails}
        title="My requests"
        subtitle={`${requests.length} request${requests.length === 1 ? '' : 's'}`}
        noPadding
      >
        {requests.length === 0 ? (
          <EmptyState icon={IconCalendarOff} title="No leave requests yet" message="Requests you submit will be listed here with their approval status." compact />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Days</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.leaveType?.name || '—'}</Typography>
                      {r.reason && <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ maxWidth: 260 }}>{r.reason}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {fmtDate(r.start_date) || r.start_date}
                        {r.end_date && r.end_date !== r.start_date ? ` – ${fmtDate(r.end_date) || r.end_date}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{r.days_count}</Typography></TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right">
                      {['pending', 'approved'].includes(r.status) && (
                        <Button size="small" color="error" onClick={() => cancelRequest(r.id)} sx={{ borderRadius: 2, fontWeight: 600 }}>Cancel</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Request leave</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Your request will be sent to your approver.
          </Typography>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <TextField
                select
                label="Leave type"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                sx={inputSx}
              >
                {leaveTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}{!t.is_paid ? ' (unpaid)' : ''}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <DatePicker
                  label="Start date"
                  value={form.startDate ? dayjs(form.startDate) : null}
                  onChange={(v) => setForm({ ...form, startDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                  slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                />
                <DatePicker
                  label="End date"
                  value={form.endDate ? dayjs(form.endDate) : null}
                  onChange={(v) => setForm({ ...form, endDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                  minDate={form.startDate ? dayjs(form.startDate) : undefined}
                  slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                />
              </Box>
              <TextField
                multiline
                rows={3}
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                sx={inputSx}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={!form.leaveTypeId || !form.startDate || !form.endDate} sx={{ borderRadius: 2, fontWeight: 600 }}>Submit request</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default MyLeave;
