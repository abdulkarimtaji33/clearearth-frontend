import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Alert, CircularProgress, Grid,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconArrowLeft, IconCheck, IconPackage, IconEdit, IconSend,
  IconBriefcase, IconUser, IconHammer, IconReceipt, IconBuilding,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole } from '../../../utils/authHelpers';

const STATUS_COLOR = { draft: 'default', submitted: 'info', approved: 'success' };
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
            {grn.status === 'draft' && (
              <Button
                variant="outlined"
                startIcon={<IconEdit size={16} />}
                onClick={() => navigate(`/erp/grn/edit/${grn.id}`)}
                sx={{ borderRadius: 2.5 }}
              >
                Edit
              </Button>
            )}
            {grn.status === 'draft' && (
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
                        {lead.company_name || lead.contact_name || '—'}
                      </Typography>
                      {lead.contact_name && lead.company_name && (
                        <Typography variant="caption" color="text.secondary">{lead.contact_name}</Typography>
                      )}
                      {lead.phone && (
                        <Typography variant="caption" color="text.secondary" display="block">{lead.phone}</Typography>
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
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Line items
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              {['#', 'Product', 'Material type', 'Quantity', 'UOM', 'Notes'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(grn.items || []).map((it, i) => (
              <TableRow key={it.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Typography variant="caption" fontWeight={700} color="text.disabled">
                    {i + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {it.item_name}
                  </Typography>
                </TableCell>
                <TableCell>{it.materialType?.display_name || '—'}</TableCell>
                <TableCell>
                  <Typography fontWeight={700}>{fmt(it.quantity)}</Typography>
                </TableCell>
                <TableCell>{it.unit_of_measure}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {it.notes || '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {(grn.images || []).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Photos ({grn.images.length})
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {grn.images.map((img) => (
              <Box
                key={img.id}
                component="a"
                href={img.image_url}
                target="_blank"
                rel="noreferrer"
                sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }}
              >
                <Box
                  component="img"
                  src={img.image_url}
                  alt={img.original_name}
                  sx={{ width: 110, height: 110, objectFit: 'cover', display: 'block' }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

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
