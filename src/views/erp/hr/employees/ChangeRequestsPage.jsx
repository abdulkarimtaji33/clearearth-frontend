import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { IconCheck, IconX, IconUserEdit } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, EmptyState, LoadingBlock, StatusChip, fmtDate, dialogPaperProps, inputSx,
} from '../components/HrUi';

const humanizeKey = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/** HR queue for profile changes employees request from "My Profile". */
const ChangeRequestsPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiService.listHrChangeRequests();
      setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load change requests');
      setRows([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    setError('');
    try { await apiService.approveHrChangeRequest(id); await load(); } catch (err) { setError(err.message || 'Failed to approve'); } finally { setBusyId(null); }
  };

  const reject = async () => {
    setBusyId(rejecting.id);
    setError('');
    try {
      await apiService.rejectHrChangeRequest(rejecting.id, reason.trim());
      setRejecting(null);
      setReason('');
      await load();
    } catch (err) { setError(err.message || 'Failed to reject'); } finally { setBusyId(null); }
  };

  return (
    <HrPage title="Profile change requests" subtitle="Review changes employees asked to make to their own profile." back="/erp/hr/employees" backLabel="All employees">
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {rows === null ? (
        <LoadingBlock py={8} />
      ) : rows.length === 0 ? (
        <EmptyState icon={IconUserEdit} title="Nothing to review" message="Pending profile change requests will appear here." />
      ) : (
        <Stack spacing={2.5}>
          {rows.map((r) => {
            const emp = r.employee || {};
            const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${r.employee_id}`;
            return (
              <SectionCard
                key={r.id}
                icon={IconUserEdit}
                title={name}
                subtitle={`${emp.employee_code || ''} · requested ${fmtDate(r.created_at)}`}
                action={<StatusChip tone="warning" label="Pending" />}
              >
                <Stack spacing={1} mb={2}>
                  {Object.entries(r.changes || {}).map(([key, v]) => (
                    <Box key={key} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr 1fr' }, gap: 1, alignItems: 'baseline' }}>
                      <Typography variant="body2" fontWeight={600}>{humanizeKey(key)}</Typography>
                      <Typography variant="body2" color="text.secondary">From: {v?.old || '—'}</Typography>
                      <Typography variant="body2">To: <strong>{v?.new || '—'}</strong></Typography>
                    </Box>
                  ))}
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <Button variant="contained" size="small" startIcon={<IconCheck size={16} />} disabled={busyId === r.id} onClick={() => approve(r.id)} sx={{ borderRadius: 2 }}>Approve</Button>
                  <Button variant="outlined" color="error" size="small" startIcon={<IconX size={16} />} disabled={busyId === r.id} onClick={() => { setRejecting(r); setReason(''); }} sx={{ borderRadius: 2 }}>Reject</Button>
                  <Button color="inherit" size="small" onClick={() => navigate(`/erp/hr/employees/view/${r.employee_id}`)} sx={{ borderRadius: 2 }}>Open profile</Button>
                </Stack>
              </SectionCard>
            );
          })}
        </Stack>
      )}

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject change request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth multiline minRows={2} label="Reason (shown to the employee)" value={reason}
            onChange={(e) => setReason(e.target.value)} sx={{ ...inputSx, mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setRejecting(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={reject} disabled={!reason.trim() || busyId === rejecting?.id} sx={{ borderRadius: 2 }}>Reject</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default ChangeRequestsPage;
