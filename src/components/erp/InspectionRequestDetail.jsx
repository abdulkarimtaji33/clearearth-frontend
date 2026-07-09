import React, { useState, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router';
import FsLightbox from 'fslightbox-react';
import {
  IconArrowLeft,
  IconEdit,
  IconPhoto,
  IconMapPin,
  IconTruck,
  IconUser,
  IconShieldCheck,
  IconCalendar,
  IconWeight,
  IconPackage,
  IconCurrencyDollar,
  IconClipboardList,
  IconCheck,
  IconX,
  IconDownload,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import UomSelectField from './UomSelectField';
import {
  isInspectionRole,
  canApproveInspectionReport,
  formatUserDisplayName,
  resolveInspectorIdForReport,
} from '../../utils/inspectionReportHelpers';

const SAFETY_TOOL_LABELS = {
  safety_jacket: 'Safety Jacket',
  safety_shoes: 'Safety Shoes',
  safety_coverall: 'Safety Coverall',
  safety_helmet: 'Safety Helmet',
  safety_tools_required: 'Safety Tools Required',
  safety_mask: 'Safety Mask',
  safety_goggles: 'Safety Goggles',
  safety_gloves: 'Safety Gloves',
};

/* ── small helpers ── */
const SmallLabel = ({ children }) => (
  <Typography variant="caption" color="text.disabled" fontWeight={700}
    sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.6rem', display: 'block', mb: 0.3 }}>
    {children}
  </Typography>
);

const FieldVal = ({ children }) => (
  <Typography variant="body2" fontWeight={600} color="text.primary">{children || '—'}</Typography>
);

const formatRequestQuantity = (request) => {
  if (request?.quantity_uom === 'lumpsum') {
    return request.lumpsum_price != null ? `${request.lumpsum_price} (lumpsum)` : 'Lumpsum';
  }
  if (request?.quantity != null) {
    return `${request.quantity}${request.quantity_uom ? ` ${request.quantity_uom}` : ''}`;
  }
  return '—';
};

const NotesBlock = ({ label, value }) => (
  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
    <SmallLabel>{label}</SmallLabel>
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, mt: 0.25 }}>
      {value?.trim() ? value.trim() : '—'}
    </Typography>
  </Box>
);

/* stat card used in report section */
const StatCard = ({ icon, label, value, sub, accent }) => (
  <Box sx={{
    p: 2, borderRadius: 2.5, border: '1px solid',
    borderColor: accent ? 'primary.main' + '30' : 'divider',
    background: (t) => accent
      ? t.palette.mode === 'dark' ? `${t.palette.primary.main}10` : `${t.palette.primary.main}08`
      : t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fb',
    display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%',
  }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <SmallLabel>{label}</SmallLabel>
      {icon && (
        <Box sx={{ color: accent ? 'primary.main' : 'text.disabled', display: 'flex', alignItems: 'center', mt: -0.25 }}>
          {icon}
        </Box>
      )}
    </Stack>
    <Typography variant="h6" fontWeight={800} lineHeight={1.1} color={accent ? 'primary.main' : 'text.primary'}>
      {value || '—'}
    </Typography>
    {sub && <Typography variant="caption" color="text.secondary" mt={0.25}>{sub}</Typography>}
  </Box>
);

/* personnel row (inspector / approved by) */
const PersonRow = ({ icon, label, name, sub, verified }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{
    p: 1.75, borderRadius: 2.5, border: '1px solid',
    borderColor: verified ? 'success.main' + '40' : 'divider',
    background: (t) => verified
      ? t.palette.mode === 'dark' ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.05)'
      : t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fb',
    height: '100%',
  }}>
    <Avatar sx={{
      width: 38, height: 38, flexShrink: 0,
      bgcolor: verified ? 'success.main' : 'primary.main',
      fontSize: '1rem',
    }}>
      {icon}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <SmallLabel>{label}</SmallLabel>
      <Typography variant="body2" fontWeight={700} noWrap>{name || '—'}</Typography>
      {sub && <Typography variant="caption" color={verified ? 'success.main' : 'text.secondary'}>{sub}</Typography>}
    </Box>
  </Stack>
);

