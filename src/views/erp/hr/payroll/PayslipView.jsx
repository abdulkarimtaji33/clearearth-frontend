import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Grid, Divider, Alert, CircularProgress, Button, Chip, Stack } from '@mui/material';
import { IconDownload, IconArrowLeft, IconReceipt2 } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const Row = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.75}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value}</Typography>
  </Box>
);

const PayslipView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getHrPayslip(id);
      if (res.success) setPayslip(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load payslip');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const download = async () => {
    setDownloading(true);
    try { await apiService.downloadHrPayslipPdf(id); } catch (err) { setError(err.message || 'Download failed'); } finally { setDownloading(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;
  if (error && !payslip) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!payslip) return null;

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <PageContainer title="Payslip" description="Payslip breakdown">
      <Box sx={{ maxWidth: 780, width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button variant="outlined" startIcon={<IconArrowLeft size={20} />} onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>
            Back
          </Button>
          <Box>
            <Typography variant="h3" fontWeight={700}>Payslip</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Salary breakdown for the period</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <IconReceipt2 size={22} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>{payslip.employee?.first_name} {payslip.employee?.last_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{payslip.employee?.employee_code}</Typography>
                </Box>
              </Stack>
              <Chip label={payslip.payment_status} color={payslip.payment_status === 'paid' ? 'success' : 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
            </Stack>
            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Earnings</Typography>
                <Row label="Basic Salary" value={fmt(payslip.basic_salary)} />
                <Row label="Housing Allowance" value={fmt(payslip.housing_allowance)} />
                <Row label="Transport Allowance" value={fmt(payslip.transport_allowance)} />
                <Row label="Other Allowance" value={fmt(payslip.other_allowance)} />
                <Row label="Commission" value={fmt(payslip.commission_amount)} />
                <Divider sx={{ my: 1 }} />
                <Row label="Gross Salary" value={fmt(payslip.gross_salary)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Deductions</Typography>
                <Row label="Absent Days" value={payslip.absent_days} />
                <Row label="Unpaid Leave Days" value={payslip.unpaid_leave_days} />
                <Row label="Proration Deduction" value={fmt(payslip.proration_deduction)} />
                <Row label="Other Deductions" value={fmt(payslip.other_deductions)} />
                <Divider sx={{ my: 1 }} />
                <Row label="Total Deductions" value={fmt(payslip.total_deductions)} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={800}>Net Salary</Typography>
              <Typography variant="h5" fontWeight={800}>AED {fmt(payslip.net_salary)}</Typography>
            </Box>
            <Button
              startIcon={<IconDownload size={18} />}
              sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
              variant="outlined"
              disabled={downloading}
              onClick={download}
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default PayslipView;
