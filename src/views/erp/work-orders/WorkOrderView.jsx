import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Chip, CircularProgress, Alert,
  Paper, Divider, Avatar, Tooltip, IconButton, LinearProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconArrowLeft, IconEdit, IconHammer, IconCalendar, IconUser,
  IconCurrencyDollar, IconClock, IconGripVertical, IconLock,
  IconAlertCircle, IconCircleCheck, IconNote,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import TaskStatusSegments, { taskStatusColor } from './TaskStatusSegments';

const WO_STATUS_COLORS = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const WO_STATUS_BG = (theme, status) => {
  const map = {
    draft: alpha(theme.palette.grey[500], 0.1),
    in_progress: alpha(theme.palette.primary.main, 0.08),
    completed: alpha(theme.palette.success.main, 0.08),
    cancelled: alpha(theme.palette.error.main, 0.08),
  };
  return map[status] || alpha(theme.palette.grey[500], 0.1);
};

/** Returns true if the task at `idx` is unlocked (can be interacted with). */
const isTaskUnlocked = (tasks, idx) => {
  if (idx === 0) return true;
  const prev = tasks[idx - 1];
  if (!prev) return true;
  // Unlocked if previous task is completed OR has a note
  return prev.status === 'completed' || Boolean(prev.notes?.trim());
};

// ─── Sortable task card ───────────────────────────────────────────────────────

