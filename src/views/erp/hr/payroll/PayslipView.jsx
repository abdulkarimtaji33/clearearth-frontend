import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Grid, Divider, Alert, CircularProgress, Button, Chip } from '@mui/material';
import { IconDownload } from '@tabler/icons-react';
import { useParams } from 'react-router';
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
  if (error && !payslip) return <Alert severity="error">{error}</Alert>;
  if (!payslip) return null;

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <PageContainer title="Payslip" description="Payslip breakdown">
      <Card sx={{ p: 3, maxWidth: 640 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{payslip.employee?.first_name} {payslip.employee?.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">{payslip.employee?.employee_code}</Typography>
          </Box>
          <Chip label={payslip.payment_status} color={payslip.payment_status === 'paid' ? 'success' : 'default'} />
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Earnings</Typography>
            <Row label="Basic Salary" value={fmt(payslip.basic_salary)} />
            <Row label="Housing Allowance" value={fmt(payslip.housing_allowance)} />
            <Row label="Transport Allowance" value={fmt(payslip.transport_allowance)} />
            <Row label="Other Allowance" value={fmt(payslip.other_allowance)} />
            <Row label="Commission" value={fmt(payslip.commission_amount)} />
            <Divider sx={{ my: 1 }} />
            <Row label="Gross Salary" value={fmt(payslip.gross_salary)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Deductions</Typography>
            <Row label="Absent Days" value={payslip.absent_days} />
            <Row label="Unpaid Leave Days" value={payslip.unpaid_leave_days} />
            <Row label="Proration Deduction" value={fmt(payslip.proration_deduction)} />
            <Row label="Other Deductions" value={fmt(payslip.other_deductions)} />
            <Divider sx={{ my: 1 }} />
            <Row label="Total Deductions" value={fmt(payslip.total_deductions)} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800}>Net Salary</Typography>
          <Typography variant="h5" fontWeight={800}>AED {fmt(payslip.net_salary)}</Typography>
        </Box>
        <Button startIcon={<IconDownload size={18} />} sx={{ mt: 3 }} variant="outlined" disabled={downloading} onClick={download}>
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </Card>
    </PageContainer>
  );
};

export default PayslipView;
