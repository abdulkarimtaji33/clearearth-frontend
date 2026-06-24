import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  ButtonBase,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router';
import FsLightbox from 'fslightbox-react';
import {
  IconArrowLeft,
  IconEdit,
  IconDownload,
  IconPlus,
  IconPhoto,
  IconReceipt,
  IconShoppingCart,
  IconFileDescription,
  IconChevronDown,
  IconFileText,
  IconInfoCircle,
  IconPackage,
  IconClipboardCheck,
  IconTruckDelivery,
  IconFileInvoice,
  IconCheck,
  IconHammer,
  IconCircleCheck,
  IconLoader2,
  IconCircle,
  IconAlertCircle,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import InspectionRequestDetail from '../../../components/erp/InspectionRequestDetail';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import QuotationVersionBadge from '../../../components/erp/QuotationVersionBadge';
import apiService from '../../../services/api';
import { sortQuotationsByVersion, quotationVersionLabel } from '../../../utils/quotationVersion';
import config from 'src/context/config';
import { useAuth } from '../../../context/AuthContext';
import { canDirectManagerApprove } from '../../../utils/recordStatus';
import { getUserRole, shouldHideDealFinancials } from '../../../utils/authHelpers';
import {
  isInspectionRole,
  formatUserDisplayName,
  resolveInspectorIdForReport,
} from '../../../utils/inspectionReportHelpers';

const DEAL_APPROVABLE_STATUSES = ['new', 'pending_approval'];
const DEAL_QUOTABLE_STATUSES = ['approved', 'quotation_sent', 'negotiation', 'won'];

const isWdsPending = (deal) => {
  if (!deal?.wds_required) return false;
  const w = deal.wdsDetails;
  if (!w) return true;
  if ((w.attachments || []).length > 0) return false;
  const fields = [
    'ref_no', 'company_name', 'license_no', 'waste_description', 'container_no',
    'source_process', 'package_type', 'quantity_per_package', 'total_weight', 'purpose', 'bl_no', 'bor_no',
  ];
  return !fields.some((f) => w[f]?.toString().trim());
};

const getStatusColor = (status) => {
  const colors = {
    new: 'default',
    pending_approval: 'warning',
    approved: 'info',
    quotation_sent: 'primary',
    negotiation: 'warning',
    won: 'success',
    lost: 'error',
    // legacy
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

const getPaymentStatusColor = (status) => {
  const colors = { unpaid: 'error', partial: 'warning', paid: 'success' };
  return colors[status] || 'default';
};

const ReportImageDropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    onDrop: (files) => { if (files.length) onDrop(files); },
  });
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <input {...getInputProps()} />
      <IconPhoto size={32} style={{ opacity: 0.5 }} />
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Drag & drop or click
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value }) => (
  <Grid container spacing={2} sx={{ mb: 1.5 }}>
    <Grid size={{ xs: 5, md: 4 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
    </Grid>
    <Grid size={{ xs: 7, md: 8 }}>
      <Typography variant="body2">{value || '-'}</Typography>
    </Grid>
  </Grid>
);

const SectionCard = ({ id: sectionId, children, sx }) => (
  <Card
    id={sectionId}
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      mb: 3,
      scrollMarginTop: `${config.topbarHeight + 52}px`,
      ...sx,
    }}
  >
    {children}
  </Card>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5} flexWrap="wrap" gap={1}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {Icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </Box>
      )}
      <Box>
        <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Stack>
    {action}
  </Stack>
);

const NAV_ITEMS = [
  { id: 'sec-overview', label: 'Overview', icon: IconInfoCircle },
  { id: 'sec-products', label: 'Products', icon: IconPackage },
  { id: 'sec-work-progress', label: 'Work progress', icon: IconHammer },
  { id: 'sec-logistics', label: 'Logistics', icon: IconTruckDelivery },
  { id: 'sec-inspection', label: 'Inspection', icon: IconClipboardCheck },
  { id: 'sec-quotations', label: 'Quotations', icon: IconFileInvoice },
];

const WO_HEADER_STATUS_COLOR = { new: 'default', in_progress: 'info', completed: 'success', cancelled: 'error' };

const taskStatusMeta = (status) => {
  const s = String(status || 'not_started').toLowerCase();
  if (s === 'completed') return { label: 'Completed', color: 'success', Icon: IconCircleCheck };
  if (s === 'in_progress') return { label: 'In progress', color: 'warning', Icon: IconLoader2 };
  if (s === 'blocked') return { label: 'Blocked', color: 'error', Icon: IconAlertCircle };
  return { label: 'Not started', color: 'default', Icon: IconCircle };
};

