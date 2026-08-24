import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import {
  IconArrowLeft, IconHammer, IconCheck, IconX, IconClipboardList,
  IconBuilding, IconTruckDelivery, IconUser, IconFileDescription, IconMapPin,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import SelectWithAddNew from '../../../components/erp/SelectWithAddNew';
import apiService from '../../../services/api';
import useUnitsOfMeasure from '../../../hooks/useUnitsOfMeasure';
import { PAYMENT_METHOD_OPTIONS } from '../../../constants/paymentMethods';
import {
  PAID_TO_OPTIONS,
  PAID_TO_STORAGE_KEY,
  PAYMENT_METHOD_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../../constants/expenseFormOptions';

const WO_STATUS_COLORS = {
  new: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const ACC_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
};

const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const AccountsWorkOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { format: formatUomValue } = useUnitsOfMeasure();
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveCtx, setApproveCtx] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectCtx, setRejectCtx] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    expenseDate: '',
    paidTo: 'Operations',
    paymentMethod: 'Bank transfer',
    notes: '',
  });
  const [customPaidTo, setCustomPaidTo] = useState(() => loadStoredOptions(PAID_TO_STORAGE_KEY));
  const [customPaymentMethods, setCustomPaymentMethods] = useState(() => loadStoredOptions(PAYMENT_METHOD_STORAGE_KEY));

  const paidToOptions = useMemo(
    () => mergeSelectOptions(PAID_TO_OPTIONS, customPaidTo, form.paidTo),
    [customPaidTo, form.paidTo]
  );

  const paymentMethodOptions = useMemo(
    () => mergeSelectOptions(PAYMENT_METHOD_OPTIONS, customPaymentMethods, form.paymentMethod),
    [customPaymentMethods, form.paymentMethod]
  );

  const addCustomPaidTo = useCallback((v) => {
    setCustomPaidTo((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAID_TO_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const addCustomPaymentMethod = useCallback((v) => {
    setCustomPaymentMethods((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAYMENT_METHOD_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const fetchWo = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getAccountsWorkOrder(id);
      if (res.success) setWo(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWo();
  }, [fetchWo]);

  const expenseStats = useMemo(() => {
    if (!wo) return { pending: 0, approved: 0, rejected: 0, lines: 0 };
    const taskList = wo.tasks || [];
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    taskList.forEach((t) => {
      (t.expenses || []).forEach((ex) => {
        const st = (ex.accounts_status || 'pending').toLowerCase();
        if (st === 'approved') approved += 1;
        else if (st === 'rejected') rejected += 1;
        else pending += 1;
      });
    });
    return { pending, approved, rejected, lines: pending + approved + rejected };
  }, [wo]);

  const openApprove = (task, ex) => {
    const st = (ex.accounts_status || 'pending').toLowerCase();
    if (st === 'approved' || st === 'rejected') return;
    if (!wo) return;
    setApproveCtx({ task, ex });
    const woTitle = wo.title || `Work order #${wo.id}`;
    const taskLabel = task.type_of_work || task.workType?.name || 'Task';
    const lineDesc = (ex.description || '').trim();
    const notesParts = [woTitle, taskLabel, lineDesc].filter(Boolean);
    setForm({
      amount: String(ex.amount ?? ''),
      expenseDate: new Date().toISOString().slice(0, 10),
      paidTo: 'Operations',
      paymentMethod: 'Bank transfer',
      notes: notesParts.join(' · '),
    });
    setApproveOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!approveCtx || !wo) return;
    try {
      setSaving(true);
      setError('');
      await apiService.approveAccountsTaskExpense(wo.id, approveCtx.ex.id, {
        amount: num(form.amount),
        expenseDate: form.expenseDate,
        paidTo: form.paidTo.trim() || undefined,
        paymentMethod: form.paymentMethod || null,
        notes: form.notes || null,
      });
      setSuccess('Expense recorded');
      setApproveOpen(false);
      setApproveCtx(null);
      await fetchWo();
    } catch (e) {
      setError(e.message || 'Approve failed');
    } finally {
      setSaving(false);
    }
  };

  const openReject = (task, ex) => {
    const st = (ex.accounts_status || 'pending').toLowerCase();
    if (st !== 'pending') return;
    setRejectCtx({ task, ex });
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectCtx || !wo || !rejectReason.trim()) return;
    try {
      setSaving(true);
      setError('');
      await apiService.rejectAccountsTaskExpense(wo.id, rejectCtx.ex.id, rejectReason.trim());
      setSuccess('Expense rejected');
      setRejectOpen(false);
      setRejectCtx(null);
      await fetchWo();
    } catch (e) {
      setError(e.message || 'Reject failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Work order">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (!wo) {
    return (
      <PageContainer title="Work order">
        <Alert severity="error">{error || 'Not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/erp/accounts/work-orders')}>Back</Button>
      </PageContainer>
    );
  }

  const tasks = wo.tasks || [];
  const purchaseBills = wo.purchaseBills || [];

  const PAYMENT_STATUS_LABEL = {
    unpaid: { label: 'Unpaid', color: 'error' },
    partial: { label: 'Partially Paid', color: 'warning' },
    paid: { label: 'Paid', color: 'success' },
    advance_received: { label: 'Advance Received', color: 'info' },
    partial_advance: { label: 'Partial Advance', color: 'warning' },
    fully_received: { label: 'Fully Received', color: 'success' },
  };

  return (
    <PageContainer title={wo.title || `Work order #${wo.id}`}>
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 6 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/accounts/work-orders')} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.dark' }}>
                  <IconHammer size={22} />
                </Box>
                <Typography variant="h4" fontWeight={800}>{wo.title || `Work order #${wo.id}`}</Typography>
                <Chip label={wo.status?.replace(/_/g, ' ') || '—'} size="small" color={WO_STATUS_COLORS[wo.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
              </Stack>
              {wo.deal && (
                <Typography variant="body2" color="primary.main" sx={{ ml: { xs: 0, sm: 7 }, mt: 0.5, cursor: 'pointer' }} onClick={() => navigate(`/erp/deals/view/${wo.deal_id}`)}>
                  {wo.deal.deal_number} — {wo.deal.title}
                </Typography>
              )}
            </Box>
          </Stack>
          <Button variant="outlined" size="medium" onClick={() => navigate(`/erp/work-orders/view/${wo.id}`)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Operations view
          </Button>
        </Stack>

        {wo.deal && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <IconFileDescription size={18} style={{ opacity: 0.7 }} />
              <Typography variant="subtitle2" fontWeight={700}>Deal details</Typography>
              {wo.deal.is_rcm_applicable ? (
                <Chip size="small" label="RCM applicable" color="info" variant="outlined" sx={{ fontWeight: 700 }} />
              ) : null}
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2.5,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Deal</Typography>
                <Typography variant="body2" fontWeight={600}>{wo.deal.deal_number} — {wo.deal.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {(wo.deal.deal_type || '').replace(/_/g, ' ')} · {(wo.deal.status || '').replace(/_/g, ' ')}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconBuilding size={14} style={{ opacity: 0.6 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Client</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>{wo.deal.company?.company_name || '—'}</Typography>
                {wo.deal.contact && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {[wo.deal.contact.first_name, wo.deal.contact.last_name].filter(Boolean).join(' ')}
                    {wo.deal.contact.phone ? ` · ${wo.deal.contact.phone}` : ''}
                  </Typography>
                )}
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconTruckDelivery size={14} style={{ opacity: 0.6 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Vendor</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>{wo.deal.supplier?.company_name || '—'}</Typography>
                {wo.deal.downstreamPartner && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Downstream: {wo.deal.downstreamPartner.company_name}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Financials</Typography>
                <Typography variant="body2">
                  Subtotal: <strong>{wo.deal.currency || 'AED'} {num(wo.deal.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </Typography>
                <Typography variant="body2">
                  VAT ({num(wo.deal.vat_percentage)}%): <strong>{wo.deal.currency || 'AED'} {num(wo.deal.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </Typography>
                <Typography variant="body2">
                  Total: <strong>{wo.deal.currency || 'AED'} {num(wo.deal.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Source document</Typography>
                {wo.quotation ? (
                  <Typography
                    variant="body2"
                    color="primary.main"
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => navigate(`/erp/quotations/view/${wo.quotation.id}`)}
                  >
                    Quotation #{wo.quotation.id} ({wo.quotation.quotation_date || '—'})
                  </Typography>
                ) : wo.sourcePurchaseOrder ? (
                  <Typography
                    variant="body2"
                    color="primary.main"
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => navigate(`/erp/purchase-orders/view/${wo.sourcePurchaseOrder.id}`)}
                  >
                    PO #{wo.sourcePurchaseOrder.id} ({wo.sourcePurchaseOrder.po_date || '—'})
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
                {purchaseBills.length > 0 && (
                  <Typography
                    variant="caption"
                    color="primary.main"
                    display="block"
                    sx={{ cursor: 'pointer', fontWeight: 600, mt: 0.5 }}
                    onClick={() => navigate(`/erp/purchase-orders/view/${purchaseBills[0].id}`)}
                  >
                    {purchaseBills.length} purchase bill{purchaseBills.length !== 1 ? 's' : ''} →
                  </Typography>
                )}
              </Box>

              {(wo.deal.pickup_location || wo.deal.pickup_contact_name || wo.deal.pickup_contact_number) && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconMapPin size={14} style={{ opacity: 0.6 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Collection</Typography>
                  </Stack>
                  <Typography variant="body2">{wo.deal.pickup_location || '—'}</Typography>
                  {(wo.deal.pickup_contact_name || wo.deal.pickup_contact_number) && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {[wo.deal.pickup_contact_name, wo.deal.pickup_contact_number].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {expenseStats.lines > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 3, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <IconClipboardList size={18} style={{ opacity: 0.7 }} />
              <Typography variant="subtitle2" fontWeight={700}>Expense lines</Typography>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip size="small" variant="outlined" label={`${expenseStats.pending} pending`} color="warning" sx={{ fontWeight: 700 }} />
              <Chip size="small" variant="outlined" label={`${expenseStats.approved} approved`} color="success" sx={{ fontWeight: 700 }} />
              <Chip size="small" variant="outlined" label={`${expenseStats.rejected} rejected`} color="error" sx={{ fontWeight: 700 }} />
            </Stack>
          </Paper>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Approve each line to post to the expenses ledger. Rejected lines stay off the ledger.
        </Typography>

        {tasks.map((task, idx) => (
          <Paper key={task.id ?? idx} variant="outlined" sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
            <Box sx={{ height: 3, bgcolor: alpha(theme.palette.primary.main, 0.35) }} />
            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700} fontSize="0.95rem">
                Task {idx + 1}: {task.type_of_work || task.workType?.name || '—'}
              </Typography>
            </Box>
            {(!task.expenses || task.expenses.length === 0) && (
              <Box sx={{ p: 2 }}>
                {task.expense != null ? (
                  <Typography variant="body2" color="text.secondary">
                    This task uses a legacy single expense field (AED {num(task.expense).toFixed(2)}). Only structured expense lines can be approved — edit the work order in Operations to split into lines.
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">No expense lines on this task.</Typography>
                )}
              </Box>
            )}
            {task.expenses && task.expenses.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Amount</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Evidence</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Accounts</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Ledger</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {task.expenses.map((ex) => {
                      const st = (ex.accounts_status || 'pending').toLowerCase();
                      const meta = ACC_STATUS[st] || ACC_STATUS.pending;
                      return (
                        <TableRow key={ex.id}>
                          <TableCell>{ex.description || '—'}</TableCell>
                          <TableCell align="right">{num(ex.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            {ex.evidence_path ? (
                              <Button size="small" href={apiService.getUploadUrl(ex.evidence_path)} target="_blank" rel="noopener">
                                {ex.evidence_file_name || 'View'}
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 700 }} />
                            {st === 'rejected' && ex.rejection_reason && (
                              <Typography variant="caption" color="error.main" display="block" mt={0.5}>{ex.rejection_reason}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {ex.ledgerExpense ? (
                              <>
                                <Typography variant="caption" color="success.main" fontWeight={600} display="block">
                                  #{ex.ledgerExpense.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'capitalize' }}>
                                  {String(ex.ledgerExpense.category || '').replace(/_/g, ' ') || '—'}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {st === 'pending' && (
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <IconButton size="small" color="success" title="Approve" onClick={() => openApprove(task, ex)}>
                                  <IconCheck size={18} />
                                </IconButton>
                                <IconButton size="small" color="error" title="Reject" onClick={() => openReject(task, ex)}>
                                  <IconX size={18} />
                                </IconButton>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        ))}

        {purchaseBills.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700} fontSize="0.95rem">Purchase Bills — Payment Status</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>PO #</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Supplier</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Payment Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseBills.map((po) => {
                    const psMeta = PAYMENT_STATUS_LABEL[po.payment_status] || { label: po.payment_status || '—', color: 'default' };
                    const total = (po.items || []).reduce((s, i) => s + parseFloat(i.total_price || 0), 0);
                    return (
                      <TableRow key={po.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/purchase-orders/view/${po.id}`)}>
                        <TableCell>#{po.id}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{(po.document_type || '').replace(/_/g, ' ') || '—'}</TableCell>
                        <TableCell>{po.supplier?.company_name || po.company?.company_name || '—'}</TableCell>
                        <TableCell align="right">AED {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell><Chip size="small" label={psMeta.label} color={psMeta.color} sx={{ fontWeight: 700 }} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {wo.deal && (
          <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.success.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700} fontSize="0.95rem">Service Payment Status</Typography>
            </Box>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Stack spacing={1}>
                {(() => {
                  const payStatus = wo.deal.payment_status || 'unpaid';
                  const psMeta = PAYMENT_STATUS_LABEL[payStatus] || { label: payStatus.replace(/_/g, ' '), color: 'default' };
                  return (
                    <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary" sx={{ width: 160 }}>Purchase payment:</Typography>
                      <Chip label={psMeta.label} color={psMeta.color} sx={{ fontWeight: 700 }} size="small" />
                    </Stack>
                  );
                })()}
                {wo.deal.service_payment_status && (() => {
                  const sps = wo.deal.service_payment_status;
                  const spsMeta = PAYMENT_STATUS_LABEL[sps] || { label: sps.replace(/_/g, ' '), color: 'default' };
                  return (
                    <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary" sx={{ width: 160 }}>Service payment:</Typography>
                      <Chip label={spsMeta.label} color={spsMeta.color} sx={{ fontWeight: 700 }} size="small" />
                    </Stack>
                  );
                })()}
                {wo.deal.total != null && (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 160 }}>Deal total:</Typography>
                    <Typography variant="body2" fontWeight={700}>AED {parseFloat(wo.deal.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Paper>
        )}

        {wo.deal?.inspectionReport && (
          <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.info.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700} fontSize="0.95rem">Inspection Report</Typography>
            </Box>
            <Box sx={{ px: 2.5, py: 2 }}>
              {(() => {
                const r = wo.deal.inspectionReport;
                const rows = [
                  ['Inspection Date', r.inspection_datetime ? new Date(r.inspection_datetime).toLocaleString() : '—'],
                  ['Cargo Packing Type', r.cargo_type || '—'],
                  ['Approximate Weight', r.approximate_weight != null ? `${r.approximate_weight} ${formatUomValue(r.weight_uom, '')}`.trim() : '—'],
                  ['Approximate Value', r.approximate_value != null ? `AED ${parseFloat(r.approximate_value).toLocaleString()}` : '—'],
                  ['Transportation', r.transportation_arrangement || '—'],
                  ['Notes', r.notes || '—'],
                ];
                return (
                  <Table size="small">
                    <TableBody>
                      {rows.map(([label, value]) => (
                        <TableRow key={label}>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 600, width: 180, border: 0, py: 0.5 }}>{label}</TableCell>
                          <TableCell sx={{ border: 0, py: 0.5 }}>{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </Box>
          </Paper>
        )}

        <Dialog open={approveOpen} onClose={() => !saving && setApproveOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Approve expense</DialogTitle>
          <DialogContent>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              Ledger category and work order link are set automatically. Adjust payee, amount, date, or payment details if needed.
            </Typography>
            {wo && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                <Chip size="small" label="Category: Work orders" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                <Chip size="small" label={`WO #${wo.id}`} variant="outlined" sx={{ fontWeight: 700 }} />
              </Stack>
            )}
            <Stack spacing={2} sx={{ mt: 0 }}>
              <TextField label="Amount (AED)" size="small" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} fullWidth />
              <TextField label="Expense date" type="date" size="small" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <SelectWithAddNew
                label="Paid to"
                value={form.paidTo}
                onChange={(v) => setForm((f) => ({ ...f, paidTo: v }))}
                options={paidToOptions}
                addDialogTitle="Add payee"
                addDialogDescription="Add a new payee name for this and future expenses"
                addFieldLabel="Payee name"
                onOptionAdded={addCustomPaidTo}
              />
              <SelectWithAddNew
                label="Payment method"
                value={form.paymentMethod}
                onChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}
                options={paymentMethodOptions}
                addDialogTitle="Add payment method"
                addDialogDescription="Add a custom payment method for this and future expenses"
                addFieldLabel="Payment method"
                onOptionAdded={addCustomPaymentMethod}
              />
              <TextField label="Notes" size="small" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} multiline minRows={2} fullWidth placeholder="Context is prefilled; edit if needed." />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setApproveOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="contained" onClick={handleApproveSubmit} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Approve & post to ledger'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rejectOpen} onClose={() => !saving && setRejectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={700}>Reject expense</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Provide a reason for rejecting this expense line.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Rejection reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRejectOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleRejectSubmit} disabled={saving || !rejectReason.trim()}>
              {saving ? <CircularProgress size={20} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default AccountsWorkOrderView;
