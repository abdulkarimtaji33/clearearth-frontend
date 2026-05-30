import React, { useState, useEffect } from 'react';
import {
  Box,
  TableRow,
  TableCell,
  Typography,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Popover,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../../services/api';
import TaskStatusSegments, { taskStatusColor } from './TaskStatusSegments';

export const WO_STATUS_COLORS = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const WO_STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const WO_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'];

export const WoStatusChip = ({ wo, onUpdated, onError }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [saving, setSaving] = useState(false);

  const allTasksDone = wo.tasks && wo.tasks.length > 0 &&
    wo.tasks.every(t => t.status === 'completed');
  const hasIncompleteTasks = wo.tasks && wo.tasks.some(t => t.status !== 'completed');

  const handleSelect = async (status) => {
    setAnchorEl(null);
    if (status === wo.status) return;
    setSaving(true);
    try {
      await apiService.updateWorkOrder(wo.id, { status });
      onUpdated?.(wo.id, status);
    } catch (err) {
      onError?.(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Chip
        label={saving ? <CircularProgress size={12} color="inherit" /> : WO_STATUS_LABELS[wo.status] || wo.status}
        size="small"
        color={WO_STATUS_COLORS[wo.status] || 'default'}
        onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
        sx={{ fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, py: 0.5, boxShadow: theme.shadows[8] } }}
      >
        {WO_STATUSES.map((s) => {
          const isCompleted = s === 'completed';
          const disabled = isCompleted && hasIncompleteTasks;
          return (
            <Tooltip
              key={s}
              title={disabled ? 'Complete all tasks before marking work order as completed' : ''}
              placement="right"
            >
              <span>
                <MenuItem
                  onClick={() => !disabled && handleSelect(s)}
                  selected={s === wo.status}
                  disabled={disabled}
                  sx={{ fontSize: '0.85rem', py: 0.75, gap: 1 }}
                >
                  <Chip
                    label={WO_STATUS_LABELS[s]}
                    size="small"
                    color={WO_STATUS_COLORS[s] || 'default'}
                    sx={{ fontWeight: 600, pointerEvents: 'none', minWidth: 100 }}
                  />
                  {s === wo.status && <IconCheck size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                </MenuItem>
              </span>
            </Tooltip>
          );
        })}
      </Popover>
    </>
  );
};

export const TaskStatusRowControl = ({ taskId, workOrderId, currentStatus, onUpdated }) => {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newStatus) => {
    if (!newStatus || newStatus === currentStatus) return;
    setUpdating(true);
    try {
      await apiService.updateWorkOrderTaskStatus(workOrderId, taskId, newStatus);
      onUpdated(taskId, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box sx={{ width: { xs: '100%', sm: 220 }, maxWidth: '100%' }}>
      <TaskStatusSegments
        value={currentStatus}
        onChange={handleChange}
        loading={updating}
        compact
      />
    </Box>
  );
};

/**
 * Expandable work order row + nested task rows (status segments). Used on work order list and deal view.
 */
export const WorkOrderRow = ({
  wo,
  onDelete,
  onStatusUpdated,
  onError,
  showDealSubtext = true,
  showViewDealInMenu = true,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [tasks, setTasks] = useState(wo.tasks || []);

  useEffect(() => {
    setTasks(wo.tasks || []);
  }, [wo.id, wo.tasks]);

  const handleTaskStatusUpdate = (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& td': { borderBottom: expanded ? 'none' : undefined } }}
        onClick={() => navigate(`/erp/work-orders/view/${wo.id}`)}
      >
        <TableCell sx={{ width: 40, pr: 0 }} onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600}>{wo.title || `Work Order #${wo.id}`}</Typography>
          {showDealSubtext && wo.deal && (
            <Typography variant="caption" color="text.secondary">
              {wo.deal.deal_number} — {wo.deal.title}
            </Typography>
          )}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <WoStatusChip wo={wo} onUpdated={onStatusUpdated} onError={onError} />
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</Typography>
            {tasks.length > 0 && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ({tasks.filter((t) => t.status === 'completed').length} done)
              </Typography>
            )}
          </Stack>
        </TableCell>
        <TableCell>
          {wo.createdByUser
            ? `${wo.createdByUser.first_name || ''} ${wo.createdByUser.last_name || ''}`.trim() || '-'
            : '-'}
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {wo.created_at ? new Date(wo.created_at).toLocaleDateString() : '-'}
          </Typography>
        </TableCell>
        <TableCell align="right" onClick={e => e.stopPropagation()}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor(e.currentTarget);
            }}
          >
            <IconDotsVertical size={18} />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mx: 2,
                mb: 1.5,
                mt: 0,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.background.default, 0.6),
              }}
            >
              {tasks.length === 0 ? (
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No tasks in this work order.
                  </Typography>
                </Box>
              ) : (
                tasks.map((task, idx) => {
                  const statusColor = taskStatusColor(theme, task.status);

                  return (
                    <Box
                      key={task.id}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        gap: 2,
                        px: 2.5,
                        py: 1.5,
                        borderBottom: idx < tasks.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                      }}
                    >
                      <Box
                        sx={{
                          mt: 0.4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: statusColor,
                          flexShrink: 0,
                          boxShadow: `0 0 0 3px ${alpha(statusColor, 0.15)}`,
                        }}
                      />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} mb={0.25}>
                          <Typography variant="body2" fontWeight={700}>
                            {task.type_of_work || task.workType?.name || `Task ${idx + 1}`}
                          </Typography>
                          {task.estimated_duration && (
                            <Chip
                              label={task.estimated_duration}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {(() => {
                            const expSum = task.expenses?.length
                              ? task.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
                              : (task.expense != null ? parseFloat(task.expense) : 0);
                            if (!expSum) return null;
                            const n = task.expenses?.length || 1;
                            return (
                              <Chip
                                label={n > 1 ? `AED ${expSum.toLocaleString()} (${n})` : `AED ${expSum.toLocaleString()}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            );
                          })()}
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ color: 'text.secondary' }}>
                          {task.assignedUser && (
                            <Typography variant="caption">
                              {[task.assignedUser.first_name, task.assignedUser.last_name].filter(Boolean).join(' ')}
                            </Typography>
                          )}
                          {task.start_date && (
                            <Typography variant="caption">
                              {task.start_date}
                              {task.end_date ? ` → ${task.end_date}` : ''}
                            </Typography>
                          )}
                          {task.notes && (
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                              {task.notes}
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      <Box
                        sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskStatusRowControl
                          taskId={task.id}
                          workOrderId={wo.id}
                          currentStatus={task.status}
                          onUpdated={handleTaskStatusUpdate}
                        />
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            navigate(`/erp/work-orders/view/${wo.id}`);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <IconEye size={16} />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/erp/work-orders/edit/${wo.id}`);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <IconEdit size={16} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {showViewDealInMenu && wo.deal_id && (
          <MenuItem
            onClick={() => {
              navigate(`/erp/deals/view/${wo.deal_id}`);
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <IconEye size={16} />
            </ListItemIcon>
            <ListItemText>View Deal</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            onDelete(wo);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <IconTrash size={16} color="currentColor" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
