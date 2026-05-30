import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, CardContent, Typography, Button, Grid, Alert, CircularProgress,
  Stack, TextField, MenuItem, Autocomplete, IconButton, InputAdornment,
  Divider, Paper, Drawer, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  IconArrowLeft, IconPlus, IconTrash, IconSettings, IconEdit,
  IconX, IconCheck, IconClock, IconUser, IconCurrencyDollar,
  IconCalendar, IconHammer, IconGripVertical,
} from '@tabler/icons-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import WorkTypesManageDialog from './WorkTypesManageDialog';
import TaskStatusSegments from './TaskStatusSegments';

const WO_STATUS_OPTIONS = ['draft', 'in_progress', 'completed', 'cancelled'];
const DURATION_UNITS = ['minutes', 'hours', 'days'];

const STATUS_COLOR = {
  not_started: 'default',
  in_progress: 'warning',
  completed: 'success',
  blocked: 'error',
};

const emptyTask = () => ({
  workTypeId: null,
  typeOfWork: '',
  expenses: [{ description: '', amount: '', evidencePath: '', evidenceFileName: '' }],
  durationValue: '',
  durationUnit: 'hours',
  startDate: '',
  endDate: '',
  assignedTo: null,
  status: 'not_started',
  notes: '',
});

const sumTaskExpenses = (task) => {
  if (!Array.isArray(task.expenses)) return 0;
  return task.expenses.reduce((s, e) => {
    const v = parseFloat(e.amount);
    return s + (Number.isFinite(v) ? v : 0);
  }, 0);
};

const taskHasBillableContent = (t) => {
  if (t.workTypeId || (t.typeOfWork && String(t.typeOfWork).trim())) return true;
  if (sumTaskExpenses(t) > 0) return true;
  if (t.durationValue || t.startDate || t.endDate || t.assignedTo) return true;
  return false;
};

