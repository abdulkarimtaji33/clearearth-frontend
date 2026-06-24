import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Chip, CircularProgress, Alert, Paper, Divider, Link,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { IconArrowLeft, IconFileDownload, IconHammer, IconReceipt, IconCheck, IconFileInvoice } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import QuotationVersionBadge from '../../../components/erp/QuotationVersionBadge';
import apiService from '../../../services/api';
import { sortQuotationsByVersion, quotationVersion, quotationVersionLabel } from '../../../utils/quotationVersion';
import { useAuth } from '../../../context/AuthContext';
import { canDirectManagerApprove } from '../../../utils/recordStatus';
import { shouldHideDealFinancials, canCreateWorkOrder, canGenerateInvoice, canViewDealDetails } from '../../../utils/authHelpers';

const QUOTATION_APPROVABLE_STATUSES = ['new', 'sent', 'under_review', 'revised', 'pending_approval'];

const STATUS_COLOR = {
  new: 'default',
  sent: 'info',
  under_review: 'warning',
  revised: 'primary',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
  cancelled: 'error',
};

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { user, hasPermission } = useAuth();
  const viewOnly = shouldHideDealFinancials(user);
  const allowCreateWorkOrder = canCreateWorkOrder(user, hasPermission);
  const allowGenerateInvoice = canGenerateInvoice(user);
  const allowDealDetails = canViewDealDetails(user);
  const canDirectApprove = canDirectManagerApprove(user);
  const returnTo = searchParams.get('return') || '/erp/quotations';

  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [dealWorkOrders, setDealWorkOrders] = useState([]);
  const [dealQuotations, setDealQuotations] = useState([]);

  const fetchQ = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getQuotation(id);
      if (res.success) {
        setQ(res.data);
        const dealId = res.data?.deal?.id;
        if (dealId) {
          try {
            const [woRes, quotRes] = await Promise.all([
              apiService.getWorkOrders({ dealId, pageSize: 50 }),
              apiService.getQuotations({ dealId, pageSize: 50 }),
            ]);
            setDealWorkOrders(Array.isArray(woRes.data) ? woRes.data : woRes.data?.items || []);
            const siblings = Array.isArray(quotRes.data) ? quotRes.data : quotRes.data?.items || [];
            setDealQuotations(sortQuotationsByVersion(siblings));
          } catch { /* ignore */ }
        } else {
          setDealWorkOrders([]);
          setDealQuotations([]);
        }
      } else {
        setError('Not found');
      }
    } catch (e) {
      setError(e.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQ(); }, [fetchQ]);
  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, []);

  const handlePdf = async () => {
    if (!id) return;
    try {
      setPdfLoading(true);
      await apiService.downloadQuotationPdf(id);
    } catch (e) {
      setError(e.message || 'PDF failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const qStatus = String(q?.status || '').toLowerCase();
  const isApproved = qStatus === 'approved';
  const linkedWorkOrder = q?.workOrder || q?.work_order;
  const anyDealWorkOrder = linkedWorkOrder || dealWorkOrders.find((wo) => wo.id);
  const canAttemptApproval = !viewOnly && q && QUOTATION_APPROVABLE_STATUSES.includes(qStatus);
  const dealRevisionCount = dealQuotations.length;
  const showRevisionBar = dealRevisionCount > 1;

  const handleApproveQuotation = async () => {
    if (!id) return;
    setApproveError('');
    if (canDirectApprove) {
      try {
        setApproveLoading(true);
        await apiService.approveQuotation(id);
        await fetchQ();
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

  const handleRequestQuotationApproval = async () => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestQuotationApproval(id);
      setApprovalDialogOpen(false);
      await fetchQ();
    } catch (e) {
      setApprovalError(e.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveQuotationWithPin = async (pin) => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveQuotationWithPin(id, pin);
      setApprovalDialogOpen(false);
      await fetchQ();
    } catch (e) {
      setApprovalError(e.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };
  const dealItems = (q?.deal?.items || []).slice().sort((a, b) => (a.id || 0) - (b.id || 0));
  const linesSubtotal = dealItems.reduce((s, it) => s + parseFloat(it.line_total || 0), 0);
  const preparedName = q?.preparedByUser
    ? [q.preparedByUser.first_name, q.preparedByUser.last_name].filter(Boolean).join(' ') || q.preparedByUser.email
    : '—';

  if (loading) {
    return (
      <PageContainer title="Quotation">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  if (error || !q) {
    return (
      <PageContainer title="Quotation">
        <Alert severity="error">{error || 'Not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(returnTo)}>Back to list</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Service quotation">
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 1, sm: 2 }, pb: 4 }}>
        {approveError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setApproveError('')}>{approveError}</Alert>
        )}

        {/* Page header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(returnTo)} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={24} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="h4" fontWeight={800}>Service quotation</Typography>
                {quotationVersionLabel(q) && (
                  <QuotationVersionBadge quotation={q} variant="prominent" totalVersions={dealRevisionCount} />
                )}
                <Chip label={(q.status || '—').replace(/_/g, ' ')} size="small" color={STATUS_COLOR[q.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">#{q.id}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {canAttemptApproval && (
              <Button
                variant="contained"
                color="success"
                startIcon={approveLoading ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
                onClick={handleApproveQuotation}
                disabled={approveLoading}
                sx={{ borderRadius: 2 }}
              >
                Approve
              </Button>
            )}
            {allowGenerateInvoice && (
              <Button variant="outlined" color="secondary" startIcon={<IconFileInvoice size={18} />} onClick={() => navigate(`/erp/proforma-invoices/create/${id}?return=${encodeURIComponent(returnTo)}`)} sx={{ borderRadius: 2 }}>
                Create proforma invoice
              </Button>
            )}
            {!viewOnly && (
              <Button variant="outlined" startIcon={pdfLoading ? <CircularProgress size={16} /> : <IconFileDownload size={18} />} onClick={handlePdf} disabled={pdfLoading} sx={{ borderRadius: 2 }}>
                {isApproved ? 'Download service order PDF' : 'Download quotation PDF'}
              </Button>
            )}
            {isApproved && (
              anyDealWorkOrder?.id ? (
                <Button variant="contained" color="primary" startIcon={<IconHammer size={18} />} onClick={() => navigate(`/erp/work-orders/view/${anyDealWorkOrder.id}`)} sx={{ borderRadius: 2 }}>
                  Open work order
                </Button>
              ) : allowCreateWorkOrder ? (
                <Button variant="contained" color="primary" startIcon={<IconHammer size={18} />} onClick={() => navigate(`/erp/work-orders/create?quotationId=${id}${q.deal?.id ? `&dealId=${q.deal.id}` : ''}`)} sx={{ borderRadius: 2 }}>
                  Create work order
                </Button>
              ) : null
            )}
          </Stack>
        </Stack>

        {showRevisionBar && (
          <Paper
            variant="outlined"
            sx={{
              mb: 2,
              px: 2,
              py: 1.5,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              borderColor: alpha(theme.palette.secondary.main, 0.2),
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.6} display="block" mb={1}>
              Revisions for this deal
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {dealQuotations.map((rev) => {
                const isCurrent = String(rev.id) === String(q.id);
                const revLabel = quotationVersion(rev) > 1 ? `v${quotationVersion(rev)}` : 'Original';
                return (
                  <Chip
                    key={rev.id}
                    label={revLabel}
                    size="small"
                    clickable={!isCurrent}
                    color={isCurrent ? 'secondary' : 'default'}
                    variant={isCurrent ? 'filled' : 'outlined'}
                    onClick={isCurrent ? undefined : () => navigate(`/erp/quotations/view/${rev.id}?return=${encodeURIComponent(returnTo)}`)}
                    sx={{ fontWeight: 700, fontFamily: isCurrent ? 'monospace' : undefined }}
                  />
                );
              })}
            </Stack>
          </Paper>
        )}

        {/* Summary card */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, px: 3, py: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03), borderColor: alpha(theme.palette.primary.main, 0.18) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            {!viewOnly && (
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>Total amount</Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {q.currency || 'AED'} {Number(q.quotation_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: viewOnly ? 'flex-start' : 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">Date: <strong>{q.quotation_date || '—'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Prepared by: <strong>{preparedName}</strong></Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Details */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Details</Typography>
          </Box>
          <Stack spacing={0} sx={{ px: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Deal</Typography>
              {q.deal ? (
                allowDealDetails ? (
                <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/deals/view/${q.deal.id}`)} sx={{ cursor: 'pointer' }}>
                  {q.deal.title || q.deal.deal_number || `Deal #${q.deal.id}`}
                </Link>
                ) : (
                  <Typography variant="body2" fontWeight={600}>
                    {q.deal.title || q.deal.deal_number || `Deal #${q.deal.id}`}
                  </Typography>
                )
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Prepared by</Typography>
              <Typography variant="body2" fontWeight={500}>{preparedName}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} py={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Quotation date</Typography>
              <Typography variant="body2">{q.quotation_date || '—'}</Typography>
            </Stack>
            {q.remarks && (
              <>
                <Divider />
                <Box py={2}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.75}>Remarks</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>{q.remarks}</Typography>
                </Box>
              </>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>Line items (from deal)</Typography>
              <Typography variant="caption" color="text.secondary">{dealItems.length} item{dealItems.length !== 1 ? 's' : ''}</Typography>
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                  <TableCell sx={{ fontWeight: 700, pl: 2.5 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  {!viewOnly && <TableCell align="right" sx={{ fontWeight: 700 }}>Unit price</TableCell>}
                  {!viewOnly && <TableCell align="right" sx={{ fontWeight: 700, pr: 2.5 }}>Line total</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {dealItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={viewOnly ? 3 : 5} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No line items on the linked deal</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dealItems.map((it) => (
                    <TableRow key={it.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell sx={{ pl: 2.5 }}><Typography variant="body2" fontWeight={600}>{it.productService?.name || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{it.unit_of_measure || it.productService?.unit_of_measure || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{Number(it.quantity || 0).toLocaleString()}</Typography></TableCell>
                      {!viewOnly && <TableCell align="right"><Typography variant="body2">{Number(it.unit_price || 0).toFixed(2)}</Typography></TableCell>}
                      {!viewOnly && <TableCell align="right" sx={{ pr: 2.5 }}><Typography variant="body2" fontWeight={700}>{Number(it.line_total || 0).toFixed(2)}</Typography></TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {!viewOnly && dealItems.length > 0 && (
            <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Lines subtotal</Typography>
              <Typography variant="subtitle1" fontWeight={800}>{q.currency || 'AED'} {linesSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
            </Box>
          )}
        </Paper>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="quotation"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => setApprovalDialogOpen(false)}
          onDecideLater={() => setApprovalDialogOpen(false)}
          onRequestApproval={handleRequestQuotationApproval}
          onApproveWithPin={handleApproveQuotationWithPin}
          approveButtonLabel="Approve quotation"
        />
      </Box>
    </PageContainer>
  );
};

export default QuotationView;
