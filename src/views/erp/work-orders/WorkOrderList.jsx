import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import TaskStatusSegments, { taskStatusColor } from './TaskStatusSegments';

const WO_STATUS_COLORS = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const TaskStatusRowControl = ({ taskId, workOrderId, currentStatus, onUpdated }) => {
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

const WorkOrderRow = ({ wo, onDelete, onRefresh }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [tasks, setTasks] = useState(wo.tasks || []);

  const handleTaskStatusUpdate = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& td': { borderBottom: expanded ? 'none' : undefined } }}
        onClick={() => setExpanded(e => !e)}
      >
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600}>{wo.title || `Work Order #${wo.id}`}</Typography>
          {wo.deal && (
            <Typography variant="caption" color="text.secondary">
              {wo.deal.deal_number} — {wo.deal.title}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={wo.status?.replace(/_/g, ' ')}
            size="small"
            color={WO_STATUS_COLORS[wo.status] || 'default'}
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</Typography>
            {tasks.length > 0 && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ({tasks.filter(t => t.status === 'completed').length} done)
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
          <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}>
            <IconDotsVertical size={18} />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded tasks */}
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
                  <Typography variant="body2" color="text.secondary">No tasks in this work order.</Typography>
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
                      {/* Status indicator dot */}
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

                      {/* Task info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} mb={0.25}>
                          <Typography variant="body2" fontWeight={700}>
                            {task.type_of_work || `Task ${idx + 1}`}
                          </Typography>
                          {task.estimated_duration && (
                            <Chip label={task.estimated_duration} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {task.expense != null && (
                            <Chip label={`AED ${parseFloat(task.expense).toLocaleString()}`} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ color: 'text.secondary' }}>
                          {task.assignedUser && (
                            <Typography variant="caption">
                              👤 {[task.assignedUser.first_name, task.assignedUser.last_name].filter(Boolean).join(' ')}
                            </Typography>
                          )}
                          {task.start_date && (
                            <Typography variant="caption">
                              📅 {task.start_date}{task.end_date ? ` → ${task.end_date}` : ''}
                            </Typography>
                          )}
                          {task.notes && (
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                              {task.notes}
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      {/* Status */}
                      <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }} onClick={e => e.stopPropagation()}>
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
        <MenuItem onClick={() => { navigate(`/erp/work-orders/edit/${wo.id}`); setMenuAnchor(null); }}>
          <ListItemIcon><IconEdit size={16} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {wo.deal_id && (
          <MenuItem onClick={() => { navigate(`/erp/deals/view/${wo.deal_id}`); setMenuAnchor(null); }}>
            <ListItemIcon><IconEye size={16} /></ListItemIcon>
            <ListItemText>View Deal</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { onDelete(wo); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><IconTrash size={16} color="currentColor" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const WorkOrderList = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, pageSize: rowsPerPage };
      if (search) params.search = search;
      const res = await apiService.getWorkOrders(params);
      if (res.success) {
        setWorkOrders(Array.isArray(res.data) ? res.data : []);
        setTotalCount(res.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleDelete = async (wo) => {
    setDeleting(true);
    try {
      await apiService.deleteWorkOrder(wo.id);
      fetchWorkOrders();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer title="Work Orders" description="Manage work orders">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Work Orders</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage operations work orders across deals
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => navigate('/erp/work-orders/create')}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            New Work Order
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <TextField
                size="small"
                placeholder="Search work orders..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, backgroundColor: 'action.hover' },
                }}
                sx={{ minWidth: 280 }}
              />
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell sx={{ fontWeight: 700 }}>Title / Deal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tasks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : workOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No work orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrders.map(wo => (
                      <WorkOrderRow
                        key={wo.id}
                        wo={wo}
                        onDelete={handleDelete}
                        onRefresh={fetchWorkOrders}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default WorkOrderList;