const SortableTaskRow = ({ task, idx, theme, getTaskLabel, getAssigneeName, STATUS_COLOR, openDrawer, removeTask }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `task-${idx}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 999 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      hover
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
      onClick={() => openDrawer(idx)}
    >
      <TableCell sx={{ width: 28, pr: 0, cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        onClick={e => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={15} style={{ opacity: 0.35, display: 'block' }} />
      </TableCell>
      <TableCell>
        <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
          {idx + 1}
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{getTaskLabel(task)}</Typography>
        {task.notes && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>{task.notes}</Typography>}
      </TableCell>
      <TableCell>
        {getAssigneeName(task)
          ? <Stack direction="row" alignItems="center" spacing={0.5}><IconUser size={13} style={{ opacity: 0.4 }} /><Typography variant="body2">{getAssigneeName(task)}</Typography></Stack>
          : <Typography variant="body2" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell>
        {task.startDate || task.endDate ? (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconCalendar size={13} style={{ opacity: 0.4 }} />
            <Typography variant="body2" fontSize="0.78rem">
              {task.startDate || '?'}{task.endDate ? ` → ${task.endDate}` : ''}
            </Typography>
          </Stack>
        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell>
        {sumTaskExpenses(task) > 0
          ? (
            <Stack spacing={0.25}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconCurrencyDollar size={13} style={{ opacity: 0.4 }} />
                <Typography variant="body2" fontWeight={600}>AED {sumTaskExpenses(task).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </Stack>
              {(task.expenses || []).filter(e => e.amount !== '' && Number.isFinite(parseFloat(e.amount))).length > 1 && (
                <Typography variant="caption" color="text.secondary">{task.expenses.filter(e => e.amount !== '' && Number.isFinite(parseFloat(e.amount))).length} lines</Typography>
              )}
            </Stack>
          )
          : <Typography variant="body2" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell>
        <Chip
          label={(task.status || 'not_started').replace(/_/g, ' ')}
          size="small"
          color={STATUS_COLOR[task.status] || 'default'}
          sx={{ fontWeight: 600, fontSize: '0.68rem' }}
        />
      </TableCell>
      <TableCell align="right" onClick={e => e.stopPropagation()}>
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Edit task">
            <IconButton size="small" onClick={() => openDrawer(idx)} sx={{ borderRadius: 1.5 }}>
              <IconEdit size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove task">
            <IconButton size="small" onClick={() => removeTask(idx)} color="error" sx={{ borderRadius: 1.5 }}>
              <IconTrash size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

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
  const defaultTaskSeeded = useRef(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTaskIdx, setDrawerTaskIdx] = useState(null);
  const [drawerTask, setDrawerTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = parseInt(active.id.replace('task-', ''), 10);
    const newIdx = parseInt(over.id.replace('task-', ''), 10);
    if (isNaN(oldIdx) || isNaN(newIdx)) return;
    setForm(f => ({ ...f, tasks: arrayMove(f.tasks, oldIdx, newIdx) }));
  };

  const [form, setForm] = useState({
    dealId: searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null,
    title: '',
    notes: '',
    status: 'draft',
    tasks: [],
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getUsers({ pageSize: 500 });
      if (res.success) setUsers(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await apiService.getDeals({ pageSize: 500 });
      if (res.success) setDeals(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchWorkTypes = useCallback(async () => {
    try {
      const res = await apiService.getWorkTypes({});
      if (res.success) setWorkTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, []);

  const parseDuration = (raw) => {
    if (!raw) return { durationValue: '', durationUnit: 'hours' };
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*(minutes?|hours?|days?)$/i);
    if (match) {
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
            const expRows = (t.expenses && t.expenses.length > 0)
              ? t.expenses.map(e => ({
                description: e.description || '',
                amount: e.amount != null ? String(e.amount) : '',
                evidencePath: e.evidence_path || '',
                evidenceFileName: e.evidence_file_name || '',
              }))
              : (t.expense != null ? [{ description: '', amount: String(t.expense) }] : [{ description: '', amount: '' }]);
            return {
              workTypeId: t.work_type_id || null,
              typeOfWork: t.type_of_work || t.workType?.name || '',
              expenses: expRows,
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

  useEffect(() => {
    if (isEdit || defaultTaskSeeded.current || workTypes.length === 0) return;
    const defaults = workTypes.filter(w => w.is_default || w.isDefault);
    if (defaults.length === 0) return;
    setForm(f => {
      if (f.tasks.length > 0) return f;
      defaultTaskSeeded.current = true;
      return {
        ...f,
        tasks: defaults.map(wt => ({
          ...emptyTask(),
          workTypeId: wt.id,
          typeOfWork: wt.name || '',
        })),
      };
    });
  }, [workTypes, isEdit]);

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const openDrawer = (idx) => {
    const task = idx === 'new' ? emptyTask() : { ...form.tasks[idx] };
    setDrawerTaskIdx(idx);
    setDrawerTask(task);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerTaskIdx(null);
    setDrawerTask(null);
  };

  const setDrawerField = (field, value) => setDrawerTask(t => ({ ...t, [field]: value }));

  const setDrawerExpenseRow = (idx, field, value) => {
    setDrawerTask(t => {
      const expenses = [...(t.expenses || [{ description: '', amount: '', evidencePath: '', evidenceFileName: '' }])];
      expenses[idx] = { ...expenses[idx], [field]: value };
      return { ...t, expenses };
    });
  };

  const addDrawerExpenseRow = () => {
    setDrawerTask(t => ({ ...t, expenses: [...(t.expenses || []), { description: '', amount: '', evidencePath: '', evidenceFileName: '' }] }));
  };

  const removeDrawerExpenseRow = (idx) => {
    setDrawerTask(t => {
      const expenses = (t.expenses || []).filter((_, i) => i !== idx);
      return { ...t, expenses: expenses.length ? expenses : [{ description: '', amount: '', evidencePath: '', evidenceFileName: '' }] };
    });
  };

  const uploadExpenseEvidence = async (ei, file) => {
    if (!file) return;
    try {
      const res = await apiService.uploadExpenseEvidence(file);
      if (res.success) {
        setDrawerExpenseRow(ei, 'evidencePath', res.data.path);
        setDrawerExpenseRow(ei, 'evidenceFileName', res.data.fileName || file.name);
      }
    } catch (err) {
      setError(err.message || 'Evidence upload failed');
    }
  };

  const setDrawerWorkType = (workTypeId) => {
    const wt = workTypes.find(w => w.id === workTypeId);
    setDrawerTask(t => ({
      ...t,
      workTypeId: workTypeId || null,
      typeOfWork: wt ? wt.name : workTypeId ? '' : t.typeOfWork,
    }));
  };

  const saveDrawerTask = () => {
    setForm(f => {
      const tasks = [...f.tasks];
      if (drawerTaskIdx === 'new') {
        tasks.push(drawerTask);
      } else {
        tasks[drawerTaskIdx] = drawerTask;
      }
      return { ...f, tasks };
    });
    closeDrawer();
  };

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
          .filter(t => taskHasBillableContent(t))
          .map(t => ({
            workTypeId: t.workTypeId || null,
            typeOfWork: t.workTypeId ? null : (t.typeOfWork || null),
            expenses: (t.expenses || [])
              .filter(e => e.amount !== '' && Number.isFinite(parseFloat(e.amount)))
              .map(e => ({
                description: e.description?.trim() || null,
                amount: parseFloat(e.amount),
                evidencePath: e.evidencePath || null,
                evidenceFileName: e.evidenceFileName || null,
              })),
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
        navigate(`/erp/work-orders/view/${id}`);
      } else {
        await apiService.createWorkOrder(payload);
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

  const getTaskLabel = (task) => {
    if (task.workTypeId) return workTypes.find(w => w.id === task.workTypeId)?.name || task.typeOfWork || 'Task';
    return task.typeOfWork || 'Untitled task';
  };

  const getAssigneeName = (task) => {
    const u = users.find(u => u.id === task.assignedTo);
    return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email : null;
  };

  return (
    <PageContainer title={isEdit ? 'Edit Work Order' : 'New Work Order'}>
      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton
            onClick={() => form.dealId ? navigate(`/erp/deals/view/${form.dealId}`) : navigate('/erp/work-orders')}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <IconArrowLeft size={18} />
          </IconButton>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconHammer size={18} />
              </Box>
              <Typography variant="h4" fontWeight={800}>
                {isEdit ? 'Edit Work Order' : 'New Work Order'}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" ml={6}>
              {isEdit ? 'Update work order details and tasks' : 'Create a work order with tasks for a deal'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Overview card */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} fontSize="0.7rem">
              Work Order Details
            </Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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

        {/* Tasks card */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} fontSize="0.7rem">
                Tasks
              </Typography>
              {form.tasks.length > 0 && (
                <Chip label={form.tasks.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<IconSettings size={15} />}
                onClick={() => setManageTypesOpen(true)}
                sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              >
                Manage types
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<IconPlus size={15} />}
                onClick={() => openDrawer('new')}
                sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              >
                Add task
              </Button>
            </Stack>
          </Box>

          {form.tasks.length === 0 ? (
            <Box
              onClick={() => openDrawer('new')}
              sx={{
                py: 5, px: 3, textAlign: 'center', cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                transition: 'background 0.15s',
              }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <IconPlus size={22} />
              </Box>
              <Typography variant="body2" fontWeight={600} color="primary.main">Add your first task</Typography>
              <Typography variant="caption" color="text.secondary">Click to add a task to this work order</Typography>
            </Box>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={form.tasks.map((_, i) => `task-${i}`)} strategy={verticalListSortingStrategy}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                        <TableCell sx={{ width: 20, p: 0 }} />
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, width: 36 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type of Work</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Schedule</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expense</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                        <TableCell align="right" sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.tasks.map((task, idx) => (
                        <SortableTaskRow
                          key={idx}
                          task={task}
                          idx={idx}
                          theme={theme}
                          getTaskLabel={getTaskLabel}
                          getAssigneeName={getAssigneeName}
                          STATUS_COLOR={STATUS_COLOR}
                          openDrawer={openDrawer}
                          removeTask={removeTask}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SortableContext>
            </DndContext>
          )}

          {form.tasks.length > 0 && (
            <Box sx={{ px: 3, py: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Button size="small" startIcon={<IconPlus size={14} />} onClick={() => openDrawer('new')} sx={{ borderRadius: 2, color: 'text.secondary', fontSize: '0.78rem' }}>
                Add another task
              </Button>
            </Box>
          )}
        </Paper>

        {/* Actions */}
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
      </Box>

      {/* Task Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 480 },
            borderRadius: { sm: '16px 0 0 16px' },
            overflow: 'hidden',
          },
        }}
      >
        {drawerTask && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer header */}
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.04), flexShrink: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {drawerTaskIdx === 'new' ? 'Add Task' : `Edit Task ${drawerTaskIdx + 1}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Fill in the task details below</Typography>
                </Box>
                <IconButton size="small" onClick={closeDrawer} sx={{ borderRadius: 1.5 }}>
                  <IconX size={18} />
                </IconButton>
              </Stack>
            </Box>

            {/* Drawer body */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              <Stack spacing={3}>
                {/* Type & effort */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={1} display="block" mb={1.5}>
                    Type & Effort
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <TextField
                        select
                        fullWidth
                        label="Type of work"
                        value={drawerTask.workTypeId ?? ''}
                        onChange={e => setDrawerWorkType(e.target.value === '' ? null : Number(e.target.value))}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value=""><em>Select type</em></MenuItem>
                        {workTypes.map(wt => <MenuItem key={wt.id} value={wt.id}>{wt.name}</MenuItem>)}
                      </TextField>
                      <Tooltip title="Manage work types">
                        <IconButton onClick={() => setManageTypesOpen(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 0.5 }}>
                          <IconSettings size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    {drawerTask.typeOfWork && !drawerTask.workTypeId && (
                      <Typography variant="caption" color="warning.main">Legacy label: {drawerTask.typeOfWork} — select a type to link it.</Typography>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                        Expenses (one or more lines)
                      </Typography>
                      <Stack spacing={1.5}>
                        {(drawerTask.expenses || [{ description: '', amount: '' }]).map((row, ei) => (
                          <Stack key={ei} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Description"
                              value={row.description}
                              onChange={e => setDrawerExpenseRow(ei, 'description', e.target.value)}
                              placeholder="Optional"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              size="small"
                              label="Amount"
                              type="number"
                              value={row.amount}
                              onChange={e => setDrawerExpenseRow(ei, 'amount', e.target.value)}
                              inputProps={{ min: 0, step: '0.01' }}
                              InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }}
                              sx={{ minWidth: { sm: 160 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Button
                              component="label"
                              size="small"
                              variant={row.evidencePath ? 'contained' : 'outlined'}
                              color={row.evidencePath ? 'success' : 'inherit'}
                              sx={{ borderRadius: 2, mt: { sm: 0.5 }, whiteSpace: 'nowrap' }}
                            >
                              {row.evidenceFileName ? row.evidenceFileName.slice(0, 12) + (row.evidenceFileName.length > 12 ? '…' : '') : 'Evidence'}
                              <input type="file" hidden accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) uploadExpenseEvidence(ei, e.target.files[0]); e.target.value = ''; }} />
                            </Button>
                            {(drawerTask.expenses || []).length > 1 && (
                              <IconButton size="small" color="error" onClick={() => removeDrawerExpenseRow(ei)} sx={{ mt: { sm: 0.5 } }}>
                                <IconTrash size={16} />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                        <Button size="small" startIcon={<IconPlus size={14} />} onClick={addDrawerExpenseRow} sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
                          Add expense line
                        </Button>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        fullWidth
                        label="Duration"
                        type="number"
                        value={drawerTask.durationValue}
                        onChange={e => setDrawerField('durationValue', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        select
                        label="Unit"
                        value={drawerTask.durationUnit}
                        onChange={e => setDrawerField('durationUnit', e.target.value)}
                        sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {DURATION_UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </TextField>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                {/* Schedule */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={1} display="block" mb={1.5}>
                    Schedule
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      fullWidth
                      label="Start date"
                      type="date"
                      value={drawerTask.startDate}
                      onChange={e => setDrawerField('startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      fullWidth
                      label="End date"
                      type="date"
                      value={drawerTask.endDate}
                      onChange={e => setDrawerField('endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Assignment & status */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={1} display="block" mb={1.5}>
                    Assignment & Status
                  </Typography>
                  <Stack spacing={2}>
                    <Autocomplete
                      options={/pickup/i.test(drawerTask.typeOfWork || '') || /pickup/i.test(workTypes.find(wt => wt.id === drawerTask.workTypeId)?.name || '')
                        ? users.filter(u => u.role?.name === 'driver')
                        : users}
                      getOptionLabel={u => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || ''}
                      value={users.find(u => u.id === drawerTask.assignedTo) || null}
                      onChange={(_, v) => setDrawerField('assignedTo', v?.id || null)}
                      renderInput={params => (
                        <TextField {...params} label={/pickup/i.test(drawerTask.typeOfWork || '') ? 'Assign driver' : 'Assigned to'} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                    />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
                        Task status
                      </Typography>
                      <TaskStatusSegments
                        value={drawerTask.status}
                        onChange={v => setDrawerField('status', v)}
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {/* Notes */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontSize="0.65rem" letterSpacing={1} display="block" mb={1.5}>
                    Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Task notes"
                    value={drawerTask.notes}
                    onChange={e => setDrawerField('notes', e.target.value)}
                    placeholder="Optional details for this task…"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Drawer footer */}
            <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" onClick={closeDrawer} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={saveDrawerTask}
                  startIcon={<IconCheck size={16} />}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  {drawerTaskIdx === 'new' ? 'Add Task' : 'Save Task'}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <WorkTypesManageDialog
        open={manageTypesOpen}
        onClose={() => setManageTypesOpen(false)}
        onSaved={fetchWorkTypes}
      />
    </PageContainer>
  );
};

export default WorkOrderForm;
