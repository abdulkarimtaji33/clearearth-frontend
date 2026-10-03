import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, IconButton, Checkbox, FormControlLabel, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconPlus, IconTrash, IconCalendarEvent, IconCalendarDue, IconRepeat, IconConfetti,
} from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, EmptyState, LoadingBlock,
  tableSx, inputSx, dialogPaperProps, fmtDate, daysUntil,
} from '../components/HrUi';

const DateBadge = ({ date, past }) => {
  const d = dayjs(date);
  const tone = past ? 'text' : 'primary';
  return (
    <Box sx={{
      width: 44, flexShrink: 0, borderRadius: 2, overflow: 'hidden', textAlign: 'center',
      border: '1px solid', borderColor: 'divider',
    }}
    >
      <Box sx={{
        py: 0.25, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        bgcolor: (t) => (tone === 'text' ? alpha(t.palette.text.primary, 0.06) : alpha(t.palette.primary.main, 0.12)),
        color: tone === 'text' ? 'text.secondary' : 'primary.main',
      }}
      >
        {d.isValid() ? d.format('MMM') : '—'}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.6} color={past ? 'text.secondary' : 'text.primary'}>
        {d.isValid() ? d.format('D') : ''}
      </Typography>
    </Box>
  );
};

const HolidayCalendar = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', holidayDate: '', isRecurring: false });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrHolidays();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await apiService.createHrHoliday(form);
      setFormOpen(false);
      setForm({ name: '', holidayDate: '', isRecurring: false });
      load();
    } catch (err) {
      setError(err.message || 'Failed to add holiday');
    }
  };

  const remove = async (id) => {
    try { await apiService.deleteHrHoliday(id); load(); } catch (err) { setError(err.message || 'Failed to delete holiday'); }
  };

  const upcoming = rows
    .filter((h) => (daysUntil(h.holiday_date) ?? -1) >= 0)
    .sort((a, b) => dayjs(a.holiday_date).valueOf() - dayjs(b.holiday_date).valueOf());
  const next = upcoming[0];
  const recurringCount = rows.filter((h) => h.is_recurring).length;

  const whenLabel = (date) => {
    const n = daysUntil(date);
    if (n === null) return '';
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n > 1) return `In ${n} days`;
    return 'Passed';
  };

  return (
    <HrPage
      title="Holidays"
      description="HR holiday calendar"
      subtitle="Manage the company holiday calendar used for attendance and leave calculations."
      actions={(
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600, px: 2.5, boxShadow: 'none' }}>
          New Holiday
        </Button>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={200} sx={{ mb: 3 }}>
        <StatTile icon={IconCalendarEvent} tone="primary" label="Holidays" value={rows.length} loading={loading} />
        <StatTile icon={IconCalendarDue} tone="info" label="Upcoming" value={upcoming.length} loading={loading} />
        <StatTile icon={IconRepeat} tone="secondary" label="Recurring yearly" value={recurringCount} loading={loading} />
        <StatTile
          icon={IconConfetti}
          tone="success"
          label={next ? next.name : 'Next holiday'}
          value={next ? fmtDate(next.holiday_date, 'DD MMM') : '—'}
          hint={next ? whenLabel(next.holiday_date) : 'None scheduled'}
          loading={loading}
        />
      </StatGrid>

      <SectionCard
        icon={IconCalendarEvent}
        title="Holiday calendar"
        subtitle={loading ? 'Loading…' : `${rows.length} holiday${rows.length !== 1 ? 's' : ''}`}
        noPadding
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IconCalendarEvent}
            title="No holidays configured"
            message="Add public and company holidays so they are excluded from attendance and leave."
            action={<Button variant="outlined" startIcon={<IconPlus size={16} />} onClick={() => setFormOpen(true)} sx={{ borderRadius: 2, fontWeight: 600 }}>New Holiday</Button>}
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Holiday</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Repeats</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((h) => {
                  const past = (daysUntil(h.holiday_date) ?? 0) < 0;
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                          <DateBadge date={h.holiday_date} past={past} />
                          <Box minWidth={0}>
                            <Typography variant="body2" fontWeight={600} color={past ? 'text.secondary' : 'text.primary'} noWrap>{h.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{whenLabel(h.holiday_date)}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{fmtDate(h.holiday_date) || h.holiday_date}</Typography>
                        <Typography variant="caption" color="text.secondary">{fmtDate(h.holiday_date, 'dddd')}</Typography>
                      </TableCell>
                      <TableCell>
                        {h.is_recurring
                          ? <StatusChip tone="info" label="Every year" />
                          : <StatusChip tone="default" label="One-off" />}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => remove(h.id)} sx={{ borderRadius: 1.5 }}>
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>New holiday</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={inputSx}
              />
              <DatePicker
                label="Date"
                value={form.holidayDate ? dayjs(form.holidayDate) : null}
                onChange={(v) => setForm({ ...form, holidayDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
                slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
              />
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5 }}>
                <FormControlLabel control={<Checkbox checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />} label="Recurs every year" sx={{ display: 'flex' }} />
              </Box>
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!form.name || !form.holidayDate} sx={{ borderRadius: 2, fontWeight: 600 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default HolidayCalendar;
