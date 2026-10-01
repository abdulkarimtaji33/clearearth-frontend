import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Alert, CircularProgress, Chip, TextField, Checkbox,
  FormControlLabel, Divider, Link, Grid,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconCheck, IconFileDownload } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole } from '../../../utils/authHelpers';

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

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getCertificateRequest(id);
      if (res.success) {
        setRequest(res.data);
        const alreadyGenerated = new Set((res.data.certificates || []).map((c) => c.type));
        setSelectedTypes((res.data.types || []).map((t) => t.type).filter((t) => !alreadyGenerated.has(t)));
      } else setError(res.message || 'Not found');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

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
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Request Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact Person</Typography><Typography variant="body2" fontWeight={600}>{request.contact_person}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact No.</Typography><Typography variant="body2" fontWeight={600}>{request.contact_no}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Contact Email</Typography><Typography variant="body2" fontWeight={600}>{request.contact_email}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Collection Date</Typography><Typography variant="body2" fontWeight={600}>{request.collection_date?.slice?.(0, 10)}</Typography></Grid>
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
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Total Weight / Quantity</Typography><Typography variant="body2" fontWeight={600}>{request.total_weight_quantity} tons</Typography></Grid>
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Material / Waste Details</Typography><Typography variant="body2" fontWeight={600}>{request.material_waste_details}</Typography></Grid>
          {request.additional_notes && (
            <Grid item xs={12}><Typography variant="caption" color="text.secondary">Additional Notes</Typography><Typography variant="body2">{request.additional_notes}</Typography></Grid>
          )}
        </Grid>
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
