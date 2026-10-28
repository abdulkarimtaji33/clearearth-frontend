import React, { useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Typography,
} from '@mui/material';
import { IconEdit } from '@tabler/icons-react';
import apiService from '../../../../../services/api';
import { SectionCard, DetailGrid, DetailItem, dialogPaperProps } from '../../components/HrUi';
import EmployeeFieldGrid, { useEmployeeLookups } from './EmployeeFieldGrid';
import { SECTIONS, displayFieldValue, valuesFromEmployee, diffValues } from './employeeSections';

/**
 * An employee profile section that HR edits in place: shows the values, and an Edit button opens
 * a dialog with every field of the section which saves straight to PUT /hr/employees/:id.
 * `section` is a key of SECTIONS. Read-only (no button) when `canEdit` is false.
 */
const HrSectionCard = ({ section, employee, canEdit, onSaved, min = 200 }) => {
  const def = SECTIONS[section];
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const needsLookups = def.fields.some((f) => f.type === 'lookup');
  const lookups = useEmployeeLookups(employee.id, open && needsLookups);

  const openDialog = () => {
    setValues(valuesFromEmployee(def.fields, employee));
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    const missing = def.fields.find((f) => f.required && !values[f.key]);
    if (missing) { setError(`${missing.label} is required`); return; }
    const patch = diffValues(def.fields, employee, values);
    if (!Object.keys(patch).length) { setOpen(false); return; }
    setSaving(true);
    setError('');
    try {
      await apiService.updateHrEmployee(employee.id, patch);
      setOpen(false);
      setToast(`${def.title} updated`);
      if (onSaved) await onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      icon={def.icon}
      title={def.title}
      subtitle={def.subtitle}
      action={canEdit && (
        <Button size="small" variant="outlined" startIcon={<IconEdit size={15} />} onClick={openDialog} sx={{ borderRadius: 2 }}>
          Edit
        </Button>
      )}
    >
      <DetailGrid min={min}>
        {def.fields.filter((f) => f.type !== 'textarea' || displayFieldValue(f, employee)).map((f) => (
          <DetailItem key={f.key} label={f.type === 'switch' ? 'Salary visible to employee' : f.label} value={displayFieldValue(f, employee)} />
        ))}
      </DetailGrid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Edit {def.title.toLowerCase()}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2.5}>Changes are saved to the employee record immediately.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <EmployeeFieldGrid
            fields={def.fields} values={values} lookups={lookups}
            onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </SectionCard>
  );
};

export default HrSectionCard;
