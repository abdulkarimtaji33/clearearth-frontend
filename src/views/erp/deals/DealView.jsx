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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router';
import FsLightbox from 'fslightbox-react';
import { IconArrowLeft, IconEdit, IconDownload, IconPlus, IconPhoto, IconReceipt, IconShoppingCart, IconFileDescription } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    pending: 'warning',
    approved: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

const getPaymentStatusColor = (status) => {
  const colors = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
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
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={4} md={3}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {label}:
      </Typography>
    </Grid>
    <Grid item xs={8} md={9}>
      <Typography variant="body2">{value || '-'}</Typography>
    </Grid>
  </Grid>
);

const DealView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deal, setDeal] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reportLightboxOpen, setReportLightboxOpen] = useState(false);
  const [reportLightboxIndex, setReportLightboxIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportFormErrors, setReportFormErrors] = useState({});
  const [reportSaving, setReportSaving] = useState(false);
  const [users, setUsers] = useState([]);
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

  const fetchDeal = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.getDeal(id);
      if (response.success) {
        setDeal(response.data);
      }
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
      if (quotRes.success) setRelatedQuotations(Array.isArray(quotRes.data) ? quotRes.data : []);
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

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getUsers({ pageSize: 500 });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setUsers(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const openReportDialog = () => {
    setReportFormErrors({});
    setError('');
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
        inspectorId: r.inspector_id || null,
        approvedById: r.approved_by_id || null,
        notes: r.notes || '',
      });
    } else {
      setReportForm({
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
    }
    fetchUsers();
    setReportDialogOpen(true);
  };

  const saveReport = async () => {
    const errs = {};
    if (!reportForm.inspectionDatetime) errs.inspectionDatetime = 'Inspection date and time is required';
    if (reportForm.approximateWeight === '' || reportForm.approximateWeight == null) errs.approximateWeight = 'Approximate weight is required';
    if (!reportForm.cargoType?.trim()) errs.cargoType = 'Cargo type is required';
    if (!reportForm.transportationArrangement?.trim()) errs.transportationArrangement = 'Transportation arrangement is required';
    if (reportForm.approximateValue === '' || reportForm.approximateValue == null) errs.approximateValue = 'Approximate value is required';
    if (!reportForm.inspectorId) errs.inspectorId = "Inspector's name is required";
    if (!reportForm.approvedById) errs.approvedById = 'Approved by is required';
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
        approvedById: reportForm.approvedById,
        notes: reportForm.notes || null,
      });
      setReportDialogOpen(false);
      fetchDeal();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setReportSaving(false);
    }
  };

  if (!id) {
    return (
      <PageContainer title="Invalid Deal">
        <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
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
        <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Deal not found'}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/erp/deals')}>
            Back to Deals
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Deal: ${deal.deal_number}`} description="View deal details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={20} />}
              onClick={() => navigate('/erp/deals')}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h3" fontWeight={700}>
                {deal.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Deal #{deal.deal_number} • {new Date(deal.deal_date).toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconReceipt size={20} />}
              onClick={() => navigate(`/erp/quotations/create?dealId=${id}`)}
              sx={{ borderRadius: 2 }}
            >
              Create Quotation
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconShoppingCart size={20} />}
              onClick={() => navigate(`/erp/purchase-orders/create?dealId=${id}`)}
              sx={{ borderRadius: 2 }}
            >
              Create Purchase Order
            </Button>
            <Button
              variant="contained"
              startIcon={<IconEdit size={20} />}
              onClick={() => navigate(`/erp/deals/edit/${id}`)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Edit Deal
            </Button>
          </Stack>
        </Stack>

        {/* Status Overview */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">Deal Status</Typography>
                <Box mt={1}>
                  <Chip 
                    label={deal.status?.replace('_', ' ').toUpperCase()} 
                    color={getStatusColor(deal.status)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                <Box mt={1}>
                  <Chip 
                    label={deal.payment_status?.replace('_', ' ').toUpperCase()} 
                    color={getPaymentStatusColor(deal.payment_status)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" mt={0.5}>
                  {deal.currency} {Number(deal.total).toFixed(2)}
                </Typography>
              </Box>
              {deal.payment_status === 'partial' && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main" mt={0.5}>
                      {deal.currency} {Number(deal.paid_amount).toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Deal Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Title" value={deal.title} />
            <InfoRow label="Description" value={deal.description} />
            <InfoRow label="Deal Date" value={new Date(deal.deal_date).toLocaleDateString()} />
            <InfoRow label="Deal Number" value={deal.deal_number} />
            {deal.images && deal.images.length > 0 && (
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Images</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {deal.images.map((img, idx) => (
                    <Box
                      key={img.id}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen((prev) => !prev);
                      }}
                      sx={{
                        display: 'block',
                        width: 120,
                        height: 120,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Box
                        component="img"
                        src={apiService.getUploadUrl(img.file_path)}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
                <FsLightbox
                  toggler={lightboxOpen}
                  sources={deal.images.map((img) => apiService.getUploadUrl(img.file_path))}
                  sourceIndex={lightboxIndex}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Deal Type & Logistics */}
        {(deal.deal_type || deal.container_type || deal.location_type || deal.wds_required || deal.inspection_required) && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Deal Type & Logistics
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <InfoRow label="Deal Type" value={deal.deal_type?.replace(/_/g, ' ')} />
                  <InfoRow label="Container Type" value={deal.container_type} />
                  <InfoRow label="Location Type" value={deal.location_type} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoRow label="WDS Required" value={deal.wds_required ? 'Yes' : 'No'} />
                  <InfoRow label="Inspection Required" value={deal.inspection_required ? 'Yes' : 'No'} />
                  {deal.deal_type === 'offer_to_charge' && (
                    <>
                      <InfoRow label="Custom Inspection" value={deal.custom_inspection ? 'Yes' : 'No'} />
                      <InfoRow label="Trakhees Inspection" value={deal.trakhees_inspection ? 'Yes' : 'No'} />
                      <InfoRow label="Dubai Municipality Inspection" value={deal.dubai_municipality_inspection ? 'Yes' : 'No'} />
                    </>
                  )}
                </Grid>
              </Grid>
              {deal.wds_required && deal.wdsDetails && (
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>WDS Details</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}><InfoRow label="Ref No" value={deal.wdsDetails.ref_no} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Date" value={deal.wdsDetails.date ? new Date(deal.wdsDetails.date).toLocaleDateString() : '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Company Name" value={deal.wdsDetails.company_name} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="License No" value={deal.wdsDetails.license_no} /></Grid>
                    <Grid item xs={12}><InfoRow label="Waste Description" value={deal.wdsDetails.waste_description} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Container No" value={deal.wdsDetails.container_no} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Source/Process" value={deal.wdsDetails.source_process} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Package Type" value={deal.wdsDetails.package_type} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Quantity per Package" value={deal.wdsDetails.quantity_per_package} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Total Weight" value={deal.wdsDetails.total_weight} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="BL No" value={deal.wdsDetails.bl_no} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="BOR No" value={deal.wdsDetails.bor_no} /></Grid>
                    <Grid item xs={12}><InfoRow label="Purpose" value={deal.wdsDetails.purpose} /></Grid>
                    {deal.wdsDetails.attachments && deal.wdsDetails.attachments.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {deal.wdsDetails.attachments.map((a, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              variant="outlined"
                              href={apiService.getUploadUrl(a.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<IconFileDescription size={16} />}
                            >
                              {a.file_name || a.file_path?.split('/').pop() || 'Attachment'}
                            </Button>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              {deal.inspection_required && deal.inspectionRequest && (
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>Inspection Request</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}><InfoRow label="Material Type" value={deal.inspectionRequest.materialType?.display_name || '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Location" value={deal.inspectionRequest.location || '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Location Type" value={deal.inspectionRequest.location_type ? (deal.inspectionRequest.location_type === 'mainland' ? 'Mainland' : 'Freezone') : '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Gate Pass Requirement" value={deal.inspectionRequest.gate_pass_requirement ? deal.inspectionRequest.gate_pass_requirement.charAt(0).toUpperCase() + deal.inspectionRequest.gate_pass_requirement.slice(1) : '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Service Type" value={deal.inspectionRequest.service_type || '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Quantity" value={deal.inspectionRequest.quantity || '-'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Safety Tools Required" value={deal.inspectionRequest.safety_tools_required ? 'Yes' : 'No'} /></Grid>
                    <Grid item xs={12} md={6}><InfoRow label="Requested By" value={deal.inspectionRequest.requestedByUser ? [deal.inspectionRequest.requestedByUser.first_name, deal.inspectionRequest.requestedByUser.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
                    <Grid item xs={12}>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={4} md={3}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Supporting Documents:
                          </Typography>
                        </Grid>
                        <Grid item xs={8} md={9}>
                          {deal.inspectionRequest.supporting_documents ? (
                            <Button
                              size="small"
                              startIcon={<IconDownload size={16} />}
                              href={apiService.getUploadUrl(deal.inspectionRequest.supporting_documents)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              sx={{ textTransform: 'none' }}
                            >
                              Download
                            </Button>
                          ) : (
                            <Typography variant="body2">-</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}><InfoRow label="Notes" value={deal.inspectionRequest.notes || '-'} /></Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inspection Report */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Inspection Report
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<IconPlus size={18} />}
                onClick={openReportDialog}
                sx={{ borderRadius: 2 }}
              >
                {deal.inspectionReport ? 'Edit Report' : 'Add Report'}
              </Button>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            {deal.inspectionReport ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}><InfoRow label="Inspection Date" value={deal.inspectionReport.inspection_datetime ? new Date(deal.inspectionReport.inspection_datetime).toLocaleString() : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Approx. Weight" value={deal.inspectionReport.approximate_weight != null ? `${deal.inspectionReport.approximate_weight} ${deal.inspectionReport.weight_uom || ''}` : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Cargo Type" value={deal.inspectionReport.cargo_type || '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Transportation" value={deal.inspectionReport.transportation_arrangement || '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Approx. Value" value={deal.inspectionReport.approximate_value != null ? deal.inspectionReport.approximate_value : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Inspector" value={deal.inspectionReport.inspector ? [deal.inspectionReport.inspector.first_name, deal.inspectionReport.inspector.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Approved By" value={deal.inspectionReport.approvedBy ? [deal.inspectionReport.approvedBy.first_name, deal.inspectionReport.approvedBy.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
                <Grid item xs={12}><InfoRow label="Notes" value={deal.inspectionReport.notes || '-'} /></Grid>
                {deal.inspectionReport.images && deal.inspectionReport.images.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {deal.inspectionReport.images.map((path, idx) => (
                        <Box
                          key={idx}
                          onClick={() => { setReportLightboxIndex(idx); setReportLightboxOpen((p) => !p); }}
                          component="img"
                          src={apiService.getUploadUrl(path)}
                          alt=""
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                    <FsLightbox
                      toggler={reportLightboxOpen}
                      sources={deal.inspectionReport.images.map((p) => apiService.getUploadUrl(p))}
                      sourceIndex={reportLightboxIndex}
                    />
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">No inspection report added yet.</Typography>
            )}
          </CardContent>
        </Card>

        {/* Related Entities */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Related Entities
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Source Lead" value={deal.lead?.lead_number || '-'} />
                <InfoRow label="Company (Client)" value={deal.company?.company_name || '-'} />
                <InfoRow label="Contact Person" value={deal.contact ? [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ') || '-' : '-'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Supplier" value={deal.supplier?.company_name || '-'} />
                <InfoRow label="Assigned To" value={deal.assignedUser ? [deal.assignedUser.first_name, deal.assignedUser.last_name].filter(Boolean).join(' ') || '-' : '-'} />
                <InfoRow label="Terms & Conditions" value={
                  (deal.termsList && deal.termsList.length > 0)
                    ? deal.termsList.map((t) => t.title).join(', ')
                    : (deal.termsAndConditions?.title || '-')
                } />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Related Quotations & Purchase Orders */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Related Quotations & Purchase Orders
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Quotations and purchase orders linked to this deal
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {relatedQuotations.length > 0 ? (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Quotations</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Prepared By</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedQuotations.map((q) => (
                          <TableRow key={q.id} hover>
                            <TableCell>{q.quotation_date ? new Date(q.quotation_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{q.currency || 'AED'} {Number(q.quotation_amount || 0).toFixed(2)}</TableCell>
                            <TableCell><Chip label={q.status || '-'} size="small" variant="outlined" /></TableCell>
                            <TableCell>{q.preparedByUser ? [q.preparedByUser.first_name, q.preparedByUser.last_name].filter(Boolean).join(' ') || '-' : '-'}</TableCell>
                            <TableCell align="right">
                              <Button size="small" onClick={() => navigate(`/erp/quotations/edit/${q.id}`)}>Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No quotations linked to this deal. Use &quot;Create Quotation&quot; above.</Typography>
            )}

            {relatedPOs.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Purchase Orders</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Expected Delivery</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedPOs.map((po) => (
                          <TableRow key={po.id} hover>
                            <TableCell>{po.po_date ? new Date(po.po_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{po.supplier?.company_name || '-'}</TableCell>
                            <TableCell>{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '-'}</TableCell>
                            <TableCell align="right">
                              <Button size="small" onClick={() => navigate(`/erp/purchase-orders/edit/${po.id}`)}>Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No purchase orders linked to this deal. Use &quot;Create Purchase Order&quot; above.</Typography>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Products & Services
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Items included in this deal
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {deal.items && deal.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Product/Service</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Line Total</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deal.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.productService?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.productService?.category || '-'} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{Number(item.quantity).toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {deal.currency} {Number(item.unit_price).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {deal.currency} {Number(item.line_total).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {item.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>No items in this deal</Typography>
              </Box>
            )}

            {/* Totals */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 400 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {deal.currency} {Number(deal.subtotal).toFixed(2)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1">VAT ({Number(deal.vat_percentage).toFixed(1)}%):</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {deal.currency} {Number(deal.vat_amount).toFixed(2)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h5" fontWeight={700}>Total:</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {deal.currency} {Number(deal.total).toFixed(2)}
                    </Typography>
                  </Stack>
                  {deal.payment_status !== 'unpaid' && (
                    <>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body1" color="success.main">Amount Paid:</Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          {deal.currency} {Number(deal.paid_amount).toFixed(2)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body1" color="error.main">Balance Due:</Typography>
                        <Typography variant="body1" fontWeight={600} color="error.main">
                          {deal.currency} {(Number(deal.total) - Number(deal.paid_amount)).toFixed(2)}
                        </Typography>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {deal.notes && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Notes
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {deal.notes}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Audit Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Created" value={new Date(deal.created_at).toLocaleString()} />
            <InfoRow label="Last Updated" value={new Date(deal.updated_at).toLocaleString()} />
          </CardContent>
        </Card>

        {/* Inspection Report Dialog */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Inspection Report</DialogTitle>
          <DialogContent>
            {Object.keys(reportFormErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {Object.values(reportFormErrors)[0]}
              </Alert>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <DateTimePicker
                  label="Inspection Date & Time (Required)"
                  value={reportForm.inspectionDatetime}
                  onChange={(v) => setReportForm((f) => ({ ...f, inspectionDatetime: v }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: Boolean(reportFormErrors.inspectionDatetime),
                      helperText: reportFormErrors.inspectionDatetime,
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                    },
                  }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                  <TextField
                    label="Approximate Weight (Required)"
                    type="number"
                    value={reportForm.approximateWeight}
                    onChange={(e) => setReportForm((f) => ({ ...f, approximateWeight: e.target.value }))}
                    required
                    error={Boolean(reportFormErrors.approximateWeight)}
                    helperText={reportFormErrors.approximateWeight}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    select
                    label="UOM"
                    value={reportForm.weightUom}
                    onChange={(e) => setReportForm((f) => ({ ...f, weightUom: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="tons">tons</MenuItem>
                    <MenuItem value="lbs">lbs</MenuItem>
                  </TextField>
                </Box>
                <TextField
                  select
                  fullWidth
                  label="Cargo Type (Required)"
                  value={reportForm.cargoType}
                  onChange={(e) => setReportForm((f) => ({ ...f, cargoType: e.target.value }))}
                  required
                  error={Boolean(reportFormErrors.cargoType)}
                  helperText={reportFormErrors.cargoType}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="unpacked">Unpacked</MenuItem>
                  <MenuItem value="packed">Packed</MenuItem>
                  <MenuItem value="palletized">Palletized</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Transportation Arrangement (Required)"
                  value={reportForm.transportationArrangement}
                  onChange={(e) => setReportForm((f) => ({ ...f, transportationArrangement: e.target.value }))}
                  required
                  error={Boolean(reportFormErrors.transportationArrangement)}
                  helperText={reportFormErrors.transportationArrangement}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="1 ton">1 ton</MenuItem>
                  <MenuItem value="3 ton">3 ton</MenuItem>
                  <MenuItem value="10 ton">10 ton</MenuItem>
                  <MenuItem value="trailer">Trailer</MenuItem>
                  <MenuItem value="reefer">Reefer</MenuItem>
                  <MenuItem value="lowbed trailer">Lowbed Trailer</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  label="Approximate Value (Required)"
                  type="number"
                  value={reportForm.approximateValue}
                  onChange={(e) => setReportForm((f) => ({ ...f, approximateValue: e.target.value }))}
                  required
                  error={Boolean(reportFormErrors.approximateValue)}
                  helperText={reportFormErrors.approximateValue}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Images (Required) - at least one</Typography>
                  {reportFormErrors.images && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{reportFormErrors.images}</Typography>
                  )}
                  <ReportImageDropzone
                    onDrop={async (files) => {
                      for (const file of files) {
                        try {
                          const res = await apiService.uploadDealImage(file);
                          if (res.success && res.data?.path) {
                            setReportForm((f) => ({
                              ...f,
                              images: [...f.images, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }],
                            }));
                          }
                        } catch (err) {
                          setError(err.message || 'Upload failed');
                        }
                      }
                    }}
                  />
                  {reportForm.images.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {reportForm.images.map((img, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                          <Box component="img" src={img.url} alt="" sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                          <Button
                            size="small"
                            onClick={() => setReportForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                            sx={{ position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, p: 0 }}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <Autocomplete
                  options={users}
                  getOptionLabel={(o) => `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || ''}
                  value={users.find((u) => u.id === reportForm.inspectorId) || null}
                  onChange={(_, v) => setReportForm((f) => ({ ...f, inspectorId: v?.id || null }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Inspector's Name (Required)"
                      required
                      error={Boolean(reportFormErrors.inspectorId)}
                      helperText={reportFormErrors.inspectorId}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                />
                <Autocomplete
                  options={users}
                  getOptionLabel={(o) => `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || ''}
                  value={users.find((u) => u.id === reportForm.approvedById) || null}
                  onChange={(_, v) => setReportForm((f) => ({ ...f, approvedById: v?.id || null }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Approved By (Required)"
                      required
                      error={Boolean(reportFormErrors.approvedById)}
                      helperText={reportFormErrors.approvedById}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={reportForm.notes}
                  onChange={(e) => setReportForm((f) => ({ ...f, notes: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveReport} disabled={reportSaving}>
              {reportSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default DealView;
