import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Alert, CircularProgress, Grid, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconArrowLeft, IconCheck, IconPackage, IconEdit, IconSend, IconDownload,
  IconBriefcase, IconUser, IconHammer, IconReceipt, IconBuilding, IconBox, IconStack2,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole } from '../../../utils/authHelpers';
import GrnEvidenceThumbs from './GrnEvidenceThumbs';

const STATUS_COLOR = { new: 'default', submitted: 'info', approved: 'success' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

const APPROVER_ROLES = ['admin', 'tenant_admin', 'operations_manager'];

const GrnView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const roleName = getUserRole(user);
  const canApprove = APPROVER_ROLES.includes(roleName);
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getGrn(id);
      if (res.success) setGrn(res.data);
      else setError(res.message || 'Not found');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    try {
      setApproving(true);
      const res = await apiService.approveGrn(id);
      if (res.success) setGrn(res.data);
      else setError(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  const submitForApproval = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await apiService.updateGrn(id, { status: 'submitted' });
      if (res.success) setGrn(res.data);
      else setError(res.message || 'Failed to submit');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      setError('');
      await apiService.downloadGrnPdf(id);
    } catch (e) {
      setError(e.message || 'Failed to download GRN report');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="GRN">
        <Box display="flex" justifyContent="center" py={12}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN">
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Not found'}</Alert>
      </PageContainer>
    );
  }

  const totalQuantity = (grn.items || []).reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);
  const totalUnits = (grn.items || []).reduce((s, it) => s + (it.units != null ? parseInt(it.units, 10) || 0 : 0), 0);

  return (
    <PageContainer title={`GRN ${grn.grn_number}`}>
      <Button
        startIcon={<IconArrowLeft size={16} />}
        onClick={() => navigate('/erp/grn')}
        sx={{ mb: 2.5, borderRadius: 2 }}
      >
        Back to list
      </Button>

      {/* Header banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: grn.status === 'approved'
            ? alpha(theme.palette.success.main, 0.3)
            : grn.status === 'submitted'
            ? alpha(theme.palette.info.main, 0.3)
            : 'divider',
          bgcolor: grn.status === 'approved'
            ? alpha(theme.palette.success.main, 0.04)
            : grn.status === 'submitted'
            ? alpha(theme.palette.info.main, 0.04)
            : 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPackage size={24} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                {grn.grn_number}
              </Typography>
              <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                <Chip
                  label={grn.status}
                  color={STATUS_COLOR[grn.status]}
                  size="small"
                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                />
                {grn.workOrder && (
                  <Chip variant="outlined" label={grn.workOrder.title} size="small" />
                )}
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <IconDownload size={16} />}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              sx={{ borderRadius: 2.5 }}
            >
              {pdfLoading ? 'Downloading…' : 'Download GRN report'}
            </Button>
            {grn.status === 'new' && (
              <Button
                variant="outlined"
                startIcon={<IconEdit size={16} />}
                onClick={() => navigate(`/erp/grn/edit/${grn.id}`)}
                sx={{ borderRadius: 2.5 }}
              >
                Edit
              </Button>
            )}
            {grn.status === 'new' && (
              <Button
                variant="outlined"
                color="info"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <IconSend size={16} />}
                onClick={submitForApproval}
                disabled={submitting}
                sx={{ borderRadius: 2.5 }}
              >
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </Button>
            )}
            {grn.status !== 'approved' && canApprove && (
              <Button
                variant="contained"
                color="success"
                startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
                onClick={approve}
                disabled={approving}
                sx={{ borderRadius: 2.5, px: 2.5 }}
              >
                {approving ? 'Approving…' : 'Approve & update inventory'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      {/* References panel */}
      {(grn.deal || grn.workOrder) && (() => {
        const deal = grn.deal;
        const lead = deal?.lead;
        const salesPerson = deal?.assignedUser;
        const taxInvoice = deal?.proformaInvoices?.find(p => p.taxInvoice)?.taxInvoice;
        const proforma = deal?.proformaInvoices?.[0];

        const RefItem = ({ icon: Icon, label, children }) => (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
              <Icon size={15} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block">{label}</Typography>
              <Box>{children}</Box>
            </Box>
          </Box>
        );

        return (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" fontWeight={800}>References</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2.5}>
                {deal && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconBriefcase} label="Deal">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                      >
                        {deal.deal_number} — {deal.title}
                      </Typography>
                      {deal.status && (
                        <Chip label={deal.status} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                      )}
                    </RefItem>
                  </Grid>
                )}
                {lead && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconBuilding} label="Lead">
                      <Typography variant="body2" fontWeight={700}>
                        {lead.company?.company_name
                          || [lead.contact?.first_name, lead.contact?.last_name].filter(Boolean).join(' ')
                          || lead.lead_number
                          || '—'}
                      </Typography>
                      {lead.contact && lead.company?.company_name && (
                        <Typography variant="caption" color="text.secondary">
                          {[lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ')}
                        </Typography>
                      )}
                      {(lead.phone || lead.contact?.phone) && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {lead.phone || lead.contact?.phone}
                        </Typography>
                      )}
                    </RefItem>
                  </Grid>
                )}
                {salesPerson && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconUser} label="Sales person">
                      <Typography variant="body2" fontWeight={700}>
                        {[salesPerson.first_name, salesPerson.last_name].filter(Boolean).join(' ') || salesPerson.email}
                      </Typography>
                      {salesPerson.phone && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {salesPerson.phone}
                        </Typography>
                      )}
                    </RefItem>
                  </Grid>
                )}
                {grn.workOrder && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconHammer} label="Work order">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/erp/work-orders/view/${grn.work_order_id}`)}
                      >
                        {grn.workOrder.title || `Work Order #${grn.work_order_id}`}
                      </Typography>
                      <Chip
                        label={grn.workOrder.status?.replace(/_/g, ' ')}
                        size="small"
                        color={grn.workOrder.status === 'completed' ? 'success' : 'default'}
                        sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </RefItem>
                  </Grid>
                )}
                {taxInvoice && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconReceipt} label="Tax invoice">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/erp/tax-invoices/view/${taxInvoice.id}`)}
                      >
                        {taxInvoice.tax_invoice_number}
                      </Typography>
                      <Chip
                        label={taxInvoice.payment_status}
                        size="small"
                        color={taxInvoice.payment_status === 'paid' ? 'success' : taxInvoice.payment_status === 'partial' ? 'warning' : 'default'}
                        sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </RefItem>
                  </Grid>
                )}
                {!taxInvoice && proforma && (
                  <Grid item xs={12} sm={6} md={4}>
                    <RefItem icon={IconReceipt} label="Proforma invoice">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/erp/proforma-invoices/view/${proforma.id}`)}
                      >
                        {proforma.proforma_number}
                      </Typography>
                    </RefItem>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        );
      })()}

      {grn.notes && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
            Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {grn.notes}
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Items
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              size="small"
              icon={<IconBox size={14} />}
              label={`${(grn.items || []).length} item${(grn.items || []).length !== 1 ? 's' : ''}`}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              size="small"
              icon={<IconStack2 size={14} />}
              label={`${fmt(totalQuantity)} qty`}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            {totalUnits > 0 && (
              <Chip
                size="small"
                label={`${totalUnits} pcs`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              {['#', 'Product', 'Material type', 'Make / Model', 'Serial number', 'Quantity', 'UOM', 'Units (pcs)', 'Notes', 'Evidence'].map((h, idx) => (
                <TableCell
                  key={h}
                  align={idx === 5 || idx === 7 ? 'right' : 'left'}
                  sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(grn.items || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.disabled">No items</Typography>
                </TableCell>
              </TableRow>
            ) : (grn.items || []).map((it, i) => (
              <TableRow key={it.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {i + 1}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {it.item_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  {it.materialType?.display_name ? (
                    <Chip label={it.materialType.display_name} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {(it.make || it.model) ? (
                    <Box>
                      {it.make && <Typography variant="body2" fontWeight={600}>{it.make}</Typography>}
                      {it.model && <Typography variant="caption" color="text.secondary">{it.model}</Typography>}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {it.serial_number ? (
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {it.serial_number}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{fmt(it.quantity)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={it.unit_of_measure} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem' }} />
                </TableCell>
                <TableCell align="right">
                  {it.units != null && it.units !== '' ? (
                    <Typography fontWeight={700}>{it.units}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 180 }}>
                  <Tooltip title={it.notes || ''} disableHoverListener={!it.notes}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {it.notes || '—'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {(it.images || []).length > 0 ? (
                    <GrnEvidenceThumbs
                      images={(it.images || []).map((img) => ({
                        id: img.id,
                        imageUrl: img.image_url,
                        originalName: img.original_name,
                      }))}
                      size={44}
                    />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {grn.status === 'approved' && grn.approved_at && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2.5}>
          Approved on {new Date(grn.approved_at).toLocaleString()}
          {grn.approvedByUser && ` by ${grn.approvedByUser.first_name} ${grn.approvedByUser.last_name}`}
        </Typography>
      )}
    </PageContainer>
  );
};

export default GrnView;
