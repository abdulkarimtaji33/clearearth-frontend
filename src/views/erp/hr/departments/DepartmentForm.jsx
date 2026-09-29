import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, MenuItem, Alert, CircularProgress, Stack, Grid, Divider } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconBuildingCommunity } from '@tabler/icons-react';
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
      <Box sx={{ maxWidth: 900, width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/hr/departments')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Department' : 'New Department'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update department information' : 'Create a new department in the system'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <IconBuildingCommunity size={22} />
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  Department Information
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Basic department details and hierarchy
              </Typography>
              <Divider sx={{ mb: 4 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Parent Department"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 350 } } } }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {departments.filter((d) => String(d.id) !== id).map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/erp/hr/departments')}
              sx={{ minWidth: '140px', borderRadius: 2, fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              sx={{ minWidth: '160px', borderRadius: 2, fontWeight: 600 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </form>
      </Box>
    </PageContainer>
  );
};

export default DepartmentForm;
