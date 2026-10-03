import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Button, Stack,
} from '@mui/material';
import {
  IconClipboardCheck, IconHourglass, IconCalendarStats, IconUsers, IconCheck, IconX,
} from '@tabler/icons-react';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, PersonCell, EmptyState, LoadingBlock,
  tableSx, fmtDate,
} from '../components/HrUi';

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

  const totalDays = rows.reduce((sum, r) => sum + (parseFloat(r.days_count) || 0), 0);
  const people = new Set(rows.map((r) => r.employee?.id ?? `${r.employee?.first_name}-${r.employee?.last_name}`)).size;

  return (
    <HrPage
      title="Leave Approvals"
      description="Leave requests awaiting your approval"
      subtitle="Scoped to your direct reports unless you have full HR access."
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={200} sx={{ mb: 3 }}>
        <StatTile icon={IconHourglass} tone="warning" label="Pending approvals" value={rows.length} loading={loading} />
        <StatTile icon={IconCalendarStats} tone="primary" label="Days requested" value={totalDays} loading={loading} />
        <StatTile icon={IconUsers} tone="info" label="Employees" value={people} loading={loading} />
      </StatGrid>

      <SectionCard
        icon={IconClipboardCheck}
        title="Awaiting your decision"
        subtitle={loading ? 'Loading…' : `${rows.length} pending request${rows.length === 1 ? '' : 's'}`}
        noPadding
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState icon={IconClipboardCheck} title="All caught up" message="There are no pending leave requests to review." compact />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <PersonCell person={r.employee} secondary={r.employee?.employee_code} size={32} />
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500}>{r.leaveType?.name || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {fmtDate(r.start_date) || r.start_date}
                        {r.end_date && r.end_date !== r.start_date ? ` – ${fmtDate(r.end_date) || r.end_date}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{r.days_count}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" color={r.reason ? 'text.secondary' : 'text.disabled'} sx={{ wordBreak: 'break-word' }}>{r.reason || '—'}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="contained" color="success" startIcon={<IconCheck size={16} />} onClick={() => approve(r.id)} sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}>Approve</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<IconX size={16} />} onClick={() => reject(r.id)} sx={{ borderRadius: 2, fontWeight: 600 }}>Reject</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </HrPage>
  );
};

export default LeaveApprovalQueue;
