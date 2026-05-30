import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Stack, Chip, CircularProgress, Alert,
  Paper, Divider, Avatar, Tooltip, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
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
  IconAlertCircle, IconCircleCheck, IconNote, IconCheck, IconX,
  IconFileReport, IconPrinter, IconReceipt, IconFileInvoice, IconShoppingCart,
  IconMapPin, IconPhone, IconPackage, IconTruckDelivery,
} from '@tabler/icons-react';
import { TextField, InputAdornment, Autocomplete } from '@mui/material';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import TaskStatusSegments, { taskStatusColor } from './TaskStatusSegments';

const WO_STATUS_COLORS = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const expenseAccountsBadge = (ex) => {
  const st = String(ex.accounts_status || 'pending').toLowerCase();
  if (st === 'approved') return { label: 'Approved (Accounts)', color: 'success' };
  if (st === 'rejected') return { label: 'Rejected (Accounts)', color: 'error' };
  return { label: 'Pending Accounts approval', color: 'warning' };
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

const isPickupTask = (task) => /pickup/i.test(task.type_of_work || task.workType?.name || '');

const SortableTaskCard = ({ task, idx, tasks, workOrderId, onStatusUpdated, onNoteUpdated, onAssignDriver }) => {
  const theme = useTheme();
  const unlocked = isTaskUnlocked(tasks, idx);
  const statusColor = taskStatusColor(theme, task.status);
  const [updating, setUpdating] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(task.notes || '');
  const [savingNote, setSavingNote] = useState(false);

  // Sync note value when task prop changes externally
  useEffect(() => {
    if (!editingNote) setNoteValue(task.notes || '');
  }, [task.notes, editingNote]);

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

  const handleNoteSave = async () => {
    const trimmed = noteValue.trim();
    if (trimmed === (task.notes || '').trim()) { setEditingNote(false); return; }
    setSavingNote(true);
    try {
      await apiService.updateWorkOrderTaskNotes(workOrderId, task.id, trimmed);
      onNoteUpdated(task.id, trimmed);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
      setEditingNote(false);
    }
  };

  const handleNoteKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNoteSave(); }
    if (e.key === 'Escape') { setNoteValue(task.notes || ''); setEditingNote(false); }
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
              {(task.expenses && task.expenses.length > 0) ? (
                task.expenses.map((ex, exi) => {
                  const acc = expenseAccountsBadge(ex);
                  return (
                    <Stack key={ex.id ?? `ex-${exi}`} direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" sx={{ maxWidth: '100%', gap: 0.5 }}>
                      <IconCurrencyDollar size={13} style={{ opacity: 0.45, flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" noWrap title={ex.description || ''}>
                        {ex.description ? `${ex.description}: ` : ''}AED {parseFloat(ex.amount).toLocaleString()}
                      </Typography>
                      <Chip size="small" label={acc.label} color={acc.color} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }} />
                    </Stack>
                  );
                })
              ) : task.expense != null ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconCurrencyDollar size={13} style={{ opacity: 0.45 }} />
                  <Typography variant="caption" color="text.secondary">AED {parseFloat(task.expense).toLocaleString()}</Typography>
                </Stack>
              ) : null}
            </Stack>

            {/* Notes — inline editable */}
            {editingNote ? (
              <Box sx={{ mt: 1 }} onClick={e => e.stopPropagation()}>
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  size="small"
                  placeholder="Add a note for this task…"
                  value={noteValue}
                  onChange={e => setNoteValue(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  disabled={savingNote}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.82rem' } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="Save (Enter)">
                            <IconButton size="small" onClick={handleNoteSave} disabled={savingNote} color="primary" sx={{ borderRadius: 1 }}>
                              {savingNote ? <CircularProgress size={14} /> : <IconCheck size={14} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel (Esc)">
                            <IconButton size="small" onClick={() => { setNoteValue(task.notes || ''); setEditingNote(false); }} sx={{ borderRadius: 1 }}>
                              <IconX size={14} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            ) : (
              <Box
                onClick={e => { e.stopPropagation(); if (unlocked) { setNoteValue(task.notes || ''); setEditingNote(true); } }}
                sx={{
                  mt: 1,
                  px: 1.5, py: 0.75,
                  borderRadius: 1.5,
                  border: '1px dashed',
                  borderColor: task.notes ? alpha(theme.palette.info.main, 0.3) : alpha(theme.palette.divider, 0.8),
                  bgcolor: task.notes ? alpha(theme.palette.info.main, 0.04) : 'transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.75,
                  cursor: unlocked ? 'text' : 'default',
                  transition: 'border-color 0.15s, background 0.15s',
                  '&:hover': unlocked ? { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.03) } : {},
                }}
              >
                <IconNote size={13} style={{ marginTop: 2, flexShrink: 0, opacity: task.notes ? 0.7 : 0.35, color: task.notes ? theme.palette.info.main : theme.palette.text.disabled }} />
                <Typography
                  variant="caption"
                  color={task.notes ? 'text.secondary' : 'text.disabled'}
                  sx={{ fontStyle: task.notes ? 'italic' : 'normal', lineHeight: 1.5 }}
                >
                  {task.notes || (unlocked ? 'Click to add a note…' : '')}
                </Typography>
              </Box>
            )}

            {/* Assign to driver button for Pickup tasks */}
            {isPickupTask(task) && onAssignDriver && (
              <Box sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant={task.assignedUser ? 'outlined' : 'contained'}
                  color="primary"
                  startIcon={<IconTruckDelivery size={15} />}
                  onClick={e => { e.stopPropagation(); onAssignDriver(task); }}
                  sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', py: 0.5 }}
                >
                  {task.assignedUser
                    ? `Driver: ${[task.assignedUser.first_name, task.assignedUser.last_name].filter(Boolean).join(' ')}`
                    : 'Assign to driver'}
                </Button>
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
  const [reportOpen, setReportOpen] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [dealQuotationId, setDealQuotationId] = useState(null);
  const [dealProformaId, setDealProformaId] = useState(null);
  const [dealTaxInvoiceId, setDealTaxInvoiceId] = useState(null);

  // Driver assignment dialog
  const [drivers, setDrivers] = useState([]);
  const [assignDialogTask, setAssignDialogTask] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  // Collection details sub-dialog
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectionFields, setCollectionFields] = useState({ pickup_location: '', pickup_contact_name: '', pickup_contact_number: '' });
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionError, setCollectionError] = useState('');
  const pendingAssignDriverId = useRef(null);

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
        setDealQuotationId(null);
        setDealProformaId(null);
        setDealTaxInvoiceId(null);
        const deal = res.data.deal;
        if (deal?.id) {
          try {
            // Fetch quotations scoped to this deal, newest first
            const qRes = await apiService.getQuotations({ dealId: deal.id, pageSize: 100, sortBy: 'created_at', sortDir: 'desc' });
            const quotations = Array.isArray(qRes.data) ? qRes.data : qRes.data?.items || [];
            if (quotations.length > 0) {
              // Use the most recent (first) quotation for the deal
              const qid = quotations[0].id;
              setDealQuotationId(qid);
              // Scope proforma lookup to this deal so we never pick up another deal's invoice
              const pfRes = await apiService.getProformaInvoices({ dealId: deal.id, pageSize: 100 });
              const pfs = Array.isArray(pfRes.data) ? pfRes.data : pfRes.data?.items || [];
              const match = pfs.find(
                (p) => p.quotation_id === qid || p.quotation?.id === qid,
              );
              if (match?.id) {
                setDealProformaId(match.id);
                try {
                  const detail = await apiService.getProformaInvoice(match.id);
                  const ti = detail?.data?.taxInvoice;
                  if (ti?.id) setDealTaxInvoiceId(ti.id);
                } catch { /* ignore */ }
              }
            }
          } catch { /* no quotation / proforma */ }
        }
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

  const handleNoteUpdated = (taskId, notes) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes } : t));
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
          expenses: (t.expenses && t.expenses.length > 0)
            ? t.expenses.map(e => ({ description: e.description || null, amount: parseFloat(e.amount) }))
            : (t.expense != null ? [{ description: null, amount: parseFloat(t.expense) }] : []),
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

  // Fetch drivers once when the component mounts
  useEffect(() => {
    apiService.getAssignees().then(res => {
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
        setDrivers(all.filter(u => u.role?.name === 'driver'));
      }
    }).catch(() => {});
  }, []);

  const collectionComplete = () =>
    !!(wo?.deal?.pickup_location || wo?.deal?.pickup_contact_name || wo?.deal?.pickup_contact_number);

  const openAssignDialog = (task) => {
    setAssignDialogTask(task);
    setAssignDriverId(task.assigned_to || null);
    setAssignError('');
  };

  const closeAssignDialog = () => {
    setAssignDialogTask(null);
    setAssignDriverId(null);
    setAssignError('');
  };

  const handleAssignDriverSelect = (selectedUser) => {
    if (!selectedUser) { setAssignDriverId(null); return; }
    if (!collectionComplete()) {
      pendingAssignDriverId.current = selectedUser.id;
      setCollectionFields({ pickup_location: '', pickup_contact_name: '', pickup_contact_number: '' });
      setCollectionError('');
      setCollectionDialogOpen(true);
    } else {
      setAssignDriverId(selectedUser.id);
    }
  };

  const saveCollectionDetails = async () => {
    if (!collectionFields.pickup_location && !collectionFields.pickup_contact_name && !collectionFields.pickup_contact_number) {
      setCollectionError('Fill in at least one collection detail before assigning a driver');
      return;
    }
    if (!wo?.deal_id) {
      setCollectionError('No deal linked to this work order');
      return;
    }
    try {
      setCollectionSaving(true);
      setCollectionError('');
      await apiService.updateDeal(wo.deal_id, {
        pickupLocation: collectionFields.pickup_location,
        pickupContactName: collectionFields.pickup_contact_name,
        pickupContactNumber: collectionFields.pickup_contact_number,
      });
      // Update local wo.deal so collectionComplete() returns true
      setWo(prev => ({
        ...prev,
        deal: {
          ...prev.deal,
          pickup_location: collectionFields.pickup_location,
          pickup_contact_name: collectionFields.pickup_contact_name,
          pickup_contact_number: collectionFields.pickup_contact_number,
        },
      }));
      setAssignDriverId(pendingAssignDriverId.current);
      pendingAssignDriverId.current = null;
      setCollectionDialogOpen(false);
    } catch (err) {
      setCollectionError(err.message || 'Failed to save collection details');
    } finally {
      setCollectionSaving(false);
    }
  };

  const confirmAssignDriver = async () => {
    if (!assignDialogTask) return;
    if (assignDriverId && !collectionComplete()) {
      setAssignError('Collection details are required before assigning a driver.');
      return;
    }
    try {
      setAssigning(true);
      setAssignError('');
      const res = await apiService.updateWorkOrderTaskAssignment(wo.id, assignDialogTask.id, assignDriverId);
      if (res?.success) {
        const updatedTask = res.data;
        setTasks(prev => prev.map(t => t.id === assignDialogTask.id ? { ...t, assigned_to: updatedTask.assigned_to, assignedUser: updatedTask.assignedUser } : t));
      }
      closeAssignDialog();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const markComplete = async () => {
    try {
      setMarkingComplete(true);
      setError('');
      await apiService.updateWorkOrder(id, { status: 'completed' });
      await fetchWorkOrder();
    } catch (err) {
      setError(err.message || 'Failed to mark complete');
    } finally {
      setMarkingComplete(false);
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
  const allTasksDone = tasks.length > 0 && completedCount === tasks.length;
  const purchaseBill = wo.purchase_bill || wo.purchaseBill;
  const isOtpDeal = wo.deal?.deal_type === 'offer_to_purchase';
  const vendorSupplierId = wo.deal?.downstream_partner_supplier_id || wo.deal?.supplier_id;
  const taskExpenseTotal = (t) => {
    if (t.expenses?.length) return t.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    return t.expense != null ? parseFloat(t.expense) : 0;
  };
  const totalExpense = tasks.reduce((sum, t) => sum + taskExpenseTotal(t), 0);

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
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {wo.status === 'completed' && dealQuotationId && !dealProformaId && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconFileInvoice size={16} />}
                onClick={() => navigate(`/erp/proforma-invoices/create/${dealQuotationId}?return=/erp/work-orders/view/${wo.id}`)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Create Proforma Invoice
              </Button>
            )}
            {wo.status === 'completed' && dealProformaId && !dealTaxInvoiceId && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconReceipt size={16} />}
                onClick={() => navigate(`/erp/tax-invoices/create/${dealProformaId}?return=/erp/work-orders/view/${wo.id}`)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Create Tax Invoice
              </Button>
            )}
            {wo.status === 'completed' && dealTaxInvoiceId && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<IconReceipt size={16} />}
                onClick={() => navigate(`/erp/tax-invoices/view/${dealTaxInvoiceId}`)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                View Tax Invoice
              </Button>
            )}
            {wo.status === 'completed' && isOtpDeal && vendorSupplierId && (
              <Button
                variant={purchaseBill ? 'outlined' : 'contained'}
                color="secondary"
                startIcon={<IconShoppingCart size={16} />}
                onClick={() => {
                  if (purchaseBill?.id) {
                    navigate(`/erp/purchase-orders/edit/${purchaseBill.id}?bill=1`);
                  } else {
                    navigate(`/erp/purchase-orders/create?dealId=${wo.deal_id}&supplierId=${vendorSupplierId}&workOrderId=${wo.id}&bill=1`);
                  }
                }}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {purchaseBill ? 'Edit Purchase Bill' : 'Create Purchase Bill'}
              </Button>
            )}
            {wo.status === 'completed' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<IconFileReport size={16} />}
                onClick={() => setReportOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Completion Report
              </Button>
            )}
            {wo.status !== 'completed' && wo.status !== 'cancelled' && (
              <Tooltip title={!allTasksDone ? 'Complete all tasks before marking work order as completed' : ''}>
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={!allTasksDone || markingComplete}
                    startIcon={markingComplete ? <CircularProgress size={16} color="inherit" /> : <IconCircleCheck size={16} />}
                    onClick={markComplete}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    {markingComplete ? 'Completing…' : 'Mark as Complete'}
                  </Button>
                </span>
              </Tooltip>
            )}
            {wo.status === 'completed' && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<IconPackage size={16} />}
                onClick={() => navigate(`/erp/grn/create?workOrderId=${wo.id}`)}
                sx={{ borderRadius: 2, fontWeight: 700, color: 'white' }}
              >
                Create GRN
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<IconEdit size={16} />}
              onClick={() => navigate(`/erp/work-orders/edit/${wo.id}`)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Edit
            </Button>
          </Stack>
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

        {/* ── Collection details banner ── */}
        {wo.deal && (wo.deal.pickup_location || wo.deal.pickup_contact_name || wo.deal.pickup_contact_number) ? (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2.5, px: 2.5, py: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.04), borderColor: alpha(theme.palette.info.main, 0.25) }}
          >
            <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={0.8} color="info.main" display="block" mb={1.25}>
              Collection details (driver)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
              {wo.deal.pickup_location && (
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  startIcon={<IconMapPin size={16} />}
                  href={wo.deal.pickup_location}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Open on Maps
                </Button>
              )}
              {wo.deal.pickup_contact_name && (
                <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconUser size={15} style={{ opacity: 0.6 }} /> {wo.deal.pickup_contact_name}
                </Typography>
              )}
              {wo.deal.pickup_contact_number && (
                <Typography
                  component="a"
                  href={`tel:${wo.deal.pickup_contact_number}`}
                  variant="body2"
                  fontWeight={600}
                  color="info.main"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  <IconPhone size={15} /> {wo.deal.pickup_contact_number}
                </Typography>
              )}
            </Stack>
          </Paper>
        ) : wo.deal ? (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2.5, px: 2.5, py: 1.5, mb: 3, bgcolor: alpha(theme.palette.warning.main, 0.04), borderColor: alpha(theme.palette.warning.main, 0.3) }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconAlertCircle size={16} color={theme.palette.warning.main} />
              <Typography variant="body2" color="warning.dark">
                No collection details on this deal — the driver will not see a Maps link or contact info.{' '}
                <Typography
                  component="span"
                  variant="body2"
                  color="primary.main"
                  sx={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                  onClick={() => navigate(`/erp/deals/edit/${wo.deal_id}`)}
                >
                  Add them now
                </Typography>
              </Typography>
            </Stack>
          </Paper>
        ) : null}

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
                        onNoteUpdated={handleNoteUpdated}
                        onAssignDriver={isPickupTask(task) ? openAssignDialog : null}
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

      {/* ── Assign Driver Dialog ── */}
      <Dialog open={Boolean(assignDialogTask)} onClose={closeAssignDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTruckDelivery size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Assign to driver</Typography>
              <Typography variant="caption" color="text.secondary">
                {assignDialogTask?.type_of_work || assignDialogTask?.workType?.name || 'Pickup task'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {assignError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{assignError}</Alert>}
          {!collectionComplete() && (
            <Alert
              severity="warning"
              sx={{ mb: 2, borderRadius: 2 }}
              action={
                <Button size="small" color="warning" onClick={() => { setCollectionFields({ pickup_location: '', pickup_contact_name: '', pickup_contact_number: '' }); setCollectionError(''); setCollectionDialogOpen(true); }}>
                  Add now
                </Button>
              }
            >
              No collection details on this deal. Add them first so the driver sees pickup info.
            </Alert>
          )}
          <Autocomplete
            options={drivers}
            getOptionLabel={u => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || ''}
            value={drivers.find(u => u.id === assignDriverId) || null}
            onChange={(_, user) => handleAssignDriverSelect(user)}
            renderInput={params => (
              <TextField {...params} label="Select driver" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          />
          {assignDriverId && collectionComplete() && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              Collection details are set — driver will see location and contact info.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={closeAssignDialog} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            onClick={confirmAssignDriver}
            variant="contained"
            disabled={assigning}
            startIcon={assigning ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={16} />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {assigning ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Collection Details Sub-Dialog ── */}
      <Dialog open={collectionDialogOpen} onClose={() => setCollectionDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
          <Typography variant="h6" fontWeight={700}>Add collection details</Typography>
          <Typography variant="caption" color="text.secondary">Required before assigning a driver</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {collectionError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{collectionError}</Alert>}
          <Stack spacing={2} mt={0.5}>
            <TextField
              fullWidth label="Google Maps link"
              value={collectionFields.pickup_location}
              onChange={e => setCollectionFields(f => ({ ...f, pickup_location: e.target.value }))}
              placeholder="https://maps.google.com/…"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth label="Contact name"
              value={collectionFields.pickup_contact_name}
              onChange={e => setCollectionFields(f => ({ ...f, pickup_contact_name: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth label="Contact number"
              value={collectionFields.pickup_contact_number}
              onChange={e => setCollectionFields(f => ({ ...f, pickup_contact_number: e.target.value }))}
              placeholder="+971 50 000 0000"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={() => setCollectionDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            onClick={saveCollectionDetails}
            variant="contained"
            disabled={collectionSaving}
            startIcon={collectionSaving ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={16} />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {collectionSaving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Work Completion Report Dialog ── */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconFileReport size={20} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800}>Work Completion Report</Typography>
                <Typography variant="caption" color="text.secondary">Generated on {new Date().toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => window.print()} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <IconPrinter size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }} id="work-completion-report-content">
          <Divider sx={{ mb: 3 }} />

          {/* Deal & Work Order Details */}
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={1.5} textTransform="uppercase" fontSize="0.72rem" letterSpacing={0.8}>
              Work Order Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Work Order</Typography>
                <Typography variant="body2" fontWeight={600}>{wo.title || `#${wo.id}`}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'success.main', textTransform: 'capitalize' }}>{wo.status?.replace(/_/g, ' ')}</Typography>
              </Box>
              {wo.deal && (
                <>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Deal</Typography>
                    <Typography variant="body2">{wo.deal.deal_number} — {wo.deal.title}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Deal Type</Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{wo.deal.deal_type?.replace(/_/g, ' ')}</Typography>
                  </Box>
                  {wo.deal.company && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Client</Typography>
                      <Typography variant="body2">{wo.deal.company.company_name}</Typography>
                    </Box>
                  )}
                  {wo.deal.supplier && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Supplier</Typography>
                      <Typography variant="body2">{wo.deal.supplier.company_name}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Value</Typography>
                    <Typography variant="body2" fontWeight={700}>{wo.deal.currency || 'AED'} {parseFloat(wo.deal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                </>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Completed Date</Typography>
                <Typography variant="body2">{new Date().toLocaleDateString('en-AE')}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tasks Summary */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" fontSize="0.72rem" letterSpacing={0.8}>
                Tasks Performed ({tasks.length})
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Notes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary' }}>Expense (AED)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task, idx) => {
                    const exp = task.expenses?.length
                      ? task.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
                      : (task.expense != null ? parseFloat(task.expense) : 0);
                    return (
                      <TableRow key={task.id ?? idx}>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{task.type_of_work || task.workType?.name || `Task ${idx + 1}`}</TableCell>
                        <TableCell>
                          <Chip
                            label={task.status?.replace(/_/g, ' ')}
                            size="small"
                            color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'primary' : 'default'}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', maxWidth: 200 }}>{task.notes || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: exp > 0 ? 600 : 400 }}>
                          {exp > 0 ? exp.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {totalExpense > 0 && (
                    <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <TableCell colSpan={4} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Total Expenses</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'success.main' }}>
                        {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {wo.notes && (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1} textTransform="uppercase" fontSize="0.72rem" letterSpacing={0.8}>
                Work Order Notes
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{wo.notes}</Typography>
            </Paper>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled">
              This report was generated automatically upon work order completion. All tasks and expenses listed above are recorded in the system.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={() => setReportOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
          <Button variant="outlined" color="primary" onClick={() => { setReportOpen(false); navigate(`/erp/grn/create?workOrderId=${wo.id}`); }} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Create GRN
          </Button>
          <Button variant="contained" color="success" startIcon={<IconPrinter size={16} />} onClick={() => window.print()} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default WorkOrderView;
