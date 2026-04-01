import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  Autocomplete,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { IconArrowLeft, IconPlus, IconTrash, IconSettings } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import WorkTypesManageDialog from './WorkTypesManageDialog';
import TaskStatusSegments from './TaskStatusSegments';

const WO_STATUS_OPTIONS = ['draft', 'in_progress', 'completed', 'cancelled'];
const DURATION_UNITS = ['minutes', 'hours', 'days'];

const emptyTask = () => ({
  workTypeId: null,
  typeOfWork: '',
  expense: '',
  durationValue: '',
  durationUnit: 'hours',
  startDate: '',
  endDate: '',
  assignedTo: null,
  status: 'not_started',
  notes: '',
});

const WorkOrderForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  const [form, setForm] = useState({
    dealId: searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null,
    title: '',
    notes: '',
    status: 'draft',
    tasks: [emptyTask()],
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getUsers({ pageSize: 500 });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setUsers(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await apiService.getDeals({ pageSize: 500 });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setDeals(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchWorkTypes = useCallback(async () => {
    try {
      const res = await apiService.getWorkTypes({});
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setWorkTypes(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const parseDuration = (raw) => {
    if (!raw) return { durationValue: '', durationUnit: 'hours' };
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*(minutes?|hours?|days?)$/i);
    if (match) {
      const unit = match[2].toLowerCase().replace(/s$/, '') + (match[2].toLowerCase().endsWith('s') ? 's' : '');
      const normalized = ['minutes', 'hours', 'days'].find(u => u.startsWith(match[2].toLowerCase().replace(/s$/, ''))) || 'hours';
      return { durationValue: match[1], durationUnit: normalized };
    }
    return { durationValue: raw, durationUnit: 'hours' };
  };

  const fetchWorkOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getWorkOrder(id);
      if (res.success) {
        const wo = res.data;
        setForm({
          dealId: wo.deal_id || null,
          title: wo.title || '',
          notes: wo.notes || '',
          status: wo.status || 'draft',
          tasks: (wo.tasks || []).map(t => {
            const dur = parseDuration(t.estimated_duration);
            return {
              workTypeId: t.work_type_id || null,
              typeOfWork: t.type_of_work || t.workType?.name || '',
              expense: t.expense != null ? String(t.expense) : '',
              durationValue: dur.durationValue,
              durationUnit: dur.durationUnit,
              startDate: t.start_date || '',
              endDate: t.end_date || '',
              assignedTo: t.assigned_to || null,
              status: t.status || 'not_started',
              notes: t.notes || '',
            };
          }),
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUsers();
    fetchDeals();
    fetchWorkTypes();
    if (isEdit) fetchWorkOrder();
  }, [fetchUsers, fetchDeals, fetchWorkTypes, fetchWorkOrder, isEdit]);

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setTask = (idx, field, value) => {
    setForm(f => {
      const tasks = [...f.tasks];
      tasks[idx] = { ...tasks[idx], [field]: value };
      return { ...f, tasks };
    });
  };

  const setTaskWorkType = (idx, workTypeId) => {
    setForm(f => {
      const tasks = [...f.tasks];
      const prev = tasks[idx];
      const wt = workTypes.find(w => w.id === workTypeId);
      const id = workTypeId || null;
      tasks[idx] = {
        ...prev,
        workTypeId: id,
        typeOfWork: wt ? wt.name : prev.workTypeId ? '' : prev.typeOfWork,
      };
      return { ...f, tasks };
    });
  };

  const addTask = () => setForm(f => ({ ...f, tasks: [...f.tasks, emptyTask()] }));

  const removeTask = (idx) => {
    setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        dealId: form.dealId || null,
        title: form.title || null,
        notes: form.notes || null,
        status: form.status,
        tasks: form.tasks
          .filter(t => t.workTypeId || t.typeOfWork || t.expense || t.durationValue || t.startDate || t.endDate || t.assignedTo)
          .map(t => ({
            workTypeId: t.workTypeId || null,
            typeOfWork: t.workTypeId ? null : (t.typeOfWork || null),
            expense: t.expense !== '' ? parseFloat(t.expense) : null,
            estimatedDuration: t.durationValue ? `${t.durationValue} ${t.durationUnit}` : null,
            startDate: t.startDate || null,
            endDate: t.endDate || null,
            assignedTo: t.assignedTo || null,
            status: t.status || 'not_started',
            notes: t.notes || null,
          })),
      };

      if (isEdit) {
        await apiService.updateWorkOrder(id, payload);
      } else {
        await apiService.createWorkOrder(payload);
      }

      if (form.dealId) {
        navigate(`/erp/deals/view/${form.dealId}`);
      } else {
        navigate('/erp/work-orders');
      }
    } catch (err) {
      setError(err.message || 'Failed to save work order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Work Order">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  const selectedDeal = deals.find(d => d.id === form.dealId) || null;

  return (
    <PageContainer title={isEdit ? 'Edit Work Order' : 'New Work Order'}>
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton
            onClick={() => form.dealId ? navigate(`/erp/deals/view/${form.dealId}`) : navigate('/erp/work-orders')}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <IconArrowLeft size={18} />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {isEdit ? 'Edit Work Order' : 'New Work Order'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Update work order details and tasks' : 'Create a work order with tasks for a deal'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Header card */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="overline" color="text.secondary" letterSpacing={1.2} display="block" mb={0.5}>
              Overview
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Work order details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={deals}
                  getOptionLabel={d => `${d.deal_number || d.id} — ${d.title || ''}`}
                  value={selectedDeal}
                  onChange={(_, v) => setField('dealId', v?.id || null)}
                  renderInput={params => (
                    <TextField {...params} label="Deal" placeholder="Select deal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Site clearance work order"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {WO_STATUS_OPTIONS.map(s => (
                    <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Paper>

        {/* Tasks */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="overline" color="text.secondary" letterSpacing={1.2} display="block" mb={0.5}>
                  Tasks
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>Work tasks</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Choose a type of work per row; manage the list with Types.
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<IconPlus size={16} />}
                onClick={addTask}
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                Add task
              </Button>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2.5}>
              {form.tasks.map((task, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    borderLeftWidth: 4,
                    borderLeftColor: 'primary.main',
                    borderLeftStyle: 'solid',
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
                      <Box
                        sx={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: 1.5,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box minWidth={0}>
                        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
                          Task
                        </Typography>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {task.typeOfWork || `Untitled task ${idx + 1}`}
                        </Typography>
                      </Box>
                    </Stack>
                    {form.tasks.length > 1 && (
                      <IconButton size="small" onClick={() => removeTask(idx)} color="error" sx={{ p: 0.5 }} aria-label="Remove task">
                        <IconTrash size={18} />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={0.8} display="block" mb={1.5}>
                      Type & effort
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={0.5}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                            <TextField
                              select
                              fullWidth
                              label="Type of work"
                              value={task.workTypeId ?? ''}
                              onChange={e => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                setTaskWorkType(idx, v);
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                              <MenuItem value="">
                                <em>Select type</em>
                              </MenuItem>
                              {workTypes.map(wt => (
                                <MenuItem key={wt.id} value={wt.id}>
                                  {wt.name}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Button
                              variant="outlined"
                              size="medium"
                              startIcon={<IconSettings size={18} />}
                              onClick={() => setManageTypesOpen(true)}
                              sx={{ flexShrink: 0, borderRadius: 2, px: 2, alignSelf: { xs: 'stretch', sm: 'flex-start' }, mt: { sm: 0.5 } }}
                            >
                              Manage types
                            </Button>
                          </Stack>
                          {task.typeOfWork && !task.workTypeId && (
                            <Typography variant="caption" color="warning.main">
                              Legacy label: {task.typeOfWork} — select a type to link it.
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          label="Expense"
                          type="number"
                          value={task.expense}
                          onChange={e => setTask(idx, 'expense', e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">AED</InputAdornment>,
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <TextField
                            label="Duration"
                            type="number"
                            value={task.durationValue}
                            onChange={e => setTask(idx, 'durationValue', e.target.value)}
                            inputProps={{ min: 0, step: '1' }}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                          <TextField
                            select
                            label="Unit"
                            value={task.durationUnit}
                            onChange={e => setTask(idx, 'durationUnit', e.target.value)}
                            sx={{ width: 108, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          >
                            {DURATION_UNITS.map(u => (
                              <MenuItem key={u} value={u}>{u}</MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={0.8} display="block" mb={1.5}>
                      Schedule
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Start date"
                          type="date"
                          value={task.startDate}
                          onChange={e => setTask(idx, 'startDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="End date"
                          type="date"
                          value={task.endDate}
                          onChange={e => setTask(idx, 'endDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={0.8} display="block" mb={1.5}>
                      Assignment & status
                    </Typography>
                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          options={users}
                          getOptionLabel={u => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || ''}
                          value={users.find(u => u.id === task.assignedTo) || null}
                          onChange={(_, v) => setTask(idx, 'assignedTo', v?.id || null)}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Assigned to"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.75} fontWeight={600}>
                          Task status
                        </Typography>
                        <TaskStatusSegments
                          value={task.status}
                          onChange={v => setTask(idx, 'status', v)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label="Notes"
                          value={task.notes}
                          onChange={e => setTask(idx, 'notes', e.target.value)}
                          placeholder="Optional details for this task…"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              ))}
            </Stack>

            <Box
              onClick={addTask}
              sx={{
                mt: 2.5,
                py: 2,
                px: 2,
                borderRadius: 2.5,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.2s, background-color 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} color="primary.main">
                <IconPlus size={20} stroke={2} />
                <Typography variant="body2" fontWeight={700}>
                  Add another task
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Paper>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => form.dealId ? navigate(`/erp/deals/view/${form.dealId}`) : navigate('/erp/work-orders')}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Work Order' : 'Create Work Order'}
          </Button>
        </Stack>

        <WorkTypesManageDialog
          open={manageTypesOpen}
          onClose={() => setManageTypesOpen(false)}
          onSaved={fetchWorkTypes}
        />
      </Box>
    </PageContainer>
  );
};

export default WorkOrderForm;
