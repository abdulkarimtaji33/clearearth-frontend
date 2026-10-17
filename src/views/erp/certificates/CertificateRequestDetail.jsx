import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Alert, CircularProgress, Chip, TextField, Checkbox,
  FormControlLabel, Divider, Link, Grid, Autocomplete,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconCheck, IconFileDownload, IconPhoto, IconEdit, IconX } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole } from '../../../utils/authHelpers';
import UomSelectField from '../../../components/erp/UomSelectField';
import useUnitsOfMeasure from '../../../hooks/useUnitsOfMeasure';

const STATUS_COLOR = { pending_verification: 'default', verified: 'info', generated: 'warning', issued: 'success' };
const STATUS_LABEL = { pending_verification: 'Pending Verification', verified: 'Verified', generated: 'Generated', issued: 'Issued' };
const VERIFIER_ROLES = ['hr_manager', 'admin', 'tenant_admin', 'super_admin'];
const TYPE_LABEL = {
  green_certificate: 'Green Certificate',
  certificate_of_destruction: 'Certificate of Destruction',
  certificate_of_data_destruction: 'Certificate of Data Destruction',
  carbon_footprint: 'Carbon Footprint Certificate',
  destruction_report_evidence: 'Destruction Report with Evidence',
};

const CertificateRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const roleName = getUserRole(user);
  const canVerify = VERIFIER_ROLES.includes(roleName);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [taskEvidence, setTaskEvidence] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [attachingId, setAttachingId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [grns, setGrns] = useState([]);
  const { unitsOfMeasure: catalogUnits } = useUnitsOfMeasure();
  const [unitsOfMeasure, setUnitsOfMeasure] = useState([]);
  const canEdit = canVerify && request?.status !== 'issued';

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getCertificateRequest(id);
      if (res.success) {
        setRequest(res.data);
        const alreadyGenerated = new Set((res.data.certificates || []).map((c) => c.type));
        setSelectedTypes((res.data.types || []).map((t) => t.type).filter((t) => !alreadyGenerated.has(t)));
        loadTaskEvidence();
      } else setError(res.message || 'Not found');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskEvidence = async () => {
    try {
      setEvidenceLoading(true);
      const res = await apiService.getCertificateRequestTaskEvidence(id);
      setTaskEvidence(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // non-blocking — certificate generation doesn't depend on this
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    setUnitsOfMeasure(catalogUnits);
  }, [catalogUnits]);

  const startEdit = () => {
    setEditForm({
      companyName: request.company_name || '',
      contactPerson: request.contact_person || '',
      contactNo: request.contact_no || '',
      contactEmail: request.contact_email || '',
      collectionDate: request.collection_date ? request.collection_date.slice(0, 10) : '',
      collectionDateTo: request.collection_date_to ? request.collection_date_to.slice(0, 10) : '',
      grnId: request.grn_id || '',
      grnNo: request.grn_no || '',
      materialWasteDetails: request.material_waste_details || '',
      totalWeightQuantity: request.total_weight_quantity ?? '',
      uom: request.uom || '',
      invoiceNo: request.invoice_no || '',
      additionalNotes: request.additional_notes || '',
    });
    setEditing(true);
    if (request.deal_id) {
      apiService.getGrns({ dealId: request.deal_id, pageSize: 100 }).then((res) => {
        if (res?.success) setGrns(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
  };

  const setEditField = (field) => (e) => setEditForm((p) => ({ ...p, [field]: e.target.value }));

  const saveEdit = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await apiService.updateCertificateRequest(id, {
        companyName: editForm.companyName.trim(),
        contactPerson: editForm.contactPerson.trim(),
        contactNo: editForm.contactNo.trim(),
        contactEmail: editForm.contactEmail.trim(),
        collectionDate: editForm.collectionDate,
        collectionDateTo: editForm.collectionDateTo || null,
        grnId: editForm.grnId || null,
        grnNo: !editForm.grnId ? (editForm.grnNo || null) : null,
        materialWasteDetails: editForm.materialWasteDetails.trim(),
        totalWeightQuantity: parseFloat(editForm.totalWeightQuantity) || 0,
        uom: editForm.uom || null,
        invoiceNo: editForm.invoiceNo || null,
        additionalNotes: editForm.additionalNotes || null,
      });
      if (res.success) {
        setRequest(res.data);
        setEditing(false);
        setEditForm(null);
      } else {
        setError(res.message || 'Failed to save changes');
      }
    } catch (e) {
      setError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    try {
      setVerifying(true);
      setError('');
      const res = await apiService.verifyCertificateRequest(id, { verificationNotes: notes });
      if (res.success) setRequest(res.data);
      else setError(res.message || 'Verification failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const generate = async () => {
    try {
      setGenerating(true);
      setError('');
      const res = await apiService.generateCertificates(id, selectedTypes);
      if (res.success) setRequest(res.data);
      else setError(res.message || 'Generation failed');
    } catch (e) {
      setError(e.message || 'Certificate generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const attachEvidence = async (evidence) => {
    try {
      setAttachingId(evidence.id);
      setError('');
      const res = await apiService.linkWorkOrderTaskFileToCertificate(evidence.workOrderId, evidence.taskId, evidence.id, id);
      if (res.success) {
        await load();
      } else {
        setError(res.message || 'Failed to attach evidence');
      }
    } catch (e) {
      setError(e.message || 'Failed to attach evidence');
    } finally {
      setAttachingId(null);
    }
  };

  const downloadPdf = async (certId, certNo) => {
    try {
      setDownloadingId(certId);
      await apiService.downloadCertificatePdf(certId, certNo);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <PageContainer title="Certificate Request"><Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box></PageContainer>;
  }
  if (!request) {
    return <PageContainer title="Certificate Request"><Alert severity="error">{error || 'Not found'}</Alert></PageContainer>;
  }

  const grnBlocked = request.grn_id && request.grn && request.grn.status !== 'approved';

  return (
    <PageContainer title="Certificate Request" description={request.company_name}>
      <Button variant="outlined" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2.5, borderRadius: 2 }}>Back</Button>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCertificate size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>{request.company_name}</Typography>
            <Chip size="small" label={STATUS_LABEL[request.status] || request.status} color={STATUS_COLOR[request.status] || 'default'} sx={{ mt: 0.5, fontWeight: 700 }} />
          </Box>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}
      {grnBlocked && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Certificate generation is blocked: the linked GRN ({request.grn?.grn_number}) has not been approved yet.
          Ask operations to approve the GRN before generating certificates.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>Request Details</Typography>
          {canEdit && !editing && (
            <Button size="small" startIcon={<IconEdit size={14} />} onClick={startEdit} sx={{ borderRadius: 2 }}>
              Edit
            </Button>
          )}
          {editing && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<IconX size={14} />} onClick={cancelEdit} disabled={saving} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button size="small" variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={14} />} onClick={saveEdit} disabled={saving} sx={{ borderRadius: 2 }}>
                Save
              </Button>
            </Stack>
          )}
        </Stack>

        {editing ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Company Name" value={editForm.companyName} onChange={setEditField('companyName')} />
              <TextField fullWidth label="Contact Person" value={editForm.contactPerson} onChange={setEditField('contactPerson')} />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Contact No." value={editForm.contactNo} onChange={setEditField('contactNo')} />
              <TextField fullWidth type="email" label="Contact Email" value={editForm.contactEmail} onChange={setEditField('contactEmail')} />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Collection Date (From)"
                  value={editForm.collectionDate ? dayjs(editForm.collectionDate) : null}
                  onChange={(val) => setEditForm((p) => ({ ...p, collectionDate: val && val.isValid() ? val.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Collection Date (To)"
                  value={editForm.collectionDateTo ? dayjs(editForm.collectionDateTo) : null}
                  onChange={(val) => setEditForm((p) => ({ ...p, collectionDateTo: val && val.isValid() ? val.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <Autocomplete
                fullWidth
                freeSolo
                options={grns}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.grn_number || '')}
                value={grns.find((g) => g.id === editForm.grnId) || editForm.grnNo || null}
                onChange={(_, val) => {
                  if (val && typeof val === 'object') setEditForm((p) => ({ ...p, grnId: val.id, grnNo: val.grn_number }));
                  else setEditForm((p) => ({ ...p, grnId: '', grnNo: val || '' }));
                }}
                onInputChange={(_, val, reason) => {
                  if (reason === 'input') setEditForm((p) => ({ ...p, grnId: '', grnNo: val }));
                }}
                renderInput={(params) => <TextField {...params} label="GRN No." />}
              />
            </Stack>
            <TextField fullWidth multiline rows={2} label="Material / Waste Details" value={editForm.materialWasteDetails} onChange={setEditField('materialWasteDetails')} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth type="number" label="Quantity" value={editForm.totalWeightQuantity} onChange={setEditField('totalWeightQuantity')} inputProps={{ min: 0, step: 'any' }} />
              <UomSelectField
                fullWidth
                label="UoM"
                value={editForm.uom}
                onChange={(v) => setEditForm((p) => ({ ...p, uom: v }))}
                unitsOfMeasure={unitsOfMeasure}
                onUnitsChange={setUnitsOfMeasure}
              />
              <TextField fullWidth label="Invoice No." value={editForm.invoiceNo} onChange={setEditField('invoiceNo')} />
            </Stack>
            <TextField fullWidth multiline rows={2} label="Additional Notes" value={editForm.additionalNotes} onChange={setEditField('additionalNotes')} />
          </Stack>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Deal</Typography>
              <Typography variant="body2" fontWeight={600}>
                {request.deal ? (
                  <Link component="button" onClick={() => navigate(`/erp/deals/view/${request.deal.id}`)}>
                    {request.deal.deal_number || `Deal #${request.deal.id}`}{request.deal.title ? ` — ${request.deal.title}` : ''}
                  </Link>
                ) : '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Work Order</Typography>
              <Typography variant="body2" fontWeight={600}>
                {request.grn?.work_order_id ? (
                  <Link component="button" onClick={() => navigate(`/erp/work-orders/view/${request.grn.work_order_id}`)}>
                    Work Order #{request.grn.work_order_id}
                  </Link>
                ) : '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact Person</Typography><Typography variant="body2" fontWeight={600}>{request.contact_person}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact No.</Typography><Typography variant="body2" fontWeight={600}>{request.contact_no}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact Email</Typography><Typography variant="body2" fontWeight={600}>{request.contact_email}</Typography></Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Collection Date</Typography>
              <Typography variant="body2" fontWeight={600}>
                {request.collection_date?.slice?.(0, 10)}
                {request.collection_date_to && request.collection_date_to.slice(0, 10) !== request.collection_date?.slice?.(0, 10)
                  ? ` – ${request.collection_date_to.slice(0, 10)}`
                  : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">GRN</Typography>
              <Typography variant="body2" fontWeight={600}>
                {request.grn ? (
                  <Link component="button" onClick={() => navigate(`/erp/grn/view/${request.grn.id}`)}>
                    {request.grn.grn_number} ({request.grn.status})
                  </Link>
                ) : (request.grn_no || '—')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Total Weight / Quantity</Typography><Typography variant="body2" fontWeight={600}>{request.total_weight_quantity} {request.uom || 'tons'}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Invoice No.</Typography><Typography variant="body2" fontWeight={600}>{request.invoice_no || '—'}</Typography></Grid>
            <Grid item xs={12}><Typography variant="caption" color="text.secondary">Material / Waste Details</Typography><Typography variant="body2" fontWeight={600}>{request.material_waste_details}</Typography></Grid>
            {request.additional_notes && (
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Additional Notes</Typography><Typography variant="body2">{request.additional_notes}</Typography></Grid>
            )}
          </Grid>
        )}
      </Paper>

      {request.attachments?.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Attachments</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {request.attachments.map((a) => (
              <Chip
                key={a.id}
                label={`${a.file_type}${a.photo_stage ? ` (${a.photo_stage})` : ''} — ${a.file_name || a.file_path}`}
                component="a"
                href={apiService.getUploadUrl(a.file_path)}
                target="_blank"
                clickable
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      )}

      {(evidenceLoading || taskEvidence.length > 0) && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={0.5}>Work Task Evidence</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Photos uploaded against this deal's work order tasks. Attach any that should be included as destruction evidence on this certificate request.
          </Typography>
          {evidenceLoading ? (
            <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {taskEvidence.map((ev) => {
                const alreadyAttached = (request.attachments || []).some((a) => a.source_task_file_id === ev.id);
                return (
                  <Box
                    key={ev.id}
                    sx={{ width: 140, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                  >
                    <Box
                      component="a"
                      href={ev.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'block' }}
                    >
                      <Box
                        component="img"
                        src={ev.imageUrl}
                        alt={ev.originalName || 'Evidence'}
                        sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" title={ev.taskName}>
                        {ev.taskName}
                      </Typography>
                      {alreadyAttached ? (
                        <Chip size="small" icon={<IconCheck size={14} />} label="Attached" color="success" sx={{ mt: 0.5, fontWeight: 600 }} />
                      ) : canVerify ? (
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          startIcon={attachingId === ev.id ? <CircularProgress size={12} /> : <IconPhoto size={14} />}
                          disabled={attachingId === ev.id}
                          onClick={() => attachEvidence(ev)}
                          sx={{ mt: 0.5, borderRadius: 1.5, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          Attach as evidence
                        </Button>
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      )}

      {canVerify && request.status === 'pending_verification' && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: alpha(theme.palette.info.main, 0.4) }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>HR Verification</Typography>
          <TextField fullWidth multiline rows={2} label="Verification notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />
          <Button variant="contained" startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={16} />} disabled={verifying} onClick={verify} sx={{ borderRadius: 2.5 }}>
            {verifying ? 'Verifying…' : 'Mark Verified'}
          </Button>
        </Paper>
      )}

      {canVerify && (request.status === 'verified' || request.status === 'generated') && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: alpha(theme.palette.success.main, 0.4) }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Generate Certificate(s)</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
            {(request.types || []).map((t) => (
              <FormControlLabel
                key={t.id}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(t.type)}
                    onChange={() => setSelectedTypes((p) => p.includes(t.type) ? p.filter((x) => x !== t.type) : [...p, t.type])}
                  />
                }
                label={TYPE_LABEL[t.type] || t.type}
              />
            ))}
          </Stack>
          <Button
            variant="contained" color="success" disabled={generating || grnBlocked || !selectedTypes.length}
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : null}
            onClick={generate} sx={{ borderRadius: 2.5 }}
          >
            {generating ? 'Generating…' : 'Generate Certificate(s)'}
          </Button>
        </Paper>
      )}

      {request.certificates?.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Generated Certificates</Typography>
          <Stack spacing={1}>
            {request.certificates.map((c) => (
              <Stack key={c.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{TYPE_LABEL[c.type] || c.type}</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary">{c.certificate_number}</Typography>
                </Box>
                <Button size="small" startIcon={downloadingId === c.id ? <CircularProgress size={14} /> : <IconFileDownload size={16} />} onClick={() => downloadPdf(c.id, c.certificate_number)} disabled={downloadingId === c.id}>
                  Download
                </Button>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </PageContainer>
  );
};

export default CertificateRequestDetail;
