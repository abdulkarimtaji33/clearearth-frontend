import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Button, Stack,
} from '@mui/material';
import dayjs from 'dayjs';
import {
  IconClipboardList, IconHourglass, IconCircleCheck, IconCircleX, IconCheck, IconX,
} from '@tabler/icons-react';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, PersonCell, EmptyState, LoadingBlock,
  tableSx, fmtDate,
} from '../components/HrUi';

const fmtTime = (t) => (t ? dayjs(t).format('HH:mm') : '');

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

  const count = (s) => rows.filter((r) => r.status === s).length;

  return (
    <HrPage
      title="Regularization Requests"
      description="HR attendance correction approval queue"
      subtitle="Review attendance corrections submitted by employees."
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={200} sx={{ mb: 3 }}>
        <StatTile icon={IconHourglass} tone="warning" label="Awaiting review" value={count('pending')} loading={loading} />
        <StatTile icon={IconCircleCheck} tone="success" label="Approved" value={count('approved')} loading={loading} />
        <StatTile icon={IconCircleX} tone="error" label="Rejected" value={count('rejected')} loading={loading} />
      </StatGrid>

      <SectionCard
        icon={IconClipboardList}
        title="Correction requests"
        subtitle={loading ? 'Loading…' : `${rows.length} request${rows.length === 1 ? '' : 's'}`}
        noPadding
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState icon={IconClipboardList} title="No requests" message="Attendance correction requests from employees will appear here." compact />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Requested in</TableCell>
                  <TableCell>Requested out</TableCell>
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
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} noWrap>{fmtDate(r.attendance_date) || r.attendance_date}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{fmtTime(r.requested_check_in) || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{fmtTime(r.requested_check_out) || '—'}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{r.reason || '—'}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right">
                      {r.status === 'pending' && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" color="success" startIcon={<IconCheck size={16} />} onClick={() => review(r.id, 'approved')} sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<IconX size={16} />} onClick={() => review(r.id, 'rejected')} sx={{ borderRadius: 2, fontWeight: 600 }}>Reject</Button>
                        </Stack>
                      )}
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

export default RegularizationRequestList;
