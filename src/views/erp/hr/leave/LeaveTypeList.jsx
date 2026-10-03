import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Checkbox, FormControlLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  IconPlus, IconEdit, IconCalendarStats, IconCoin, IconCoinOff, IconShieldCheck,
} from '@tabler/icons-react';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, EmptyState, LoadingBlock,
  tableSx, inputSx, dialogPaperProps,
} from '../components/HrUi';

const EMPTY = { name: '', code: '', isPaid: true, defaultAnnualDays: 0, requiresApproval: true };

const LeaveTypeList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getHrLeaveTypes();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, code: t.code, isPaid: t.is_paid, defaultAnnualDays: t.default_annual_days, requiresApproval: t.requires_approval });
    setFormOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await apiService.updateHrLeaveType(editing.id, form);
      else await apiService.createHrLeaveType(form);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to save leave type');
    }
  };

  const paidCount = rows.filter((t) => t.is_paid).length;
  const approvalCount = rows.filter((t) => t.requires_approval).length;

  return (
    <HrPage
      title="Leave Types"
      description="HR leave type configuration"
      subtitle="Configure the leave types employees can request and their yearly entitlements."
      actions={(
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate} sx={{ borderRadius: 2, fontWeight: 600, px: 2.5, boxShadow: 'none' }}>
          New Leave Type
        </Button>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatGrid min={200} sx={{ mb: 3 }}>
        <StatTile icon={IconCalendarStats} tone="primary" label="Leave types" value={rows.length} loading={loading} />
        <StatTile icon={IconCoin} tone="success" label="Paid" value={paidCount} loading={loading} />
        <StatTile icon={IconCoinOff} tone="secondary" label="Unpaid" value={rows.length - paidCount} loading={loading} />
        <StatTile icon={IconShieldCheck} tone="warning" label="Need approval" value={approvalCount} loading={loading} />
      </StatGrid>

      <SectionCard
        icon={IconCalendarStats}
        title="All leave types"
        subtitle={loading ? 'Loading…' : `${rows.length} leave type${rows.length !== 1 ? 's' : ''}`}
        noPadding
      >
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IconCalendarStats}
            title="No leave types configured"
            message="Create leave types such as Annual, Sick or Unpaid so employees can request time off."
            action={<Button variant="outlined" startIcon={<IconPlus size={16} />} onClick={openCreate} sx={{ borderRadius: 2, fontWeight: 600 }}>New Leave Type</Button>}
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...tableSx, minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Pay</TableCell>
                  <TableCell align="right">Annual days</TableCell>
                  <TableCell>Approval</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{t.name}</Typography></TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          fontFamily: 'monospace', fontSize: 12.5, px: 0.75, py: 0.25, borderRadius: 1,
                          bgcolor: 'action.hover', color: 'text.secondary',
                        }}
                      >
                        {t.code}
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip tone={t.is_paid ? 'success' : 'default'} label={t.is_paid ? 'Paid' : 'Unpaid'} /></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{t.default_annual_days}</Typography></TableCell>
                    <TableCell><StatusChip tone={t.requires_approval ? 'warning' : 'info'} label={t.requires_approval ? 'Required' : 'Auto-approved'} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(t)} sx={{ borderRadius: 1.5 }}>
                          <IconEdit size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit leave type' : 'New leave type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={inputSx} />
            <TextField label="Code" value={form.code} disabled={!!editing} helperText={editing ? 'Code cannot be changed after creation' : undefined} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={inputSx} />
            <TextField type="number" label="Default annual days" value={form.defaultAnnualDays} onChange={(e) => setForm({ ...form, defaultAnnualDays: e.target.value })} sx={inputSx} />
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5 }}>
              <FormControlLabel control={<Checkbox checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />} label="Paid leave" sx={{ display: 'flex' }} />
              <FormControlLabel control={<Checkbox checked={form.requiresApproval} onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })} />} label="Requires approval" sx={{ display: 'flex' }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ borderRadius: 2, fontWeight: 600 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </HrPage>
  );
};

export default LeaveTypeList;
