import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconCash, IconEdit, IconLock } from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../../services/api';
import {
  SectionCard, EmptyState, LoadingBlock, StatusChip, DetailGrid, DetailItem, tableSx, inputSx, dialogPaperProps,
  fmtDate, fmtMoney, humanize,
} from '../../../components/HrUi';

/** Sum of the visible compensation fields, folding in transport_allowance silently so a
 * legacy non-zero value still counts toward the displayed total. */
export const compTotal = (s) => (
  (parseFloat(s?.basic_salary) || 0)
  + (parseFloat(s?.housing_allowance) || 0)
  + (parseFloat(s?.transport_allowance) || 0)
  + (parseFloat(s?.other_allowance) || 0)
);

const PARTS = [
  { key: 'basic_salary', label: 'Basic salary', tone: 'primary' },
  { key: 'housing_allowance', label: 'Housing allowance', tone: 'secondary' },
  { key: 'other_allowance', label: 'Supplement allowance', tone: 'success' },
  { key: 'transport_allowance', label: 'Transport (legacy)', tone: 'warning', hideIfZero: true },
];

const PackageSummary = ({ active }) => {
  const total = compTotal(active);
  const parts = PARTS
    .map((p) => ({ ...p, value: parseFloat(active[p.key]) || 0 }))
    .filter((p) => !(p.hideIfZero && !p.value));
  return (
    <Box>
      <Box sx={{
        p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, mb: 2.5,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
        border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.18),
      }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Total monthly package
        </Typography>
        <Typography variant="h2" fontWeight={800} color="primary.main" sx={{ letterSpacing: '-0.02em', mt: 0.25 }}>
          {fmtMoney(total)}
        </Typography>
        {total > 0 && (
          <Stack direction="row" sx={{ height: 8, borderRadius: 4, overflow: 'hidden', mt: 1.75, bgcolor: 'divider' }}>
            {parts.filter((p) => p.value > 0).map((p) => (
              <Box key={p.key} sx={{ width: `${(p.value / total) * 100}%`, bgcolor: (t) => t.palette[p.tone].main }} />
            ))}
          </Stack>
        )}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 1.5 }}>
        {parts.map((p) => (
          <Box key={p.key} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: (t) => t.palette[p.tone].main }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.label}</Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight={700} mt={0.5}>{fmtMoney(p.value)}</Typography>
          </Box>
        ))}
      </Box>
      <DetailGrid min={160} sx={{ mt: 2.5 }}>
        <DetailItem label="Effective from" value={fmtDate(active.effective_from)} />
        <DetailItem label="Payment method" value={humanize(active.payment_method)} />
        <DetailItem label="Commission eligible" value={active.commission_eligible === undefined ? '' : (active.commission_eligible ? 'Yes' : 'No')} />
      </DetailGrid>
    </Box>
  );
};