/* dropzone */
const ReportImageDropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.tif'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    onDrop: (files) => { if (files.length) onDrop(files); },
  });
  return (
    <Box {...getRootProps()} sx={{
      border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3,
      textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' },
    }}>
      <input {...getInputProps()} />
      <IconPhoto size={32} style={{ opacity: 0.5 }} />
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Drag & drop or click — JPG, PNG, HEIC, PDF and more
      </Typography>
    </Box>
  );
};

const INSPECTION_STAGES = [
  { value: 'request_submitted',    label: 'Request Submitted' },
  { value: 'team_assigned',        label: 'Team Assigned' },
  { value: 'inspection_completed', label: 'Inspection Completed' },
  { value: 'report_submitted',     label: 'Report Submitted' },
];

const STAGE_COLORS = {
  request_submitted:    'default',
  team_assigned:        'info',
  inspection_completed: 'warning',
  report_submitted:     'success',
};

const InspectionStageStepper = ({ currentStatus, requestId, onUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const currentIdx = INSPECTION_STAGES.findIndex(s => s.value === currentStatus);

  const handleClick = async (value, idx) => {
    if (value === currentStatus || updating) return;
    setUpdating(true);
    try {
      await apiService.updateInspectionRequestStatus(requestId, value);
      if (onUpdated) await onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.6} fontSize="0.65rem" display="block" mb={1.5}>
        Inspection Stage
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
        {INSPECTION_STAGES.map((stage, idx) => {
          const isActive = stage.value === currentStatus;
          const isPast = idx < currentIdx;
          return (
            <Chip
              key={stage.value}
              label={stage.label}
              size="small"
              color={isActive ? STAGE_COLORS[stage.value] : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => handleClick(stage.value, idx)}
              disabled={updating}
              sx={{
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.72rem',
                cursor: 'pointer',
                opacity: isPast ? 0.6 : 1,
                transition: 'all 0.15s',
                '&:hover': { opacity: 1 },
              }}
            />
          );
        })}
        {updating && <CircularProgress size={14} sx={{ ml: 1 }} />}
      </Stack>
    </Box>
  );
};

/**
 * Full inspection request + report UI (same as the standalone page).
 * @param {object} request — inspection request payload from API
 * @param {() => Promise<void>|void} onRefresh — called after save / approve
 * @param {() => void} [onClose] — when set, back control becomes a close icon (e.g. dialog)
 */
const InspectionRequestDetail = ({ request, onRefresh, onClose, hideApproveButton = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [error, setError] = useState('');

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportFormErrors, setReportFormErrors] = useState({});
  const [reportSaving, setReportSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState([]);
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

  const [approving, setApproving] = useState(false);

  const refresh = useCallback(async () => {
    if (onRefresh) await onRefresh();
  }, [onRefresh]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getInspectors();
      if (res.success) setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchUnitsOfMeasure = useCallback(async () => {
    try {
      const res = await apiService.getAllDropdowns();
      if (res.success) setUnitsOfMeasure(res.data?.units_of_measure || []);
    } catch (err) { console.error(err); }
  }, []);

  const openReportDialog = () => {
    setReportFormErrors({});
    setError('');
    const r = request?.deal?.inspectionReport;
    const inspectorId = resolveInspectorIdForReport(user, r?.inspector_id || null);
    if (r) {
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
      setReportForm({
        inspectionDatetime: null, approximateWeight: '', weightUom: 'kg',
        cargoType: '', transportationArrangement: '', approximateValue: '',
        images: [], inspectorId, approvedById: null, notes: '',
      });
    }
    fetchUsers();
    fetchUnitsOfMeasure();
    setReportDialogOpen(true);
  };

  const saveReport = async () => {
    const errs = {};
    if (!reportForm.inspectionDatetime) errs.inspectionDatetime = 'Inspection date and time is required';
    if (reportForm.weightUom !== 'lumpsum' && (reportForm.approximateWeight === '' || reportForm.approximateWeight == null)) errs.approximateWeight = 'Approximate weight is required';
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
      const payload = {
        inspectionDatetime: reportForm.inspectionDatetime?.toISOString?.() || null,
        approximateWeight: reportForm.approximateWeight ? parseFloat(reportForm.approximateWeight) : null,
        weightUom: reportForm.weightUom || null,
        cargoType: reportForm.cargoType || null,
        transportationArrangement: reportForm.transportationArrangement || null,
        approximateValue: reportForm.approximateValue ? parseFloat(reportForm.approximateValue) : null,
        images: reportForm.images.map((i) => i.path),
        inspectorId: reportForm.inspectorId,
        notes: reportForm.notes || null,
      };
      await apiService.saveInspectionReport(request.deal_id, payload);
      setReportDialogOpen(false);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setReportSaving(false);
    }
  };

  const handleApprove = async () => {
    const report = request?.deal?.inspectionReport;
    if (!report || !canApproveInspectionReport(user)) return;
    setApproving(true);
    setError('');
    try {
      const images = Array.isArray(report.images) ? report.images : [];
      await apiService.saveInspectionReport(request.deal_id, {
        inspectionDatetime: report.inspection_datetime,
        approximateWeight: report.approximate_weight != null ? parseFloat(report.approximate_weight) : null,
        weightUom: report.weight_uom || null,
        cargoType: report.cargo_type || null,
        transportationArrangement: report.transportation_arrangement || null,
        approximateValue: report.approximate_value != null ? parseFloat(report.approximate_value) : null,
        images,
        inspectorId: report.inspector_id || null,
        approvedById: user?.id || null,
        notes: report.notes || null,
      });
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  if (!request) return null;

  const deal = request.deal;
  const report = deal?.inspectionReport;
  const contact = deal?.contact;
  const isApproved = Boolean(report?.approved_by_id);
  const userIsInspector = isInspectionRole(user);
  const userCanApproveReport = canApproveInspectionReport(user);

  const safetyTools = (() => {
    const st = request?.safety_tools;
    if (!st) return [];
    try {
      const arr = typeof st === 'string' ? JSON.parse(st) : (Array.isArray(st) ? st : []);
      return arr.map((v) => SAFETY_TOOL_LABELS[v] || v);
    } catch { return []; }
  })();

  const requestedByName = request?.requestedByUser
    ? [request.requestedByUser.first_name, request.requestedByUser.last_name].filter(Boolean).join(' ')
    : null;

  const inspectorName = report?.inspector
    ? [report.inspector.first_name, report.inspector.last_name].filter(Boolean).join(' ')
    : null;

  const approvedByName = report?.approvedBy
    ? [report.approvedBy.first_name, report.approvedBy.last_name].filter(Boolean).join(' ')
    : null;

  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    : null;

  const clientName = deal?.company?.company_name || deal?.supplier?.company_name || null;

  const lineItemNotes = (deal?.items || [])
    .map((item) => ({
      productName: item.productService?.name || 'Product',
      notes: item.notes?.trim() || '',
    }))
    .filter((item) => item.notes);

  return (
    <Box>
        {/* ── page title row ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {onClose ? (
              <IconButton
                size="small"
                onClick={onClose}
                aria-label="Close"
                sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  color: 'text.secondary', flexShrink: 0,
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                <IconX size={18} />
              </IconButton>
            ) : (
              <Button
                size="small"
                onClick={() => navigate('/erp/inspection-requests')}
                sx={{
                  minWidth: 36, width: 36, height: 36, p: 0, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  color: 'text.secondary', flexShrink: 0,
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                <IconArrowLeft size={18} />
              </Button>
            )}
            <Box>
              <Typography variant={onClose ? 'h5' : 'h4'} fontWeight={800} lineHeight={1.2}>Inspection Report</Typography>
              <Stack direction="row" spacing={1} mt={0.75} flexWrap="wrap">
                {request.id && (
                  <Chip
                    label={`REQ-${String(request.id).padStart(4, '0')}`}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.7rem', bgcolor: 'action.hover', height: 20 }}
                  />
                )}
                {deal?.deal_number && deal?.id && (
                  <Chip
                    component={Link}
                    to={`/erp/deals/view/${deal.id}`}
                    label={`Deal #: ${deal.deal_number}`}
                    size="small"
                    clickable
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      bgcolor: 'action.hover',
                      height: 20,
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  />
                )}
                {isApproved && (
                  <Chip
                    icon={<IconCheck size={11} />}
                    label="Approved"
                    size="small"
                    color="success"
                    sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
          {userIsInspector && (
            <Button
              variant="contained"
              startIcon={<IconEdit size={16} />}
              onClick={openReportDialog}
              sx={{ borderRadius: 2, fontWeight: 600, flexShrink: 0 }}
            >
              {report ? 'Edit Report' : 'Add Report'}
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Inspection Stage stepper ── */}
        <InspectionStageStepper
          currentStatus={request.status || 'request_submitted'}
          requestId={request.id}
          onUpdated={refresh}
        />

        {/* ── main two-column layout ── */}
        <Grid container spacing={3} alignItems="flex-start">

          {/* ── LEFT: Request Details ── */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* card header */}
              <Box sx={{
                px: 3, pt: 2.5, pb: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                  }}>
                    <IconClipboardList size={16} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>Request Details</Typography>
                </Stack>
              </Box>

              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2.5} sx={{ flex: 1 }}>

                  {/* response status */}
                  {(request.response_status === 'rejected' || request.response_status === 'accepted') && (
                    <Box>
                      <SmallLabel>Response</SmallLabel>
                      <Chip
                        size="small"
                        label={request.response_status === 'rejected' ? 'Rejected' : 'Accepted'}
                        color={request.response_status === 'rejected' ? 'error' : 'success'}
                        sx={{ fontWeight: 700, mt: 0.25 }}
                      />
                    </Box>
                  )}

                  {request.response_status === 'rejected' && request.rejection_reason && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Rejection reason</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{request.rejection_reason}</Typography>
                    </Alert>
                  )}

                  {/* deal */}
                  <Box>
                    <SmallLabel>Deal</SmallLabel>
                    <Typography variant="body2" fontWeight={700} color="text.primary" lineHeight={1.3}>
                      {deal?.title || deal?.deal_number || '—'}
                    </Typography>
                  </Box>

                  {/* client + material */}
                  <Grid container spacing={2}>
                    {clientName && (
                      <Grid size={6}>
                        <SmallLabel>Client</SmallLabel>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'primary.main' }}>
                            {clientName[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{clientName}</Typography>
                        </Stack>
                      </Grid>
                    )}
                    <Grid size={clientName ? 6 : 12}>
                      <SmallLabel>Material Type</SmallLabel>
                      <FieldVal>{request.materialType?.display_name}</FieldVal>
                    </Grid>
                  </Grid>

                  {/* quantity + service type */}
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <SmallLabel>Quantity</SmallLabel>
                      <FieldVal>{formatRequestQuantity(request)}</FieldVal>
                    </Grid>
                    <Grid size={6}>
                      <SmallLabel>Service Type</SmallLabel>
                      {request.service_type ? (
                        <Chip
                          label={request.service_type.toUpperCase()}
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, borderRadius: 1 }}
                        />
                      ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </Grid>
                  </Grid>

                  {/* location */}
                  <Box sx={{
                    p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                    background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8f9fb',
                  }}>
                    <SmallLabel>Location</SmallLabel>
                    <Stack direction="row" spacing={0.75} alignItems="flex-start" mt={0.25}>
                      <IconMapPin size={14} style={{ flexShrink: 0, marginTop: 2, opacity: 0.6 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{request.location || '—'}</Typography>
                        {request.location_type && (
                          <Typography variant="caption" color="text.secondary">{request.location_type}</Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  {/* safety tools */}
                  {safetyTools.length > 0 && (
                    <Box>
                      <SmallLabel>Safety Tools</SmallLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                        {safetyTools.map((t) => (
                          <Chip key={t} label={t} size="small"
                            sx={{ height: 19, fontSize: '0.6rem', fontWeight: 600, borderRadius: 1,
                              bgcolor: (th) => th.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* gate pass */}
                  {request.gate_pass_requirement && (
                    <Box>
                      <SmallLabel>Gate Pass Required</SmallLabel>
                      <FieldVal>{request.gate_pass_requirement}</FieldVal>
                    </Box>
                  )}

                  {/* requested by */}
                  <Box>
                    <SmallLabel>Requested By</SmallLabel>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.main' }}>
                        {requestedByName?.[0] || '?'}
                      </Avatar>
                      <FieldVal>{requestedByName}</FieldVal>
                    </Stack>
                  </Box>

                  {request.supporting_documents && (
                    <Box>
                      <SmallLabel>Supporting document</SmallLabel>
                      <Button
                        size="small"
                        startIcon={<IconDownload size={15} />}
                        href={apiService.getUploadUrl(request.supporting_documents)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        sx={{ mt: 0.5, borderRadius: 2 }}
                      >
                        View document
                      </Button>
                    </Box>
                  )}

                  <NotesBlock label="Extra notes" value={request.notes} />

                  {deal?.notes?.trim() && (
                    <NotesBlock label="Additional deal notes" value={deal.notes} />
                  )}

                  {lineItemNotes.length > 0 && (
                    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <SmallLabel>Product brief descriptions</SmallLabel>
                      <Stack spacing={1.25} mt={0.75}>
                        {lineItemNotes.map((item, idx) => (
                          <Box key={`${item.productName}-${idx}`}>
                            <Typography variant="body2" fontWeight={700}>{item.productName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {item.notes}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* contact */}
                  {contact && (
                    <>
                      <Divider />
                      <Box sx={{
                        p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                        background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8f9fb',
                      }}>
                        <SmallLabel>Contact</SmallLabel>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5} mb={contact.email || contact.phone || contact.mobile ? 1.5 : 0}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'info.main' }}>
                            {contactName?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{contactName}</Typography>
                            {contact.designation && (
                              <Typography variant="caption" color="text.secondary">{contact.designation}</Typography>
                            )}
                          </Box>
                        </Stack>
                        {contact.email && (
                          <Typography
                            component="a" href={`mailto:${contact.email}`}
                            variant="caption" fontWeight={600} color="primary.main" display="block"
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, mb: 0.25 }}
                          >
                            {contact.email}
                          </Typography>
                        )}
                        {contact.phone && (
                          <Typography component="a" href={`tel:${contact.phone}`} variant="caption" fontWeight={600}
                            color="text.secondary" display="block"
                            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' }, mb: 0.25 }}>
                            {contact.phone}
                          </Typography>
                        )}
                        {contact.mobile && contact.mobile !== contact.phone && (
                          <Typography component="a" href={`tel:${contact.mobile}`} variant="caption" fontWeight={600}
                            color="text.secondary" display="block"
                            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                            {contact.mobile}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Stack>

                {/* status banner */}
                <Box sx={{
                  mt: 3, p: 2, borderRadius: 2.5,
                  background: (t) => isApproved
                    ? `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`
                    : report
                    ? `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`
                    : `linear-gradient(135deg, #78909c 0%, #546e7a 100%)`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  overflow: 'hidden', position: 'relative',
                }}>
                  <Box sx={{ position: 'absolute', right: -10, top: -10, opacity: 0.08, fontSize: '5rem', lineHeight: 1, userSelect: 'none' }}>
                    {isApproved ? '✓' : report ? '≡' : '○'}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.58rem', display: 'block' }}>
                      Status
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}>
                      {isApproved ? <IconShieldCheck size={16} /> : <IconClipboardList size={16} />}
                      <Typography variant="subtitle2" fontWeight={800}>
                        {isApproved ? 'Approved' : report ? 'Ready for Review' : 'Pending Report'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── RIGHT: Report Details ── */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              {/* card header */}
              <Box sx={{
                px: 3, pt: 2.5, pb: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e3f2ec',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <IconClipboardList size={16} color="#2e7d5e" />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>Inspection Report Details</Typography>
                  </Stack>
                  {report && (
                    <Box sx={{ textAlign: 'right' }}>
                      <SmallLabel>Date Created</SmallLabel>
                      <Typography variant="body2" fontWeight={700}>
                        {new Date(report.createdAt || report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              <CardContent sx={{ p: 3 }}>

                {report ? (
                  <>
                    {/* stat cards row */}
                    <Grid container spacing={2} mb={3}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <StatCard
                          icon={<IconCalendar size={16} />}
                          label="Inspection Date"
                          value={report.inspection_datetime
                            ? new Date(report.inspection_datetime).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                            : '—'}
                          sub={report.inspection_datetime
                            ? new Date(report.inspection_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : null}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <StatCard
                          icon={<IconWeight size={16} />}
                          label="Approx. Weight"
                          value={report.approximate_weight != null
                            ? `${parseFloat(report.approximate_weight).toFixed(2)} ${report.weight_uom || 'kg'}`
                            : '—'}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <StatCard
                          icon={<IconPackage size={16} />}
                          label="Cargo Packing Type"
                          value={report.cargo_type
                            ? report.cargo_type.charAt(0).toUpperCase() + report.cargo_type.slice(1)
                            : '—'}
                        />
                      </Grid>
                    </Grid>

                    {/* transportation + approved by row */}
                    <Grid container spacing={2} mb={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PersonRow
                          icon={<IconTruck size={18} />}
                          label="Transportation"
                          name={report.transportation_arrangement
                            ? report.transportation_arrangement.charAt(0).toUpperCase() + report.transportation_arrangement.slice(1)
                            : '—'}
                          sub="Logistics Unit"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PersonRow
                          icon={<IconShieldCheck size={18} />}
                          label="Approved By"
                          name={approvedByName}
                          sub={isApproved ? 'Verified Auditor' : 'Not yet approved'}
                          verified={isApproved}
                        />
                      </Grid>
                    </Grid>

                    {/* inspector + approx value */}
                    <Grid container spacing={2} mb={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PersonRow
                          icon={<IconUser size={18} />}
                          label="Lead Inspector"
                          name={inspectorName}
                          sub="Field Inspector"
                          verified={Boolean(inspectorName)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <StatCard
                          icon={<IconCurrencyDollar size={16} />}
                          label="Approx. Value"
                          accent
                          value={report.approximate_value != null
                            ? `${deal?.currency || 'AED'} ${parseFloat(report.approximate_value).toLocaleString()}`
                            : '—'}
                        />
                      </Grid>
                    </Grid>

                    {/* notes */}
                    {report.notes && (
                      <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <SmallLabel>Notes</SmallLabel>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mt: 0.5 }}>
                          {report.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* evidence & media */}
                    {report.images?.length > 0 && (
                      <>
                        <Divider sx={{ mb: 2.5 }} />
                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700}>Evidence & Media</Typography>
                          <Chip label={`${report.images.length} FILES`} size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: 1 }} />
                        </Stack>
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: 'repeat(3,1fr)', sm: 'repeat(4,1fr)', md: 'repeat(5,1fr)' },
                          gap: 1.5,
                        }}>
                          {report.images.map((path, idx) => (
                            <Box
                              key={idx}
                              component="img"
                              src={apiService.getUploadUrl(path)}
                              alt=""
                              onClick={() => { setLightboxIndex(idx); setLightboxOpen((p) => !p); }}
                              sx={{
                                width: '100%', aspectRatio: '1', objectFit: 'cover',
                                borderRadius: 2, border: '1px solid', borderColor: 'divider',
                                cursor: 'pointer',
                                transition: 'transform 0.18s, box-shadow 0.18s',
                                '&:hover': { transform: 'scale(1.04)', boxShadow: 4 },
                              }}
                            />
                          ))}
                        </Box>
                        <FsLightbox
                          toggler={lightboxOpen}
                          sources={report.images.map((p) => apiService.getUploadUrl(p))}
                          sourceIndex={lightboxIndex}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <IconClipboardList size={48} style={{ opacity: 0.2 }} />
                    <Typography variant="body1" color="text.disabled" mt={1.5} fontWeight={600}>
                      No inspection report submitted yet.
                    </Typography>
                    <Button variant="contained" sx={{ mt: 2, borderRadius: 2 }} onClick={openReportDialog}>
                      Add Report
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── bottom action bar ── */}
        {report && !isApproved && userCanApproveReport && !hideApproveButton && (
          <Stack direction="row" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={approving ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={17} />}
              onClick={handleApprove}
              disabled={approving}
              sx={{ borderRadius: 2.5, fontWeight: 700, px: 4 }}
            >
              {approving ? 'Approving…' : 'Approve report'}
            </Button>
          </Stack>
        )}

        {/* ── Edit Report Dialog ── */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {request?.deal?.inspectionReport ? 'Edit Inspection Report' : 'Add Inspection Report'}
          </DialogTitle>
          <DialogContent>
            {Object.keys(reportFormErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>{Object.values(reportFormErrors)[0]}</Alert>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <DateTimePicker
                  label="Inspection Date & Time (Required)"
                  value={reportForm.inspectionDatetime}
                  onChange={(v) => setReportForm((f) => ({ ...f, inspectionDatetime: v }))}
                  slotProps={{ textField: { fullWidth: true, required: true, error: Boolean(reportFormErrors.inspectionDatetime), helperText: reportFormErrors.inspectionDatetime, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                  <UomSelectField
                    label="UOM"
                    value={reportForm.weightUom}
                    onChange={(v) => setReportForm((f) => ({ ...f, weightUom: v }))}
                    unitsOfMeasure={unitsOfMeasure}
                    onUnitsChange={setUnitsOfMeasure}
                    extraOptions={[{ value: 'lumpsum', label: 'Lumpsum' }]}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  {reportForm.weightUom !== 'lumpsum' && (
                    <TextField label="Approximate Weight" type="number" value={reportForm.approximateWeight}
                      onChange={(e) => setReportForm((f) => ({ ...f, approximateWeight: e.target.value }))}
                      error={Boolean(reportFormErrors.approximateWeight)} helperText={reportFormErrors.approximateWeight}
                      inputProps={{ step: 'any' }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  )}
                </Box>
                <TextField select fullWidth label="Cargo Packing Type (Required)" value={reportForm.cargoType}
                  onChange={(e) => setReportForm((f) => ({ ...f, cargoType: e.target.value }))}
                  required error={Boolean(reportFormErrors.cargoType)} helperText={reportFormErrors.cargoType}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="unpacked">Unpacked</MenuItem>
                  <MenuItem value="packed">Packed</MenuItem>
                  <MenuItem value="palletized">Palletized</MenuItem>
                </TextField>
                <TextField select fullWidth label="Transportation Arrangement (Required)" value={reportForm.transportationArrangement}
                  onChange={(e) => setReportForm((f) => ({ ...f, transportationArrangement: e.target.value }))}
                  required error={Boolean(reportFormErrors.transportationArrangement)} helperText={reportFormErrors.transportationArrangement}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="1 ton">1 ton</MenuItem>
                  <MenuItem value="3 ton">3 ton</MenuItem>
                  <MenuItem value="10 ton">10 ton</MenuItem>
                  <MenuItem value="trailer">Trailer</MenuItem>
                  <MenuItem value="reefer">Reefer</MenuItem>
                  <MenuItem value="lowbed trailer">Lowbed Trailer</MenuItem>
                </TextField>
                <TextField fullWidth label="Approximate Value (Required)" type="number" value={reportForm.approximateValue}
                  onChange={(e) => setReportForm((f) => ({ ...f, approximateValue: e.target.value }))}
                  required error={Boolean(reportFormErrors.approximateValue)} helperText={reportFormErrors.approximateValue}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Images (Required)</Typography>
                  {reportFormErrors.images && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{reportFormErrors.images}</Typography>
                  )}
                  <ReportImageDropzone
                    onDrop={async (files) => {
                      for (const file of files) {
                        try {
                          const res = await apiService.uploadDealImage(file);
                          if (res.success && res.data?.path)
                            setReportForm((f) => ({ ...f, images: [...f.images, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }] }));
                        } catch (err) { setError(err.message || 'Upload failed'); }
                      }
                    }}
                  />
                  {reportForm.images.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {reportForm.images.map((img, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                          <Box component="img" src={img.url} alt="" sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                          <Button size="small"
                            onClick={() => setReportForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                            sx={{ position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, p: 0 }}>×</Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                {userIsInspector ? (
                  <TextField
                    fullWidth
                    label="Inspector"
                    value={formatUserDisplayName(user)}
                    InputProps={{ readOnly: true }}
                    helperText="Auto-filled from your account"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ) : (
                  <Autocomplete
                    options={users}
                    getOptionLabel={(o) => formatUserDisplayName(o)}
                    value={users.find((u) => u.id === reportForm.inspectorId) || null}
                    onChange={(_, v) => setReportForm((f) => ({ ...f, inspectorId: v?.id || null }))}
                    renderInput={(params) => <TextField {...params} label="Inspector (Required)" required
                      error={Boolean(reportFormErrors.inspectorId)} helperText={reportFormErrors.inspectorId}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                  />
                )}
                {isApproved && approvedByName && (
                  <TextField
                    fullWidth
                    label="Approved by"
                    value={approvedByName}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                {!isApproved && userIsInspector && (
                  <Typography variant="body2" color="text.secondary">
                    Approval is done by sales, sales manager, operations manager, or admin after you submit the report.
                  </Typography>
                )}
                <TextField fullWidth multiline rows={3} label="Notes" value={reportForm.notes}
                  onChange={(e) => setReportForm((f) => ({ ...f, notes: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveReport} disabled={reportSaving} sx={{ borderRadius: 2 }}>
              {reportSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

    </Box>
  );
};

export default InspectionRequestDetail;
