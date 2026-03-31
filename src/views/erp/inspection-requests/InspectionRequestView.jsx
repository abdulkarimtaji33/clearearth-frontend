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
import { IconArrowLeft, IconPlus, IconPhoto, IconFileReport } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import InspectionReportDialog from '../../../components/erp/InspectionReportDialog';
import apiService from '../../../services/api';

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

const InspectionRequestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [reportLightboxOpen, setReportLightboxOpen] = useState(false);
  const [reportLightboxIndex, setReportLightboxIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState(false);
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

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getInspectionRequest(id);
      if (res.success) setRequest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load inspection request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiService.getInspectors();
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setUsers(list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const openReportDialog = () => {
    setReportFormErrors({});
    setError('');
    const r = request?.deal?.inspectionReport;
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
    if (!reportForm.images?.length) errs.images = 'At least one image is required';
    setReportFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setReportFormErrors({});
      setReportSaving(true);
      await apiService.saveInspectionReport(request.deal_id, {
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
      fetchRequest();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setReportSaving(false);
    }
  };

  if (!id) {
    return (
      <PageContainer title="Invalid Request">
        <Box><Alert severity="error">Invalid inspection request ID</Alert></Box>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !request) {
    return (
      <PageContainer>
        <Box>
          <Alert severity="error">{error || 'Inspection request not found'}</Alert>
          <Button variant="outlined" onClick={() => navigate('/erp/inspection-requests')} sx={{ mt: 2 }}>Back to List</Button>
        </Box>
      </PageContainer>
    );
  }

  const deal = request.deal;
  const report = deal?.inspectionReport;

  return (
    <PageContainer title={`Inspection Request #${request.id}`} description="View request and add inspection report">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/inspection-requests')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Inspection Request – {deal?.title || deal?.deal_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deal #{deal?.deal_number}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" fontWeight={600} mb={2}>Request Details</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><InfoRow label="Deal" value={deal?.title} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Client" value={deal?.company?.company_name || deal?.supplier?.company_name} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Material Type" value={request.materialType?.display_name} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Quantity" value={request.quantity_uom ? `${request.quantity} ${request.quantity_uom}` : request.quantity} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Safety Tools" value={(() => { const st = request.safety_tools; if (!st) return '-'; try { const arr = typeof st === 'string' ? JSON.parse(st) : (Array.isArray(st) ? st : []); const labels = { safety_jacket: 'Safety Jacket', safety_shoes: 'Safety Shoes', safety_coverall: 'Safety Coverall', safety_helmet: 'Safety Helmet', safety_tools_required: 'Safety Tools Required', safety_mask: 'Safety Mask', safety_goggles: 'Safety Goggles', safety_gloves: 'Safety Gloves' }; return arr.map((v) => labels[v] || v).join(', ') || '-'; } catch { return '-'; } })()} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Location" value={request.location} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Service Type" value={request.service_type} /></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Requested By" value={request.requestedByUser ? [request.requestedByUser.first_name, request.requestedByUser.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
              <Grid item xs={12}><InfoRow label="Notes" value={request.notes} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={600}>Inspection Report</Typography>
              <Stack direction="row" spacing={1}>
                {report && (
                  <Button variant="outlined" size="small" startIcon={<IconFileReport size={16} />} onClick={() => setReportViewOpen(true)} sx={{ borderRadius: 2 }}>
                    View Report
                  </Button>
                )}
                <Button variant="contained" size="small" startIcon={<IconPlus size={18} />} onClick={openReportDialog} sx={{ borderRadius: 2 }}>
                  {report ? 'Edit Report' : 'Add Report'}
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            {report ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}><InfoRow label="Inspection Date" value={report.inspection_datetime ? new Date(report.inspection_datetime).toLocaleString() : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Approx. Weight" value={report.approximate_weight != null ? `${report.approximate_weight} ${report.weight_uom || ''}` : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Cargo Type" value={report.cargo_type} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Transportation" value={report.transportation_arrangement} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Inspector" value={report.inspector ? [report.inspector.first_name, report.inspector.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
                <Grid item xs={12} md={6}><InfoRow label="Approved By" value={report.approvedBy ? [report.approvedBy.first_name, report.approvedBy.last_name].filter(Boolean).join(' ') || '-' : '-'} /></Grid>
                {report.images && report.images.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {report.images.map((path, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={apiService.getUploadUrl(path)}
                          alt=""
                          onClick={() => { setReportLightboxIndex(idx); setReportLightboxOpen((p) => !p); }}
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                    <FsLightbox toggler={reportLightboxOpen} sources={report.images.map((p) => apiService.getUploadUrl(p))} sourceIndex={reportLightboxIndex} />
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">No inspection report added yet. Click &quot;Add Report&quot; to submit.</Typography>
            )}
          </CardContent>
        </Card>

        <InspectionReportDialog
          open={reportViewOpen}
          onClose={() => setReportViewOpen(false)}
          request={request}
        />

        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Inspection Report</DialogTitle>
          <DialogContent>
            {Object.keys(reportFormErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>{Object.values(reportFormErrors)[0]}</Alert>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 4 }}>
                <DateTimePicker
                  label="Inspection Date & Time (Required)"
                  value={reportForm.inspectionDatetime}
                  onChange={(v) => setReportForm((f) => ({ ...f, inspectionDatetime: v }))}
                  slotProps={{ textField: { fullWidth: true, required: true, error: Boolean(reportFormErrors.inspectionDatetime), helperText: reportFormErrors.inspectionDatetime, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                  <TextField label="Approximate Weight (Required)" type="number" value={reportForm.approximateWeight} onChange={(e) => setReportForm((f) => ({ ...f, approximateWeight: e.target.value }))} required error={Boolean(reportFormErrors.approximateWeight)} helperText={reportFormErrors.approximateWeight} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  <TextField select label="UOM" value={reportForm.weightUom} onChange={(e) => setReportForm((f) => ({ ...f, weightUom: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="tons">tons</MenuItem>
                    <MenuItem value="lbs">lbs</MenuItem>
                  </TextField>
                </Box>
                <TextField select fullWidth label="Cargo Type (Required)" value={reportForm.cargoType} onChange={(e) => setReportForm((f) => ({ ...f, cargoType: e.target.value }))} required error={Boolean(reportFormErrors.cargoType)} helperText={reportFormErrors.cargoType} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
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
                <TextField fullWidth label="Approximate Value (Required)" type="number" value={reportForm.approximateValue} onChange={(e) => setReportForm((f) => ({ ...f, approximateValue: e.target.value }))} required error={Boolean(reportFormErrors.approximateValue)} helperText={reportFormErrors.approximateValue} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Images (Required)</Typography>
                  {reportFormErrors.images && <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{reportFormErrors.images}</Typography>}
                  <ReportImageDropzone
                    onDrop={async (files) => {
                      for (const file of files) {
                        try {
                          const res = await apiService.uploadDealImage(file);
                          if (res.success && res.data?.path) setReportForm((f) => ({ ...f, images: [...f.images, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }] }));
                        } catch (err) { setError(err.message || 'Upload failed'); }
                      }
                    }}
                  />
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
                <Autocomplete
                  options={users}
                  getOptionLabel={(o) => `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || ''}
                  value={users.find((u) => u.id === reportForm.inspectorId) || null}
                  onChange={(_, v) => setReportForm((f) => ({ ...f, inspectorId: v?.id || null }))}
                  renderInput={(params) => <TextField {...params} label="Inspector (Required)" required error={Boolean(reportFormErrors.inspectorId)} helperText={reportFormErrors.inspectorId} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                />
                <Autocomplete
                  options={users}
                  getOptionLabel={(o) => `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || ''}
                  value={users.find((u) => u.id === reportForm.approvedById) || null}
                  onChange={(_, v) => setReportForm((f) => ({ ...f, approvedById: v?.id || null }))}
                  renderInput={(params) => <TextField {...params} label="Approved By (Optional)" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                />
                <TextField fullWidth multiline rows={3} label="Notes" value={reportForm.notes} onChange={(e) => setReportForm((f) => ({ ...f, notes: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveReport} disabled={reportSaving}>{reportSaving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default InspectionRequestView;
