import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Chip, CircularProgress, Alert, Paper, Divider, Link,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { IconArrowLeft, IconEdit, IconFileDownload, IconHammer, IconReceipt, IconCheck } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = {
  new: 'default', sent: 'info', under_review: 'warning', revised: 'primary', approved: 'success', rejected: 'error',
  draft: 'default', pending: 'warning', cancelled: 'error',
};

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const returnTo = searchParams.get('return') || '/erp/quotations';

  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState('');

  const fetchQ = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getQuotation(id);
      if (res.success) setQ(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQ(); }, [fetchQ]);

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
  const canApproveQuotation = q && !isApproved && qStatus !== 'rejected';

  const handleApproveQuotation = async () => {
    if (!id) return;
    try {
      setApproveLoading(true);
      setApproveError('');
      await apiService.updateQuotation(id, { status: 'approved' });
      await fetchQ();
    } catch (e) {
      setApproveError(e.message || 'Failed to approve');
    } finally {
      setApproveLoading(false);
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
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="h4" fontWeight={800}>Service quotation</Typography>
                <Chip label={(q.status || '—').replace(/_/g, ' ')} size="small" color={STATUS_COLOR[q.status] || 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">#{q.id}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {canApproveQuotation && (
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
            <Button variant="outlined" startIcon={<IconEdit size={18} />} onClick={() => navigate(`/erp/quotations/edit/${id}`)} sx={{ borderRadius: 2 }}>
              Edit
            </Button>
            <Button variant="outlined" startIcon={pdfLoading ? <CircularProgress size={16} /> : <IconFileDownload size={18} />} onClick={handlePdf} disabled={pdfLoading} sx={{ borderRadius: 2 }}>
              {isApproved ? 'Download service order PDF' : 'Download quotation PDF'}
            </Button>
            {isApproved && (
              <Button variant="contained" color="primary" startIcon={<IconHammer size={18} />} onClick={() => navigate(`/erp/work-orders/create${q.deal?.id ? `?dealId=${q.deal.id}` : ''}`)} sx={{ borderRadius: 2 }}>
                Create work order
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Amount highlight card */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2, px: 3, py: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03), borderColor: alpha(theme.palette.primary.main, 0.18) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>Total amount</Typography>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                {q.currency || 'AED'} {Number(q.quotation_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
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
                <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/deals/view/${q.deal.id}`)} sx={{ cursor: 'pointer' }}>
                  {q.deal.title || q.deal.deal_number || `Deal #${q.deal.id}`}
                </Link>
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
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Unit price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 2.5 }}>Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dealItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No line items on the linked deal</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dealItems.map((it) => (
                    <TableRow key={it.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell sx={{ pl: 2.5 }}><Typography variant="body2" fontWeight={600}>{it.productService?.name || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{it.unit_of_measure || it.productService?.unit_of_measure || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{Number(it.quantity || 0).toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{Number(it.unit_price || 0).toFixed(2)}</Typography></TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}><Typography variant="body2" fontWeight={700}>{Number(it.line_total || 0).toFixed(2)}</Typography></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {dealItems.length > 0 && (
            <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Lines subtotal</Typography>
              <Typography variant="subtitle1" fontWeight={800}>{q.currency || 'AED'} {linesSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default QuotationView;
