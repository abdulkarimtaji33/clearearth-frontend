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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
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

  useEffect(() => {
    fetchDeal();
  }, [id, fetchDeal]);

  const fetchDeal = useCallback(async () => {
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
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
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
          <Button
            variant="contained"
            startIcon={<IconEdit size={20} />}
            onClick={() => navigate(`/erp/deals/edit/${id}`)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Edit Deal
          </Button>
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
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Deal Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Title" value={deal.title} />
            <InfoRow label="Description" value={deal.description} />
            <InfoRow label="Deal Date" value={new Date(deal.deal_date).toLocaleDateString()} />
            <InfoRow label="Deal Number" value={deal.deal_number} />
          </CardContent>
        </Card>

        {/* Related Entities */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Related Entities
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Source Lead" value={deal.lead?.lead_number || '-'} />
                <InfoRow label="Company (Client)" value={deal.company?.company_name || '-'} />
                <InfoRow label="Contact Person" value={deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : '-'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Supplier" value={deal.supplier?.company_name || '-'} />
                <InfoRow label="Assigned To" value={deal.assignedUser ? `${deal.assignedUser.first_name} ${deal.assignedUser.last_name}` : '-'} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 5 }}>
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
            <CardContent sx={{ p: 5 }}>
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
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Audit Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Created" value={new Date(deal.created_at).toLocaleString()} />
            <InfoRow label="Last Updated" value={new Date(deal.updated_at).toLocaleString()} />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default DealView;