const SortableTaskCard = ({ task, idx, tasks, workOrderId, onStatusUpdated, onOrderChange }) => {
  const theme = useTheme();
  const unlocked = isTaskUnlocked(tasks, idx);
  const statusColor = taskStatusColor(theme, task.status);
  const [updating, setUpdating] = useState(false);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id ?? `task-${idx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const handleStatusChange = async (newStatus) => {
    if (!unlocked || updating) return;
    setUpdating(true);
    try {
      await apiService.updateWorkOrderTaskStatus(workOrderId, task.id, newStatus);
      onStatusUpdated(task.id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const assigneeName = task.assignedUser
    ? [task.assignedUser.first_name, task.assignedUser.last_name].filter(Boolean).join(' ')
    : null;

  const initials = assigneeName
    ? assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: unlocked
          ? (task.status === 'completed' ? alpha(theme.palette.success.main, 0.3) : 'divider')
          : alpha(theme.palette.divider, 0.5),
        bgcolor: unlocked
          ? (task.status === 'completed' ? alpha(theme.palette.success.main, 0.03) : 'background.paper')
          : alpha(theme.palette.background.default, 0.7),
        transition: 'all 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <Box sx={{ height: 3, bgcolor: unlocked ? statusColor : theme.palette.divider, transition: 'background 0.2s' }} />

      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              mt: 0.3,
              cursor: 'grab',
              color: 'text.disabled',
              flexShrink: 0,
              '&:active': { cursor: 'grabbing' },
              touchAction: 'none',
            }}
          >
            <IconGripVertical size={18} />
          </Box>

          {/* Step number */}
          <Box
            sx={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              bgcolor: unlocked ? statusColor : theme.palette.divider,
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 800,
              transition: 'background 0.2s',
              mt: 0.1,
            }}
          >
            {task.status === 'completed' ? <IconCircleCheck size={14} /> : idx + 1}
          </Box>

          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.5}>
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  color: unlocked ? 'text.primary' : 'text.disabled',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  transition: 'color 0.2s',
                }}
              >
                {task.type_of_work || task.workType?.name || `Task ${idx + 1}`}
              </Typography>

              {!unlocked && (
                <Tooltip title={`Complete or add a note to Task ${idx} to unlock`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                    <IconLock size={14} />
                  </Box>
                </Tooltip>
              )}
            </Stack>

            {/* Meta row */}
            <Stack direction="row" flexWrap="wrap" gap={1.5} mb={task.notes ? 1 : 0}>
              {assigneeName && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}>
                    {initials}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">{assigneeName}</Typography>
                </Stack>
              )}
              {(task.start_date || task.end_date) && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconCalendar size={13} style={{ opacity: 0.45 }} />
                  <Typography variant="caption" color="text.secondary">
                    {task.start_date || '?'}{task.end_date ? ` → ${task.end_date}` : ''}
                  </Typography>
                </Stack>
              )}
              {task.estimated_duration && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconClock size={13} style={{ opacity: 0.45 }} />
                  <Typography variant="caption" color="text.secondary">{task.estimated_duration}</Typography>
                </Stack>
              )}
              {task.expense != null && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconCurrencyDollar size={13} style={{ opacity: 0.45 }} />
                  <Typography variant="caption" color="text.secondary">AED {parseFloat(task.expense).toLocaleString()}</Typography>
                </Stack>
              )}
            </Stack>

            {/* Notes */}
            {task.notes && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5, py: 1,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.06),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.info.main, 0.15),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.75,
                }}
              >
                <IconNote size={13} style={{ marginTop: 2, opacity: 0.6, color: theme.palette.info.main }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                  {task.notes}
                </Typography>
              </Box>
            )}

            {/* Unlock hint when locked */}
            {!unlocked && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5, py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.06),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.warning.main, 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                <IconAlertCircle size={13} style={{ color: theme.palette.warning.main, flexShrink: 0 }} />
                <Typography variant="caption" color="warning.dark">
                  Complete Task {idx} or add a note to it to unlock this task.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Status control */}
          <Box sx={{ flexShrink: 0, width: 210, mt: 0.25 }} onClick={e => e.stopPropagation()}>
            <TaskStatusSegments
              value={task.status}
              onChange={handleStatusChange}
              disabled={!unlocked}
              loading={updating}
              compact
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

const WorkOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [wo, setWo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const fetchWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getWorkOrder(id);
      if (res.success) {
        setWo(res.data);
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchWorkOrder(); }, [fetchWorkOrder]);

  const handleStatusUpdated = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => (t.id ?? `task-${tasks.indexOf(t)}`) === active.id);
    const newIndex = tasks.findIndex(t => (t.id ?? `task-${tasks.indexOf(t)}`) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);

    // Persist order to backend
    setReordering(true);
    try {
      await apiService.updateWorkOrder(id, {
        tasks: reordered.map((t, i) => ({
          id: t.id,
          workTypeId: t.work_type_id || null,
          typeOfWork: t.type_of_work || null,
          expense: t.expense != null ? parseFloat(t.expense) : null,
          estimatedDuration: t.estimated_duration || null,
          startDate: t.start_date || null,
          endDate: t.end_date || null,
          assignedTo: t.assigned_to || null,
          status: t.status || 'not_started',
          notes: t.notes || null,
          sortOrder: i,
        })),
      });
    } catch (err) {
      console.error('Failed to persist task order', err);
    } finally {
      setReordering(false);
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

  if (!wo) {
    return (
      <PageContainer title="Work Order">
        <Alert severity="error">Work order not found.</Alert>
      </PageContainer>
    );
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalExpense = tasks.reduce((sum, t) => sum + (t.expense != null ? parseFloat(t.expense) : 0), 0);

  return (
    <PageContainer title={wo.title || `Work Order #${wo.id}`}>
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 6 }}>

        {/* ── Header ── */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() => navigate('/erp/work-orders')}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <IconArrowLeft size={18} />
            </IconButton>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={0.25}>
                <Box
                  sx={{
                    width: 34, height: 34, borderRadius: 2,
                    bgcolor: WO_STATUS_BG(theme, wo.status),
                    color: wo.status === 'completed' ? 'success.main' : wo.status === 'cancelled' ? 'error.main' : 'primary.main',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <IconHammer size={18} />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  {wo.title || `Work Order #${wo.id}`}
                </Typography>
                <Chip
                  label={wo.status?.replace(/_/g, ' ')}
                  size="small"
                  color={WO_STATUS_COLORS[wo.status] || 'default'}
                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                />
              </Stack>
              {wo.deal && (
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ ml: 6.5, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate(`/erp/deals/view/${wo.deal_id}`)}
                >
                  {wo.deal.deal_number} — {wo.deal.title}
                </Typography>
              )}
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<IconEdit size={16} />}
            onClick={() => navigate(`/erp/work-orders/edit/${wo.id}`)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Edit
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Stats row ── */}
        <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
          {[
            {
              label: 'Tasks',
              value: `${completedCount} / ${tasks.length}`,
              sub: 'completed',
              color: theme.palette.primary.main,
            },
            {
              label: 'Progress',
              value: `${progress}%`,
              sub: 'overall',
              color: progress === 100 ? theme.palette.success.main : theme.palette.info.main,
            },
            totalExpense > 0 && {
              label: 'Total Expense',
              value: `AED ${totalExpense.toLocaleString()}`,
              sub: 'across all tasks',
              color: theme.palette.warning.main,
            },
            wo.createdByUser && {
              label: 'Created by',
              value: [wo.createdByUser.first_name, wo.createdByUser.last_name].filter(Boolean).join(' ') || wo.createdByUser.email,
              sub: wo.created_at ? new Date(wo.created_at).toLocaleDateString() : '',
              color: theme.palette.text.secondary,
            },
          ].filter(Boolean).map((stat, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{ borderRadius: 2.5, px: 2.5, py: 1.75, flex: '1 1 140px', minWidth: 130 }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} fontSize="0.65rem">
                {stat.label}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: stat.color, lineHeight: 1.3, mt: 0.25 }}>
                {stat.value}
              </Typography>
              {stat.sub && (
                <Typography variant="caption" color="text.disabled">{stat.sub}</Typography>
              )}
            </Paper>
          ))}
        </Stack>

        {/* ── Progress bar ── */}
        {tasks.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Box>
        )}

        {/* ── Notes ── */}
        {wo.notes && (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2.5, px: 2.5, py: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.03) }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <IconNote size={16} style={{ marginTop: 2, color: theme.palette.info.main, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} fontSize="0.65rem">
                  Work Order Notes
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{wo.notes}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* ── Tasks ── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 3, py: 2,
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} fontSize="0.7rem">
                Tasks
              </Typography>
              {tasks.length > 0 && (
                <Chip label={tasks.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              {reordering && <CircularProgress size={14} />}
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                Drag to reorder
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: 2.5 }}>
            {tasks.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <IconHammer size={36} style={{ opacity: 0.15, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">No tasks yet.</Typography>
                <Button
                  size="small" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}
                  onClick={() => navigate(`/erp/work-orders/edit/${wo.id}`)}
                >
                  Add tasks
                </Button>
              </Box>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={tasks.map(t => t.id ?? `task-${tasks.indexOf(t)}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={1.5}>
                    {tasks.map((task, idx) => (
                      <SortableTaskCard
                        key={task.id ?? idx}
                        task={task}
                        idx={idx}
                        tasks={tasks}
                        workOrderId={wo.id}
                        onStatusUpdated={handleStatusUpdated}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}
          </Box>
        </Paper>

        {/* ── Legend ── */}
        {tasks.length > 1 && (
          <Box sx={{ mt: 2, px: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <IconLock size={12} style={{ opacity: 0.4 }} />
              <Typography variant="caption" color="text.disabled">
                Tasks unlock sequentially — complete a task or add a note to enable the next one.
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </PageContainer>
  );
};

export default WorkOrderView;
