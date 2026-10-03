import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, TextField, MenuItem, Alert, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router';
import { IconBuildingCommunity, IconDeviceFloppy } from '@tabler/icons-react';
import apiService from '../../../../services/api';
import { HrPage, SectionCard, LoadingBlock, inputSx } from '../components/HrUi';

const DepartmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState({ name: '', code: '', parentId: '', status: 'active' });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const listRes = await apiService.getHrDepartments({ pageSize: 200 });
      if (listRes.success) setDepartments(listRes.data || []);
      if (isEdit) {
        const res = await apiService.getHrDepartment(id);
        if (res.success) {
          const d = res.data;
          setForm({ name: d.name || '', code: d.code || '', parentId: d.parent_id || '', status: d.status || 'active' });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, code: form.code || null, parentId: form.parentId || null, status: form.status };
      if (isEdit) await apiService.updateHrDepartment(id, payload);
      else await apiService.createHrDepartment(payload);
      navigate('/erp/hr/departments');
    } catch (err) {
      setError(err.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? 'Edit Department' : 'New Department';

  return (
    <HrPage
      title={title}
      description="Department form"
      subtitle={isEdit ? 'Update department details and where it sits in the hierarchy.' : 'Add a department and place it in the organisation hierarchy.'}
      back="/erp/hr/departments"
      backLabel="Departments"
      maxWidth={760}
    >
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <SectionCard><LoadingBlock /></SectionCard>
      ) : (
        <form onSubmit={handleSubmit}>
          <SectionCard
            icon={IconBuildingCommunity}
            title="Department information"
            subtitle="Basic details and reporting hierarchy"
            contentSx={{ pb: 0 }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, pt: 1 }}>
              <TextField
                fullWidth
                label="Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={{ ...inputSx, gridColumn: { sm: '1 / -1' } }}
              />
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                helperText="Optional short code, e.g. FIN"
                sx={inputSx}
              />
              <TextField
                fullWidth
                select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                sx={inputSx}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Parent Department"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                helperText="Leave as None for a top-level department"
                sx={{ ...inputSx, gridColumn: { sm: '1 / -1' } }}
                SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}
              >
                <MenuItem value="">None</MenuItem>
                {departments.filter((d) => String(d.id) !== id).map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              sx={{
                mt: 3, mx: { xs: -2, sm: -2.5 }, px: { xs: 2, sm: 2.5 }, py: 2,
                borderTop: '1px solid', borderColor: 'divider',
                bgcolor: (t) => alpha(t.palette.text.primary, 0.025),
              }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/erp/hr/departments')}
                sx={{ minWidth: 110, borderRadius: 2, fontWeight: 600, borderColor: 'divider' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={<IconDeviceFloppy size={18} />}
                sx={{ minWidth: 130, borderRadius: 2, fontWeight: 600 }}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Stack>
          </SectionCard>
        </form>
      )}
    </HrPage>
  );
};

export default DepartmentForm;