const HistoryTable = ({ rows }) => (
  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Table size="small" sx={{ ...tableSx, minWidth: 620 }}>
      <TableHead>
        <TableRow>
          <TableCell>Effective from</TableCell>
          <TableCell align="right">Basic</TableCell>
          <TableCell align="right">Housing</TableCell>
          <TableCell align="right">Supplement</TableCell>
          <TableCell align="right">Total</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id} hover>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(s.effective_from) || '—'}</TableCell>
            <TableCell align="right">{fmtMoney(s.basic_salary || 0)}</TableCell>
            <TableCell align="right">{fmtMoney(s.housing_allowance || 0)}</TableCell>
            <TableCell align="right">{fmtMoney(s.other_allowance || 0)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(compTotal(s))}</TableCell>
            <TableCell>
              {s.is_active === undefined ? null : (
                <StatusChip tone={s.is_active ? 'success' : 'default'} label={s.is_active ? 'Active' : 'Superseded'} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const emptySalaryEditValues = () => ({ basicSalary: '', housingAllowance: '', otherAllowance: '', effectiveFrom: new Date().toISOString().slice(0, 10) });

/** HR-only edit dialog — Basic/Housing/Supplement with a live total. Saves through the
 * effective-dated salary-structure endpoint (closes the prior active row, opens a new one).
 * Transport allowance is intentionally not editable and is always sent as 0. */
const CompensationEditDialog = ({ open, onClose, employeeId, onSaved, current }) => {
  const [values, setValues] = useState(emptySalaryEditValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues({
      ...emptySalaryEditValues(),
      ...(current && {
        basicSalary: current.basic_salary ?? '',
        housingAllowance: current.housing_allowance ?? '',
        otherAllowance: current.other_allowance ?? '',
      }),
    });
    setError('');
  }, [open, current]);

  const liveTotal = (parseFloat(values.basicSalary) || 0) + (parseFloat(values.housingAllowance) || 0) + (parseFloat(values.otherAllowance) || 0);

  const submit = async () => {
    setError('');
    if (!values.basicSalary || parseFloat(values.basicSalary) <= 0) {
      setError('Basic Salary is required and must be greater than zero');
      return;
    }
    if ((values.housingAllowance && parseFloat(values.housingAllowance) < 0)
      || (values.otherAllowance && parseFloat(values.otherAllowance) < 0)) {
      setError('Housing and Supplement Allowance cannot be negative');
      return;
    }
    if (!values.effectiveFrom) {
      setError('Effective From date is required');
      return;
    }
    setSaving(true);
    try {
      await apiService.setHrSalaryStructure(employeeId, {
        basicSalary: parseFloat(values.basicSalary),
        housingAllowance: parseFloat(values.housingAllowance) || 0,
        transportAllowance: 0,
        otherAllowance: parseFloat(values.otherAllowance) || 0,
        effectiveFrom: values.effectiveFrom,
      });
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save compensation');
    } finally {
      setSaving(false);
    }
  };

  const money = (key, label, required) => (
    <TextField
      fullWidth type="number" label={label} required={required}
      inputProps={{ min: 0, step: 0.01 }}
      InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }}
      value={values[key]}
      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      sx={inputSx}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Update compensation</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Saving creates a new salary structure from the effective date and closes the current one.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {money('basicSalary', 'Basic salary', true)}
            {money('housingAllowance', 'Housing allowance')}
            {money('otherAllowance', 'Supplement allowance')}
            <DatePicker
              label="Effective from"
              value={values.effectiveFrom ? dayjs(values.effectiveFrom) : null}
              onChange={(nv) => setValues((v) => ({ ...v, effectiveFrom: nv ? nv.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { fullWidth: true, required: true, sx: inputSx } }}
            />
          </Box>
        </LocalizationProvider>
        <Stack
          direction="row" justifyContent="space-between" alignItems="center" mt={2.5} p={2}
          sx={{ borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}
        >
          <Typography variant="body2" fontWeight={600} color="text.secondary">Total monthly</Typography>
          <Typography variant="h5" fontWeight={800} color="primary.main">{fmtMoney(liveTotal)}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving} sx={{ borderRadius: 2 }}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Compensation card. Self mode respects the employee's salaryVisible flag and reads the
 * self-service history; HR mode is always visible and editable.
 */
const CompensationSection = ({ isSelf, employee, employeeId, salaryHistory, hrSalaryHistory, hrSalaryLoaded, onSaved }) => {
  const [editOpen, setEditOpen] = useState(false);

  if (isSelf && employee.salaryVisible === false) {
    return (
      <SectionCard icon={IconCash} title="Compensation">
        <EmptyState compact icon={IconLock} title="Managed by HR" message="Your compensation details are managed by HR and are not shown here." />
      </SectionCard>
    );
  }

  const active = isSelf ? employee.activeSalaryStructure : hrSalaryHistory.find((s) => s.is_active);
  const history = isSelf ? (salaryHistory?.history || []) : hrSalaryHistory;
  const historyLoading = isSelf ? !salaryHistory : !hrSalaryLoaded;

  return (
    <SectionCard
      icon={IconCash}
      title="Compensation"
      subtitle="Monthly salary structure"
      action={!isSelf && (
        <Button size="small" variant="outlined" startIcon={<IconEdit size={15} />} onClick={() => setEditOpen(true)} sx={{ borderRadius: 2 }}>
          {active ? 'Update' : 'Set salary'}
        </Button>
      )}
    >
      {active ? <PackageSummary active={active} /> : (
        historyLoading && !isSelf ? <LoadingBlock py={3} /> : (
          <EmptyState compact icon={IconCash} title="No active salary" message="No salary structure is on record yet." />
        )
      )}

      <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1.25}>Salary history</Typography>
      {historyLoading ? <LoadingBlock py={2} /> : history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No salary history yet.</Typography>
      ) : <HistoryTable rows={history} />}

      {!isSelf && (
        <CompensationEditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          employeeId={employeeId}
          onSaved={onSaved}
          current={active}
        />
      )}
    </SectionCard>
  );
};

export default CompensationSection;