const WorkOrderPipeline = ({ workOrder, theme, onOpen, showWorkOrderActions = true }) => {
  const tasks = [...(workOrder.tasks || [])].sort((a, b) => (a.id || 0) - (b.id || 0));
  const title = workOrder.title?.trim() || `Work order #${workOrder.id}`;
  const done = tasks.filter((t) => String(t.status).toLowerCase() === 'completed').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0)} 55%)`,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} gap={1.5} mb={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} letterSpacing={-0.2}>{title}</Typography>
          <Stack direction="row" alignItems="center" spacing={1} mt={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              label={String(workOrder.status || '—').replace(/_/g, ' ')}
              size="small"
              color={WO_HEADER_STATUS_COLOR[workOrder.status] || 'default'}
              sx={{ fontWeight: 700, textTransform: 'capitalize' }}
            />
            {tasks.length > 0 && (
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {done} of {tasks.length} tasks complete
              </Typography>
            )}
          </Stack>
        </Box>
        {showWorkOrderActions && (
          <Button variant="contained" size="small" onClick={onOpen} sx={{ borderRadius: 2, alignSelf: { xs: 'stretch', sm: 'center' }, whiteSpace: 'nowrap' }}>
            Open work order
          </Button>
        )}
      </Stack>

      {tasks.length > 0 && (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8,
            borderRadius: 99,
            mb: 2.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 99 },
          }}
        />
      )}

      {tasks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No tasks on this work order yet.</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            overflowX: 'auto',
            pb: 0.5,
            mx: { xs: -0.5, sm: 0 },
            px: { xs: 0.5, sm: 0 },
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.15), borderRadius: 3 },
          }}
        >
          {tasks.map((task, idx) => {
            const meta = taskStatusMeta(task.status);
            const TaskIcon = meta.Icon;
            const name = task.type_of_work || task.workType?.name || `Task ${idx + 1}`;
            const st = String(task.status || 'not_started').toLowerCase();
            const prevDone = idx > 0 && String(tasks[idx - 1].status).toLowerCase() === 'completed';

            return (
              <React.Fragment key={task.id}>
                {idx > 0 && (
                  <Box
                    sx={{
                      flex: '1 0 20px',
                      minWidth: 16,
                      maxWidth: 48,
                      alignSelf: 'center',
                      height: 4,
                      borderRadius: 2,
                      mx: 0.5,
                      bgcolor: prevDone ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.1),
                    }}
                  />
                )}
                <Box sx={{ flex: '0 0 auto', width: { xs: 148, sm: 160 } }}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 2,
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor:
                        st === 'completed'
                          ? theme.palette.success.main
                          : st === 'in_progress'
                            ? theme.palette.warning.main
                            : st === 'blocked'
                              ? theme.palette.error.main
                              : theme.palette.divider,
                      bgcolor:
                        st === 'completed'
                          ? alpha(theme.palette.success.main, 0.08)
                          : st === 'in_progress'
                            ? alpha(theme.palette.warning.main, 0.1)
                            : 'background.paper',
                      boxShadow:
                        st === 'in_progress'
                          ? `0 0 0 4px ${alpha(theme.palette.warning.main, 0.12)}, 0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
                          : st === 'completed'
                            ? `0 4px 14px ${alpha(theme.palette.success.main, 0.12)}`
                            : 'none',
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    <Stack alignItems="center" spacing={1.25}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor:
                            st === 'completed'
                              ? alpha(theme.palette.success.main, 0.15)
                              : st === 'in_progress'
                                ? alpha(theme.palette.warning.main, 0.2)
                                : alpha(theme.palette.action.hover, 0.6),
                          color:
                            st === 'completed'
                              ? theme.palette.success.dark
                              : st === 'in_progress'
                                ? theme.palette.warning.dark
                                : theme.palette.text.secondary,
                          ...(st === 'in_progress'
                            ? {
                                '@keyframes woPulse': {
                                  '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0.35)}` },
                                  '50%': { boxShadow: `0 0 0 8px ${alpha(theme.palette.warning.main, 0)}` },
                                },
                                animation: 'woPulse 2s ease-in-out infinite',
                              }
                            : {}),
                        }}
                      >
                        {st === 'in_progress' ? (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              '@keyframes dealSpin': { to: { transform: 'rotate(360deg)' } },
                              animation: 'dealSpin 0.85s linear infinite',
                            }}
                          >
                            <IconLoader2 size={22} stroke={1.75} />
                          </Box>
                        ) : (
                          <TaskIcon size={22} stroke={1.75} />
                        )}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800} textAlign="center" lineHeight={1.35} sx={{ wordBreak: 'break-word' }}>
                        {name}
                      </Typography>
                      <Chip
                        label={meta.label}
                        size="small"
                        color={meta.color}
                        variant={st === 'not_started' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </Stack>
                  </Paper>
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};

