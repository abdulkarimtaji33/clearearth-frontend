import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Paper, Alert, CircularProgress, Chip, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconFileDownload } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const TYPE_LABEL = {
  green_certificate: 'Green Certificate',
  certificate_of_destruction: 'Certificate of Destruction',
  certificate_of_data_destruction: 'Certificate of Data Destruction',
  carbon_footprint: 'Carbon Footprint Certificate',
  destruction_report_evidence: 'Destruction Report with Evidence',
};

const CertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.getCertificate(id);
        if (res.success) setCert(res.data);
        else setError(res.message || 'Not found');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const download = async () => {
    try {
      setDownloading(true);
      await apiService.downloadCertificatePdf(id, cert?.certificate_number);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <PageContainer title="Certificate"><Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box></PageContainer>;
  }
  if (!cert) {
    return <PageContainer title="Certificate"><Alert severity="error">{error || 'Not found'}</Alert></PageContainer>;
  }

  const req = cert.request || {};

  return (
    <PageContainer title={cert.certificate_number} description={TYPE_LABEL[cert.type] || cert.type}>
      <Button startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2.5, borderRadius: 2 }}>Back</Button>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCertificate size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} fontFamily="monospace">{cert.certificate_number}</Typography>
            <Chip size="small" label={TYPE_LABEL[cert.type] || cert.type} sx={{ mt: 0.5, fontWeight: 700 }} />
          </Box>
        </Stack>
        <Button variant="contained" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <IconFileDownload size={16} />} onClick={download} disabled={downloading} sx={{ borderRadius: 2.5 }}>
          Download PDF
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Certificate Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Company</Typography><Typography variant="body2" fontWeight={600}>{req.company_name}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Issued Date</Typography><Typography variant="body2" fontWeight={600}>{cert.issued_date?.slice?.(0, 10)}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Quantity</Typography><Typography variant="body2" fontWeight={600}>{req.total_weight_quantity} tons</Typography></Grid>
          {cert.type === 'carbon_footprint' && (
            <>
              <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">CO2 Saved</Typography><Typography variant="body2" fontWeight={600}>{cert.co2_saved} Nos</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Liters Saved</Typography><Typography variant="body2" fontWeight={600}>{cert.liters_saved} Liters</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Kg Saved</Typography><Typography variant="body2" fontWeight={600}>{cert.kg_saved} Kgs</Typography></Grid>
            </>
          )}
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Material / Waste Details</Typography><Typography variant="body2" fontWeight={600}>{req.material_waste_details}</Typography></Grid>
        </Grid>
      </Paper>

      {cert.items?.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Line Items</Typography>
          <Stack spacing={1}>
            {cert.items.map((it) => (
              <Stack key={it.id} direction="row" justifyContent="space-between" sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">{it.sl_no}. {it.description}</Typography>
                <Typography variant="body2">{it.qty} {it.unit}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </PageContainer>
  );
};

export default CertificateDetail;
