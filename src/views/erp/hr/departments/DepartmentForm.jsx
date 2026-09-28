import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Button, TextField, MenuItem, Alert, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

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

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;

  return (
    <PageContainer title={isEdit ? 'Edit Department' : 'New Department'} description="Department form">
      <Card sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>{isEdit ? 'Edit Department' : 'New Department'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField select label="Parent Department" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <MenuItem value="">None</MenuItem>
              {departments.filter((d) => String(d.id) !== id).map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Box display="flex" gap={2}>
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button onClick={() => navigate('/erp/hr/departments')}>Cancel</Button>
            </Box>
          </Stack>
        </form>
      </Card>
    </PageContainer>
  );
};

export default DepartmentForm;
