import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Chip, CircularProgress, Alert, Paper, Divider, Link,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { IconArrowLeft, IconEdit, IconFileDownload, IconHammer, IconShoppingCart, IconCheck } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canDirectManagerApprove } from '../../../utils/recordStatus';

const PO_APPROVABLE_STATUSES = ['new', 'sent', 'under_review', 'revised', 'pending_approval'];

const STATUS_COLOR = {
  new: 'default', sent: 'info', under_review: 'warning', revised: 'primary', approved: 'success', rejected: 'error',
  new: 'default',   pending_approval: 'warning', pending: 'warning', cancelled: 'error',
};

const PurchaseOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { user } = useAuth();
  const canDirectApprove = canDirectManagerApprove(user);
  const returnParam = searchParams.get('return');
  const defaultListForPo = (p) => {
    if (!p) return '/erp/client-purchase-quotations';
    if (p.company_id) return '/erp/client-purchase-quotations';
    if (p.supplier_id) return '/erp/vendor-purchase-quotations';
    return '/erp/client-purchase-quotations';
  };

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);

  const fetchPo = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getPurchaseOrder(id);
      if (res.success) setPo(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPo(); }, [fetchPo]);
  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, []);

  const handlePdf = async () => {
    if (!id) return;
    try {
      setPdfLoading(true);
      await apiService.downloadPurchaseOrderPdf(id);
    } catch (e) {
      setError(e.message || 'PDF failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const isClientQuotation = po?.company_id && String(po?.document_type || 'quotation').toLowerCase() === 'quotation';

  const handleApprovePo = async () => {
    if (!id || !isClientQuotation) return;
    setApproveError('');
    if (canDirectApprove) {
      try {
        setApproveLoading(true);
        await apiService.approvePurchaseOrder(id);
        await fetchPo();
      } catch (e) {
        const msg = e.message || '';
        if (msg.includes('approval PIN') || msg.includes('manager can approve')) {
          setApprovalError('');
          setApprovalDialogOpen(true);
        } else {
          setApproveError(msg || 'Failed to approve');
        }
      } finally {
        setApproveLoading(false);
      }
      return;
    }
    setApprovalError('');
    setApprovalDialogOpen(true);
  };

  const handleRequestPoApproval = async () => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestPurchaseOrderApproval(id);
      setApprovalDialogOpen(false);
      await fetchPo();
    } catch (e) {
      setApprovalError(e.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprovePoWithPin = async (pin) => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approvePurchaseOrderWithPin(id, pin);
      setApprovalDialogOpen(false);
      await fetchPo();
    } catch (e) {
      setApprovalError(e.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  const poStatus = String(po?.status || '').toLowerCase();
  const isApproved = poStatus === 'approved';
  const canAttemptApproval = isClientQuotation && po && PO_APPROVABLE_STATUSES.includes(poStatus);
  const returnTo = returnParam || defaultListForPo(po);
  const partyLabel = po?.company_id ? 'Client' : po?.supplier_id ? 'Vendor' : '—';
  const partyName = po?.company?.company_name || po?.supplier?.company_name || '—';
  const linkedWorkOrder = po?.sourceWorkOrder || po?.source_work_order;

  const items = po?.items || [];
  const linesTotal = items.reduce((s, it) => s + parseFloat(it.total || 0), 0);

  if (loading) {
    return (
      <PageContainer title="Purchase order">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error || !po) {
    return (
      <PageContainer title="Purchase order">
        <Alert severity="error">{error || 'Not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(returnParam || '/erp/client-purchase-quotations')}>Back to list</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Purchase quotation">
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {approveError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setApproveError('')}>{approveError}</Alert>
        )}
        {/* Page header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(returnTo)} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.12), color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconShoppingCart size={24} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="h4" fontWeight={800}>Purchase quotation</Typography>
                <Chip label={(po.status || '—').replace(/_/g, ' ')} size="small" color={STATUS_COLOR[po.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">#{po.id} · {partyLabel}: {partyName}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {canAttemptApproval && (
              <Button
                variant="contained"
                color="success"
                startIcon={approveLoading ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
                onClick={handleApprovePo}
                disabled={approveLoading}
                sx={{ borderRadius: 2 }}
              >
                Approve
              </Button>
            )}
            <Button variant="outlined" startIcon={<IconEdit size={18} />} onClick={() => navigate(`/erp/purchase-orders/edit/${id}`)} sx={{ borderRadius: 2 }}>
              Edit
            </Button>
            <Button variant="outlined" startIcon={pdfLoading ? <CircularProgress size={16} /> : <IconFileDownload size={18} />} onClick={handlePdf} disabled={pdfLoading} sx={{ borderRadius: 2 }}>
              {isApproved ? 'Download purchase order PDF' : 'Download quotation PDF'}
            </Button>
            {isApproved && (
              linkedWorkOrder?.id ? (
                <Button variant="contained" color="secondary" startIcon={<IconHammer size={18} />} onClick={() => navigate(`/erp/work-orders/view/${linkedWorkOrder.id}`)} sx={{ borderRadius: 2 }}>
                  Open work order
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<IconHammer size={18} />}
                  onClick={() => navigate(`/erp/work-orders/create?purchaseOrderId=${po.id}${po.deal?.id ? `&dealId=${po.deal.id}` : ''}`)}
                  sx={{ borderRadius: 2 }}
                >
                  Create work order
                </Button>
              )
            )}
          </Stack>
        </Stack>

        {/* Summary highlight */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, px: 3, py: 2.5, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>Total amount</Typography>
              <Typography variant="h3" fontWeight={800} color="secondary.main">
                AED {linesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">PO date: <strong>{po.po_date || '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Delivery: <strong>{po.expected_delivery || '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">{partyLabel}: <strong>{partyName}</strong></Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Details */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Details</Typography>
          </Box>
          <Stack spacing={0} sx={{ px: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Deal</Typography>
              {po.deal ? (
                <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/deals/view/${po.deal.id}`)} sx={{ cursor: 'pointer' }}>
                  {po.deal.title || po.deal.deal_number || `Deal #${po.deal.id}`}
                </Link>
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{partyLabel}</Typography>
              <Typography variant="body2" fontWeight={600}>{partyName}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>PO date</Typography>
              <Typography variant="body2">{po.po_date || '—'}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Expected delivery</Typography>
              <Typography variant="body2">{po.expected_delivery || '—'}</Typography>
            </Stack>
          </Stack>
        </Paper>

        {po.terms && po.terms.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 3, px: 2.5, py: 2, mb: 2 }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1} display="block" mb={1.25}>Terms</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {po.terms.map((t) => (
                <Chip key={t.id} label={t.title} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Line items */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Line items</Typography>
              <Typography variant="caption" color="text.secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Typography>
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                  <TableCell sx={{ fontWeight: 700, pl: 2.5 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Unit price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 2.5 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No line items</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell sx={{ pl: 2.5 }}><Typography variant="body2" fontWeight={600}>{it.productService?.name || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{it.item_description || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{Number(it.quantity || 0).toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{Number(it.price || 0).toFixed(2)}</Typography></TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}><Typography variant="body2" fontWeight={700}>{Number(it.total || 0).toFixed(2)}</Typography></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Total</Typography>
            <Typography variant="subtitle1" fontWeight={800}>AED {linesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
          </Box>
        </Paper>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="client purchase quotation"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => setApprovalDialogOpen(false)}
          onDecideLater={() => setApprovalDialogOpen(false)}
          onRequestApproval={handleRequestPoApproval}
          onApproveWithPin={handleApprovePoWithPin}
          approveButtonLabel="Approve quotation"
        />
      </Box>
    </PageContainer>
  );
};

export default PurchaseOrderView;