const DealView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, hasPermission } = useAuth();
  const hideDealAmounts = shouldHideDealFinancials(user);
  const showWorkOrderActions = getUserRole(user) !== 'sales';
  const canEditDeals = hasPermission('deals.update');
  const canDirectApprove = canDirectManagerApprove(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deal, setDeal] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportFormErrors, setReportFormErrors] = useState({});
  const [reportSaving, setReportSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('sec-overview');
  const [reportForm, setReportForm] = useState({
    inspectionDatetime: null,
    approximateWeight: '',
    weightUom: 'kg',
    cargoType: '',
    transportationArrangement: '',
    approximateValue: '',
    images: [],
    inspectorId: null,
    approvedById: null,
    notes: '',
  });

  const [relatedQuotations, setRelatedQuotations] = useState([]);
  const [relatedPOs, setRelatedPOs] = useState([]);
  const [quotMenuAnchor, setQuotMenuAnchor] = useState(null);
  const quotMenuOpen = Boolean(quotMenuAnchor);

  const [inspectionPopupOpen, setInspectionPopupOpen] = useState(false);
  const [inspectionPopupData, setInspectionPopupData] = useState(null);
  const [inspectionPopupLoading, setInspectionPopupLoading] = useState(false);
  const [uomList, setUomList] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);

  useEffect(() => {
    apiService.getAllDropdowns().then((r) => {
      if (r.success) setUomList(r.data.units_of_measure || []);
    });
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, []);

  const formatDealItemUom = (item) => {
    const v = item.unit_of_measure || item.productService?.unit_of_measure;
    if (!v) return '—';
    const o = uomList.find((u) => u.value === v);
    return o?.display_name || v;
  };

  const fetchDeal = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.getDeal(id);
      if (response.success) setDeal(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRelatedDocs = useCallback(async () => {
    if (!id) return;
    try {
      const [quotRes, poRes] = await Promise.all([
        apiService.getQuotations({ dealId: id, pageSize: 50 }),
        apiService.getPurchaseOrders({ dealId: id, pageSize: 50 }),
      ]);
      if (quotRes.success) setRelatedQuotations(sortQuotationsByVersion(Array.isArray(quotRes.data) ? quotRes.data : []));
      if (poRes.success) setRelatedPOs(Array.isArray(poRes.data) ? poRes.data : []);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDeal();
    else setLoading(false);
  }, [id, fetchDeal]);

  useEffect(() => {
    if (id && deal) fetchRelatedDocs();
  }, [id, deal, fetchRelatedDocs]);

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          setActiveSection(top.target.id);
        }
      },
      { rootMargin: `-${config.topbarHeight + 44}px 0px -55% 0px`, threshold: 0 }
    );
    NAV_ITEMS.forEach(({ id: sid }) => {
      const el = document.getElementById(sid);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [deal]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getInspectors();
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setUsers(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const dealStatusLower = String(deal?.status || '').toLowerCase();
  const canAttemptApproval = canEditDeals && deal && DEAL_APPROVABLE_STATUSES.includes(dealStatusLower);
  const canCreateQuotation = canEditDeals && deal && DEAL_QUOTABLE_STATUSES.includes(dealStatusLower);

  const handleApproveDeal = async () => {
    if (!id || !deal) return;
    setError('');
    if (canDirectApprove) {
      try {
        setApproveLoading(true);
        await apiService.approveDeal(id);
        await fetchDeal();
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('approval PIN') || msg.includes('manager can approve')) {
          setApprovalError('');
          setApprovalDialogOpen(true);
        } else {
          setError(msg || 'Failed to approve deal');
        }
      } finally {
        setApproveLoading(false);
      }
      return;
    }
    setApprovalError('');
    setApprovalDialogOpen(true);
  };

  const handleRequestDealApproval = async () => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestDealApproval(id);
      setApprovalDialogOpen(false);
      await fetchDeal();
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveDealWithPin = async (pin) => {
    if (!id) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveDealWithPin(id, pin);
      setApprovalDialogOpen(false);
      await fetchDeal();
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  const openReportDialog = () => {
    setReportFormErrors({});
    setError('');
    const inspectorId = resolveInspectorIdForReport(user, deal?.inspectionReport?.inspector_id || null);
    if (deal?.inspectionReport) {
      const r = deal.inspectionReport;
      const images = Array.isArray(r.images) ? r.images : (typeof r.images === 'string' ? JSON.parse(r.images || '[]') : []);
      setReportForm({
        inspectionDatetime: r.inspection_datetime ? dayjs(r.inspection_datetime) : null,
        approximateWeight: r.approximate_weight ?? '',
        weightUom: r.weight_uom || 'kg',
        cargoType: r.cargo_type || '',
        transportationArrangement: r.transportation_arrangement || '',
        approximateValue: r.approximate_value ?? '',
        images: images.map((p) => ({ path: p, url: apiService.getUploadUrl(p) })),
        inspectorId,
        approvedById: r.approved_by_id || null,
        notes: r.notes || '',
      });
    } else {
      setReportForm({ inspectionDatetime: null, approximateWeight: '', weightUom: 'kg', cargoType: '', transportationArrangement: '', approximateValue: '', images: [], inspectorId, approvedById: null, notes: '' });
    }
    fetchUsers();
    setReportDialogOpen(true);
  };

  const saveReport = async () => {
    const errs = {};
    if (!reportForm.inspectionDatetime) errs.inspectionDatetime = 'Inspection date and time is required';
    if (reportForm.approximateWeight === '' || reportForm.approximateWeight == null) errs.approximateWeight = 'Approximate weight is required';
    if (!reportForm.cargoType?.trim()) errs.cargoType = 'Cargo packing type is required';
    if (!reportForm.transportationArrangement?.trim()) errs.transportationArrangement = 'Transportation arrangement is required';
    if (reportForm.approximateValue === '' || reportForm.approximateValue == null) errs.approximateValue = 'Approximate value is required';
    if (!reportForm.inspectorId) errs.inspectorId = "Inspector's name is required";
    if (!reportForm.images?.length) errs.images = 'At least one image is required';
    setReportFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setReportFormErrors({});
      setReportSaving(true);
      await apiService.saveInspectionReport(id, {
        inspectionDatetime: reportForm.inspectionDatetime?.toISOString?.() || null,
        approximateWeight: reportForm.approximateWeight ? parseFloat(reportForm.approximateWeight) : null,
        weightUom: reportForm.weightUom || null,
        cargoType: reportForm.cargoType || null,
        transportationArrangement: reportForm.transportationArrangement || null,
        approximateValue: reportForm.approximateValue ? parseFloat(reportForm.approximateValue) : null,
        images: reportForm.images.map((i) => i.path),
        inspectorId: reportForm.inspectorId,
        notes: reportForm.notes || null,
      });
      setReportDialogOpen(false);
      await fetchDeal();
      if (inspectionPopupOpen && deal?.inspectionRequest?.id) {
        try {
          const ir = await apiService.getInspectionRequest(deal.inspectionRequest.id);
          if (ir.success) setInspectionPopupData(ir.data);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setReportSaving(false);
    }
  };

  const openInspectionPopup = useCallback(async () => {
    const rid = deal?.inspectionRequest?.id;
    if (!rid) return;
    setInspectionPopupOpen(true);
    setInspectionPopupLoading(true);
    setInspectionPopupData(null);
    try {
      const res = await apiService.getInspectionRequest(rid);
      if (res.success) setInspectionPopupData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setInspectionPopupLoading(false);
    }
  }, [deal?.inspectionRequest?.id]);

  const refreshInspectionPopup = useCallback(async () => {
    const rid = deal?.inspectionRequest?.id;
    if (!rid) return;
    try {
      const res = await apiService.getInspectionRequest(rid);
      if (res.success) setInspectionPopupData(res.data);
    } catch (e) {
      console.error(e);
    }
    await fetchDeal();
  }, [deal?.inspectionRequest?.id, fetchDeal]);

  if (!id) {
    return (
      <PageContainer title="Invalid Deal">
        <Box sx={{ maxWidth: 'min(5000px, 100%)', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>Invalid deal ID</Alert>
          <Button variant="outlined" onClick={() => navigate('/erp/deals')}>Back to Deals</Button>
        </Box>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer title="Loading Deal...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !deal) {
    return (
      <PageContainer title="Deal Not Found">
        <Box sx={{ maxWidth: 'min(5000px, 100%)', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || 'Deal not found'}</Alert>
          <Button variant="outlined" onClick={() => navigate('/erp/deals')}>Back to Deals</Button>
        </Box>
      </PageContainer>
    );
  }

  const scrollTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const wdsPending = isWdsPending(deal);

  return (
    <PageContainer title={`Deal: ${deal.deal_number}`} description="View deal details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', mx: 'auto', px: { xs: 1.5, sm: 2 }, overflow: 'visible' }}>

        {/* ── Page header ── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate('/erp/deals')}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={800} lineHeight={1.2}>{deal.title}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                Deal #{deal.deal_number} · {new Date(deal.deal_date).toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            {canCreateQuotation && (
            <Button
              variant="outlined"
              size="small"
              endIcon={<IconChevronDown size={16} />}
              onClick={(e) => setQuotMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Create quotation
            </Button>
            )}
            {canCreateQuotation && (
            <Menu
              anchorEl={quotMenuAnchor}
              open={quotMenuOpen}
              onClose={() => setQuotMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 280 } } }}
            >
              {deal.deal_type === 'offer_to_purchase' && (
                <MenuItem dense onClick={() => { navigate(`/erp/purchase-orders/create?dealId=${id}`); setQuotMenuAnchor(null); }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><IconShoppingCart size={18} /></ListItemIcon>
                  <ListItemText primary="Purchase quotation" secondary="Client (company)" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                </MenuItem>
              )}
              {deal.downstream_partner_supplier_id && (
                <MenuItem dense onClick={() => { navigate(`/erp/purchase-orders/create?dealId=${id}&supplierId=${deal.downstream_partner_supplier_id}`); setQuotMenuAnchor(null); }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><IconShoppingCart size={18} /></ListItemIcon>
                  <ListItemText primary="Purchase quotation" secondary="Downstream supplier" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                </MenuItem>
              )}
              {deal.deal_type !== 'offer_to_purchase' && (
                <MenuItem dense onClick={() => { navigate(`/erp/quotations/create?dealId=${id}`); setQuotMenuAnchor(null); }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><IconReceipt size={18} /></ListItemIcon>
                  <ListItemText primary="Service quotation" secondary="Client quotation" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                </MenuItem>
              )}
            </Menu>
            )}
            {canAttemptApproval && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={approveLoading ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={16} />}
                onClick={handleApproveDeal}
                disabled={approveLoading}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Approve
              </Button>
            )}
            {canEditDeals && (
              <Button
                variant="contained"
                size="small"
                startIcon={<IconEdit size={16} />}
                onClick={() => navigate(`/erp/deals/edit/${id}`)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Edit Deal
              </Button>
            )}
          </Stack>
        </Stack>

        {wdsPending && (
          <Alert
            severity="warning"
            icon={<IconAlertCircle size={20} />}
            sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
          >
            Pending WDS details
          </Alert>
        )}

        {/* ── Sticky section nav (top = app bar height so it sits below sticky header) ── */}
        <Box
          sx={{
            position: 'sticky',
            top: config.topbarHeight,
            zIndex: (t) => t.zIndex.appBar - 1,
            mb: 3,
            mx: { xs: -1.5, sm: -2 },
            px: { xs: 1.5, sm: 2 },
            py: 0.5,
            bgcolor: (t) => alpha(t.palette.background.paper, 0.92),
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            boxShadow: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={0}
            sx={{
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {NAV_ITEMS.map(({ id: sid, label, icon: Icon }) => {
              const active = activeSection === sid;
              return (
                <ButtonBase
                  key={sid}
                  onClick={() => scrollTo(sid)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    borderBottom: '2px solid',
                    borderColor: active ? 'primary.main' : 'transparent',
                    color: active ? 'primary.main' : 'text.secondary',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s, border-color 0.15s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <Icon size={15} />
                  {label}
                </ButtonBase>
              );
            })}
          </Stack>
        </Box>

        {/* ── SECTION 1: Deal Overview (merged) ── */}
        <SectionCard id="sec-overview">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Status bar */}
            <Stack
              direction="row"
              spacing={0}
              sx={{
                mb: 3,
                borderRadius: 2.5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              {[
                { label: 'Deal Status', value: <Chip label={deal.status?.replace(/_/g, ' ').toUpperCase()} color={getStatusColor(deal.status)} size="small" sx={{ fontWeight: 700 }} /> },
                ...(deal.status === 'lost' && deal.loss_reason ? [{ label: 'Loss Reason', value: <Typography variant="body2" color="error.main" fontWeight={600}>{deal.loss_reason}</Typography> }] : []),
                { label: 'Payment', value: <Chip label={deal.payment_status?.replace(/_/g, ' ').toUpperCase()} color={getPaymentStatusColor(deal.payment_status)} size="small" sx={{ fontWeight: 700 }} /> },
                ...(deal.service_payment_status ? [{ label: 'Service Payment', value: <Chip label={deal.service_payment_status.replace(/_/g, ' ')} color="info" size="small" sx={{ fontWeight: 700, textTransform: 'capitalize' }} /> }] : []),
                ...(!hideDealAmounts ? [
                  { label: 'Total', value: <Typography variant="subtitle1" fontWeight={800} color="primary.main">{deal.currency} {Number(deal.total).toFixed(2)}</Typography> },
                  ...(deal.payment_status !== 'unpaid' ? [{ label: 'Paid', value: <Typography variant="subtitle1" fontWeight={700} color="success.main">{deal.currency} {Number(deal.paid_amount).toFixed(2)}</Typography> }] : []),
                  ...(deal.payment_status !== 'unpaid' ? [{ label: 'Balance', value: <Typography variant="subtitle1" fontWeight={700} color="error.main">{deal.currency} {(Number(deal.total) - Number(deal.paid_amount)).toFixed(2)}</Typography> }] : []),
                ] : []),
              ].map((item, i, arr) => (
                <Box
                  key={i}
                  sx={{
                    flex: { xs: '1 1 50%', sm: 1 },
                    px: 2.5,
                    py: 1.75,
                    borderRight: i < arr.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: i === 0 ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{item.label}</Typography>
                  {item.value}
                </Box>
              ))}
            </Stack>

            <Grid container spacing={3}>
              {/* Deal Information (includes deal type) — md:6 pairs with Related Entities */}
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                  borderRight: { xs: 'none', md: '1px solid' },
                  borderBottom: { xs: '1px solid', md: 'none' },
                  borderColor: 'divider',
                  pr: { md: 2 },
                  pb: { xs: 2, md: 0 },
                }}
              >
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={2}>Deal Information</Typography>
                <InfoRow label="Title" value={deal.title} />
                <InfoRow label="Deal type" value={deal.deal_type?.replace(/_/g, ' ')} />
                <InfoRow label="Deal number" value={deal.deal_number} />
                <InfoRow label="Deal date" value={new Date(deal.deal_date).toLocaleDateString()} />
                <InfoRow label="Description" value={deal.description} />
                {deal.notes && <InfoRow label="Notes" value={deal.notes} />}
                <InfoRow label="Created" value={new Date(deal.created_at).toLocaleString()} />
                <InfoRow label="Updated" value={new Date(deal.updated_at).toLocaleString()} />

                {!hideDealAmounts && deal.deal_type !== 'free_of_charge' && (
                <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>Invoice Details</Typography>
                {(() => {
                  const proformas = deal.proformaInvoices || [];
                  const taxInvoices = proformas.map(p => p.taxInvoice).filter(Boolean);
                  if (taxInvoices.length === 0 && proformas.length === 0) {
                    return (
                      <Typography variant="body2" color="error.main" fontWeight={700}>
                        Invoice creation is pending
                      </Typography>
                    );
                  }
                  const primary = taxInvoices[0] || null;
                  const proforma = proformas[0] || null;
                  if (primary) {
                    return (
                      <>
                        <InfoRow label="Invoice number" value={primary.tax_invoice_number} />
                        <InfoRow label="Invoice amount" value={`${primary.currency || deal.currency || 'AED'} ${Number(primary.total || 0).toFixed(2)}`} />
                        <InfoRow label="Payment status" value={
                          <Chip label={(primary.payment_status || 'unpaid').replace(/_/g, ' ').toUpperCase()} color={getPaymentStatusColor(primary.payment_status)} size="small" sx={{ fontWeight: 700 }} />
                        } />
                        {primary.paid_amount != null && (
                          <InfoRow label="Paid amount" value={`${primary.currency || deal.currency || 'AED'} ${Number(primary.paid_amount || 0).toFixed(2)}`} />
                        )}
                      </>
                    );
                  }
                  return (
                    <>
                      <InfoRow label="Proforma number" value={proforma.proforma_number} />
                      <InfoRow label="Proforma amount" value={`${proforma.currency || deal.currency || 'AED'} ${Number(proforma.total || 0).toFixed(2)}`} />
                      <Typography variant="body2" color="error.main" fontWeight={700} mt={1}>
                        Tax invoice creation is pending
                      </Typography>
                    </>
                  );
                })()}
                </>
                )}
              </Grid>

              {/* Related Entities */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={2}>Related Entities</Typography>
                <InfoRow label="Source lead" value={deal.lead?.lead_number} />
                <InfoRow label="Company (client)" value={deal.company?.company_name} />
                <InfoRow label="Contact person" value={deal.contact ? [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ') : null} />
                <InfoRow label="Supplier (primary)" value={deal.supplier?.company_name} />
                <InfoRow label="Downstream partner" value={deal.downstreamPartner?.company_name || deal.downstream_partner?.company_name} />
                <InfoRow label="Assigned to" value={deal.assignedUser ? [deal.assignedUser.first_name, deal.assignedUser.last_name].filter(Boolean).join(' ') : null} />
                <InfoRow label="Terms & conditions" value={
                  deal.termsList?.length > 0
                    ? deal.termsList.map((t) => t.title).join(', ')
                    : deal.termsAndConditions?.title
                } />
              </Grid>
            </Grid>

            {/* Deal images */}
            {deal.images && deal.images.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>Site images</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {deal.images.map((img, idx) => (
                    <Box
                      key={img.id}
                      onClick={() => { setLightboxIndex(idx); setLightboxOpen((p) => !p); }}
                      sx={{
                        width: 100, height: 100, borderRadius: 2, overflow: 'hidden',
                        border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                        transition: 'transform 0.15s',
                        '&:hover': { transform: 'scale(1.04)', borderColor: 'primary.main' },
                      }}
                    >
                      <Box component="img" src={apiService.getUploadUrl(img.file_path)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
                <FsLightbox toggler={lightboxOpen} sources={deal.images.map((img) => apiService.getUploadUrl(img.file_path))} sourceIndex={lightboxIndex} />
              </>
            )}
          </CardContent>
        </SectionCard>

        {/* ── SECTION 2: Products & Services ── */}
        <SectionCard id="sec-products">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader icon={IconPackage} title="Products & Services" subtitle="Items included in this deal" />
            <Divider sx={{ mb: 2.5 }} />

            {deal.items && deal.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 700 }}>Product / Service</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                      {!hideDealAmounts && <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Unit Price</TableCell>}
                      {!hideDealAmounts && <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Line Total</TableCell>}
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deal.items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{item.productService?.name || '-'}</Typography></TableCell>
                        <TableCell><Chip label={item.productService?.category || '-'} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography variant="body2">{Number(item.quantity).toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{formatDealItemUom(item)}</Typography></TableCell>
                        {!hideDealAmounts && <TableCell align="right"><Typography variant="body2">{deal.currency} {Number(item.unit_price).toFixed(2)}</Typography></TableCell>}
                        {!hideDealAmounts && <TableCell align="right"><Typography variant="body2" fontWeight={600}>{deal.currency} {Number(item.line_total).toFixed(2)}</Typography></TableCell>}
                        <TableCell><Typography variant="caption" color="text.secondary">{item.notes || '-'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>No items in this deal</Typography>
              </Box>
            )}

            {/* Totals */}
            {!hideDealAmounts && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: { xs: '100%', sm: 380 } }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  {[
                    { label: 'Subtotal', value: `${deal.currency} ${Number(deal.subtotal).toFixed(2)}`, bold: false },
                    { label: `VAT (${Number(deal.vat_percentage).toFixed(1)}%)`, value: `${deal.currency} ${Number(deal.vat_amount).toFixed(2)}`, bold: false },
                  ].map((row, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between" sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                    <Typography variant="subtitle2" fontWeight={800}>Total</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">{deal.currency} {Number(deal.total).toFixed(2)}</Typography>
                  </Stack>
                  {deal.payment_status !== 'unpaid' && (
                    <>
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 2.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="success.main">Paid</Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">{deal.currency} {Number(deal.paid_amount).toFixed(2)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 2.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="error.main">Balance due</Typography>
                        <Typography variant="body2" fontWeight={600} color="error.main">{deal.currency} {(Number(deal.total) - Number(deal.paid_amount)).toFixed(2)}</Typography>
                      </Stack>
                    </>
                  )}
                </Paper>
              </Box>
            </Box>
            )}
          </CardContent>
        </SectionCard>

        {/* ── Work order task pipeline ── */}
        <SectionCard id="sec-work-progress">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader
              icon={IconHammer}
              title="Field work progress"
              subtitle="Work order tasks in sequence — pickup, processing, delivery, and more"
            />
            <Divider sx={{ mb: 2.5 }} />
            {(() => {
              const wos = [...(deal.workOrders || deal.work_orders || [])].sort(
                (a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
              );
              if (wos.length === 0) {
                return (
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <IconHammer size={40} stroke={1.25} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom>
                      No work orders yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
                      Work orders are created from an approved service order or purchase order linked to this deal.
                    </Typography>
                  </Paper>
                );
              }
              return wos.map((wo) => (
                <WorkOrderPipeline
                  key={wo.id}
                  workOrder={wo}
                  theme={theme}
                  showWorkOrderActions={showWorkOrderActions}
                  onOpen={() => navigate(`/erp/work-orders/view/${wo.id}`)}
                />
              ));
            })()}
          </CardContent>
        </SectionCard>

        {/* ── SECTION 3: Logistics Details (summary + WDS + inspection request) ── */}
        <SectionCard id="sec-logistics">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader icon={IconTruckDelivery} title="Logistics Details" subtitle="Container, requirements, WDS, and inspection requests" />
            <Divider sx={{ mb: 2.5 }} />

            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>General</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Container type" value={deal.container_type} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Location type" value={deal.location_type} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="WDS required" value={deal.wds_required ? 'Yes' : 'No'} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Inspection required" value={deal.inspection_required ? 'Yes' : 'No'} /></Grid>
              {deal.deal_type === 'offer_to_charge' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Custom inspection" value={deal.custom_inspection ? 'Yes' : 'No'} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Trakhees inspection" value={deal.trakhees_inspection ? 'Yes' : 'No'} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Dubai municipality" value={deal.dubai_municipality_inspection ? 'Yes' : 'No'} /></Grid>
                </>
              )}
            </Grid>

            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5} mt={1}>Collection details</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow label="Collection location" value={
                  deal.pickup_location ? (
                    <Button size="small" href={deal.pickup_location} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
                      Open in Maps
                    </Button>
                  ) : '—'
                } />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Contact name" value={deal.pickup_contact_name} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Contact number" value={deal.pickup_contact_number} /></Grid>
            </Grid>

            {deal.wds_required && deal.wdsDetails && !wdsPending && (
                <>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>WDS Details</Typography>
                  <Grid container spacing={2} mb={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Ref No" value={deal.wdsDetails.ref_no} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Date" value={deal.wdsDetails.date ? new Date(deal.wdsDetails.date).toLocaleDateString() : '-'} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Company name" value={deal.wdsDetails.company_name} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="License No" value={deal.wdsDetails.license_no} /></Grid>
                    <Grid size={12}><InfoRow label="Waste description" value={deal.wdsDetails.waste_description} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Container No" value={deal.wdsDetails.container_no} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Source / process" value={deal.wdsDetails.source_process} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Package type" value={deal.wdsDetails.package_type} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Qty per package" value={deal.wdsDetails.quantity_per_package} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Total weight" value={deal.wdsDetails.total_weight} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="BL No" value={deal.wdsDetails.bl_no} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="BOR No" value={deal.wdsDetails.bor_no} /></Grid>
                    <Grid size={12}><InfoRow label="Purpose" value={deal.wdsDetails.purpose} /></Grid>
                  </Grid>
                  {deal.wdsDetails.attachments?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {deal.wdsDetails.attachments.map((a, idx) => (
                        <Button key={idx} size="small" variant="outlined" href={apiService.getUploadUrl(a.file_path)} target="_blank" rel="noopener noreferrer" startIcon={<IconFileDescription size={15} />} sx={{ borderRadius: 2 }}>
                          {a.file_name || a.file_path?.split('/').pop() || 'Attachment'}
                        </Button>
                      ))}
                    </Box>
                  )}
                </>
              )}

              {deal.inspection_required && deal.inspectionRequest && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>Inspection Request</Typography>
                  {(deal.inspectionRequest.response_status === 'rejected' || deal.inspectionRequest.response_status === 'accepted') && (
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={1.5}>
                      <Chip
                        size="small"
                        label={deal.inspectionRequest.response_status === 'rejected' ? 'Rejected' : 'Accepted'}
                        color={deal.inspectionRequest.response_status === 'rejected' ? 'error' : 'success'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                  )}
                  {deal.inspectionRequest.response_status === 'rejected' && deal.inspectionRequest.rejection_reason && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Rejection reason</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{deal.inspectionRequest.rejection_reason}</Typography>
                    </Alert>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Material type" value={deal.inspectionRequest.materialType?.display_name} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Location" value={deal.inspectionRequest.location} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Location type" value={deal.inspectionRequest.location_type === 'mainland' ? 'Mainland' : deal.inspectionRequest.location_type === 'freezone' ? 'Freezone' : deal.inspectionRequest.location_type} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Gate pass" value={deal.inspectionRequest.gate_pass_requirement ? deal.inspectionRequest.gate_pass_requirement.charAt(0).toUpperCase() + deal.inspectionRequest.gate_pass_requirement.slice(1) : null} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Service type" value={deal.inspectionRequest.service_type} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Quantity" value={deal.inspectionRequest.quantity} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Safety tools" value={(() => { const st = deal.inspectionRequest.safety_tools; if (!st) return null; try { const arr = typeof st === 'string' ? JSON.parse(st) : (Array.isArray(st) ? st : []); const labels = { safety_jacket: 'Safety Jacket', safety_shoes: 'Safety Shoes', safety_coverall: 'Safety Coverall', safety_helmet: 'Safety Helmet', safety_tools_required: 'Safety Tools Required', safety_mask: 'Safety Mask', safety_goggles: 'Safety Goggles', safety_gloves: 'Safety Gloves' }; return arr.map((v) => labels[v] || v).join(', ') || null; } catch { return null; } })()} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow label="Requested by" value={deal.inspectionRequest.requestedByUser ? [deal.inspectionRequest.requestedByUser.first_name, deal.inspectionRequest.requestedByUser.last_name].filter(Boolean).join(' ') : null} /></Grid>
                    {deal.inspectionRequest.supporting_documents && (
                      <Grid size={12}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>Supporting docs:</Typography>
                          <Button size="small" startIcon={<IconDownload size={15} />} href={apiService.getUploadUrl(deal.inspectionRequest.supporting_documents)} target="_blank" rel="noopener noreferrer" download sx={{ borderRadius: 2 }}>
                            Download
                          </Button>
                        </Stack>
                      </Grid>
                    )}
                    <Grid size={12}><InfoRow label="Notes" value={deal.inspectionRequest.notes} /></Grid>
                  </Grid>
                </>
              )}
            </CardContent>
          </SectionCard>

        {/* ── SECTION 4: Inspection Report ── */}
        <SectionCard id="sec-inspection">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader
              icon={IconClipboardCheck}
              title="Inspection Report"
              action={
                <Stack direction="row" spacing={1}>
                  {deal.inspectionReport && deal.inspectionRequest?.id && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<IconFileText size={16} />}
                      onClick={openInspectionPopup}
                      sx={{ borderRadius: 2 }}
                    >
                      View report
                    </Button>
                  )}
                  {canEditDeals && !['sales', 'sales_manager'].includes(getUserRole(user)) && (
                    <Button variant="contained" size="small" startIcon={<IconPlus size={16} />} onClick={openReportDialog} sx={{ borderRadius: 2 }}>
                      {deal.inspectionReport ? 'Edit report' : 'Add report'}
                    </Button>
                  )}
                </Stack>
              }
            />
            <Divider sx={{ mb: 2.5 }} />
            {deal.inspectionReport ? (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Summary</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {deal.inspectionReport.inspection_datetime ? new Date(deal.inspectionReport.inspection_datetime).toLocaleString() : '—'}
                  {deal.inspectionReport.inspector ? ` · Inspector: ${[deal.inspectionReport.inspector.first_name, deal.inspectionReport.inspector.last_name].filter(Boolean).join(' ')}` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {deal.inspectionRequest?.id
                    ? 'Use "View report" for the full inspection layout (same as the inspection request page) in a window.'
                    : 'Full report details are available from the inspection request when linked.'}
                </Typography>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary">No inspection report added yet.</Typography>
            )}
          </CardContent>
        </SectionCard>

        {/* ── SECTION 5: Quotations ── */}
        <SectionCard id="sec-quotations">
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader icon={IconFileInvoice} title="Service & Purchase Quotations" subtitle="Client quotations and vendor purchase orders" />
            <Divider sx={{ mb: 2.5 }} />

            {relatedQuotations.length > 0 ? (
              <Box mb={3}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>Service Quotations</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        {!hideDealAmounts && <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>}
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Prepared By</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatedQuotations.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell>
                            {quotationVersionLabel(q) ? (
                              <QuotationVersionBadge quotation={q} variant="pill" />
                            ) : (
                              <Typography variant="caption" color="text.disabled">Original</Typography>
                            )}
                          </TableCell>
                          <TableCell>{q.quotation_date ? new Date(q.quotation_date).toLocaleDateString() : '-'}</TableCell>
                          {!hideDealAmounts && <TableCell>{q.currency || 'AED'} {Number(q.quotation_amount || 0).toFixed(2)}</TableCell>}
                          <TableCell><Chip label={(q.status || '-').replace(/_/g, ' ')} size="small" color={{ new:'default', sent:'info', under_review:'warning', revised:'primary', approved:'success', rejected:'error' }[q.status] || 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                          <TableCell>{q.preparedByUser ? [q.preparedByUser.first_name, q.preparedByUser.last_name].filter(Boolean).join(' ') || '-' : '-'}</TableCell>
                          <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/quotations/view/${q.id}?return=${encodeURIComponent(`/erp/deals/view/${id}`)}`)}>View</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {deal.deal_type === 'offer_to_purchase' ? 'Service quotations are not used for Offer to Purchase deals.' : 'No service quotations linked.'}
              </Typography>
            )}

            {relatedPOs.length > 0 ? (
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>Purchase Quotations</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Vendor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Expected Delivery</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatedPOs.map((po) => (
                        <TableRow key={po.id} hover>
                          <TableCell>{po.po_date ? new Date(po.po_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{po.company?.company_name || po.supplier?.company_name || '-'}</TableCell>
                          <TableCell>{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '-'}</TableCell>
                          <TableCell><Chip label={(po.status || '-').replace(/_/g, ' ')} size="small" color={{ new:'default', sent:'info', under_review:'warning', revised:'primary', approved:'success', rejected:'error' }[po.status] || 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                          <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/purchase-orders/view/${po.id}?return=${encodeURIComponent(`/erp/deals/view/${id}`)}`)}>View</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {deal.deal_type !== 'offer_to_purchase' ? 'Purchase quotations are only for Offer to Purchase deals.' : 'No purchase quotations linked.'}
              </Typography>
            )}
          </CardContent>
        </SectionCard>

        {/* ── Full inspection request view (same as inspection request page) ── */}
        <Dialog
          open={inspectionPopupOpen}
          onClose={() => {
            setInspectionPopupOpen(false);
            setInspectionPopupData(null);
          }}
          maxWidth="lg"
          fullWidth
          scroll="paper"
          PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}
        >
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
            {inspectionPopupLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
                <CircularProgress />
              </Box>
            )}
            {!inspectionPopupLoading && inspectionPopupData && (
              <InspectionRequestDetail
                request={inspectionPopupData}
                onRefresh={refreshInspectionPopup}
                hideApproveButton
                onClose={() => {
                  setInspectionPopupOpen(false);
                  setInspectionPopupData(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ── Inspection report dialog ── */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Inspection Report</DialogTitle>
          <DialogContent>
            {Object.keys(reportFormErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{Object.values(reportFormErrors)[0]}</Alert>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <DateTimePicker label="Inspection Date & Time (Required)" value={reportForm.inspectionDatetime} onChange={(v) => setReportForm((f) => ({ ...f, inspectionDatetime: v }))} slotProps={{ textField: { fullWidth: true, required: true, error: Boolean(reportFormErrors.inspectionDatetime), helperText: reportFormErrors.inspectionDatetime, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                  <TextField label="Approximate Weight (Required)" type="number" value={reportForm.approximateWeight} onChange={(e) => setReportForm((f) => ({ ...f, approximateWeight: e.target.value }))} required error={Boolean(reportFormErrors.approximateWeight)} helperText={reportFormErrors.approximateWeight} inputProps={{ min: 0, step: 'any' }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  <TextField select label="UOM" value={reportForm.weightUom} onChange={(e) => setReportForm((f) => ({ ...f, weightUom: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="tons">tons</MenuItem>
                    <MenuItem value="lbs">lbs</MenuItem>
                  </TextField>
                </Box>
                <TextField select fullWidth label="Cargo Packing Type (Required)" value={reportForm.cargoType} onChange={(e) => setReportForm((f) => ({ ...f, cargoType: e.target.value }))} required error={Boolean(reportFormErrors.cargoType)} helperText={reportFormErrors.cargoType} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="unpacked">Unpacked</MenuItem>
                  <MenuItem value="packed">Packed</MenuItem>
                  <MenuItem value="palletized">Palletized</MenuItem>
                </TextField>
                <TextField select fullWidth label="Transportation Arrangement (Required)" value={reportForm.transportationArrangement} onChange={(e) => setReportForm((f) => ({ ...f, transportationArrangement: e.target.value }))} required error={Boolean(reportFormErrors.transportationArrangement)} helperText={reportFormErrors.transportationArrangement} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="1 ton">1 ton</MenuItem>
                  <MenuItem value="3 ton">3 ton</MenuItem>
                  <MenuItem value="10 ton">10 ton</MenuItem>
                  <MenuItem value="trailer">Trailer</MenuItem>
                  <MenuItem value="reefer">Reefer</MenuItem>
                  <MenuItem value="lowbed trailer">Lowbed Trailer</MenuItem>
                </TextField>
                <TextField fullWidth label="Approximate Value (Required)" type="number" value={reportForm.approximateValue} onChange={(e) => setReportForm((f) => ({ ...f, approximateValue: e.target.value }))} required error={Boolean(reportFormErrors.approximateValue)} helperText={reportFormErrors.approximateValue} inputProps={{ min: 0, step: 'any' }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>Images (Required) — at least one</Typography>
                  {reportFormErrors.images && <Typography variant="caption" color="error" display="block" mb={1}>{reportFormErrors.images}</Typography>}
                  <ReportImageDropzone onDrop={async (files) => { for (const file of files) { try { const res = await apiService.uploadDealImage(file); if (res.success && res.data?.path) setReportForm((f) => ({ ...f, images: [...f.images, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }] })); } catch (err) { setError(err.message || 'Upload failed'); } } }} />
                  {reportForm.images.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {reportForm.images.map((img, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                          <Box component="img" src={img.url} alt="" sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                          <Button size="small" onClick={() => setReportForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))} sx={{ position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, p: 0 }}>×</Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                {isInspectionRole(user) ? (
                  <TextField
                    fullWidth
                    label="Inspector"
                    value={formatUserDisplayName(user)}
                    InputProps={{ readOnly: true }}
                    helperText="Auto-filled from your account"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ) : (
                  <Autocomplete options={users} getOptionLabel={(o) => formatUserDisplayName(o)} value={users.find((u) => u.id === reportForm.inspectorId) || null} onChange={(_, v) => setReportForm((f) => ({ ...f, inspectorId: v?.id || null }))} renderInput={(params) => <TextField {...params} label="Inspector's Name (Required)" required error={Boolean(reportFormErrors.inspectorId)} helperText={reportFormErrors.inspectorId} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />} />
                )}
                {deal?.inspectionReport?.approved_by_id && deal?.inspectionReport?.approvedBy && (
                  <TextField
                    fullWidth
                    label="Approved by"
                    value={formatUserDisplayName(deal.inspectionReport.approvedBy)}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                {isInspectionRole(user) && !deal?.inspectionReport?.approved_by_id && (
                  <Typography variant="body2" color="text.secondary">
                    Approval is done by sales, sales manager, operations manager, or admin after you submit the report.
                  </Typography>
                )}
                <TextField fullWidth multiline rows={3} label="Notes" value={reportForm.notes} onChange={(e) => setReportForm((f) => ({ ...f, notes: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReportDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={saveReport} disabled={reportSaving} sx={{ borderRadius: 2 }}>
              {reportSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="deal"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => setApprovalDialogOpen(false)}
          onDecideLater={() => setApprovalDialogOpen(false)}
          onRequestApproval={handleRequestDealApproval}
          onApproveWithPin={handleApproveDealWithPin}
          approveButtonLabel="Approve deal"
        />
      </Box>
    </PageContainer>
  );
};

export default DealView;
