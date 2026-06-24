import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Alert, Stack, IconButton, Typography } from '@mui/material';
import GlobalStyles from '@mui/material/GlobalStyles';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import PaymentReceiptDocument from '../../../components/erp/PaymentReceiptDocument';
import apiService from '../../../services/api';

const PurchasePaymentReceiptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReceipt = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getPurchasePaymentReceipt(id);
      if (res.success) setReceipt(res.data);
      else setError('Receipt not found');
    } catch (err) {
      setError(err.message || 'Failed to load payment receipt');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReceipt(); }, [fetchReceipt]);

  useEffect(() => {
    if (!loading && receipt && searchParams.get('print') === '1') {
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, receipt, searchParams]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <PageContainer title="Payment Receipt">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!receipt) {
    return (
      <PageContainer title="Payment Receipt">
        <Alert severity="error">{error || 'Receipt not found'}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={receipt.receipt_number || `Payment Receipt #${id}`}>
      <GlobalStyles
        styles={{
          '@media print': {
            'body *': { visibility: 'hidden' },
            '#payment-receipt-print, #payment-receipt-print *': { visibility: 'visible' },
            '#payment-receipt-print': {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              padding: '16px 24px',
            },
            '.print-hide': { display: 'none !important' },
          },
        }}
      />

      <Box className="print-hide" sx={{ maxWidth: 820, mx: 'auto', mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton onClick={() => navigate('/erp/payment-receipts')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <IconArrowLeft size={18} />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={800}>{receipt.receipt_number || `PPR-${id}`}</Typography>
              <Typography variant="body2" color="text.secondary">Purchase payment receipt</Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<IconPrinter size={18} />} onClick={handlePrint} sx={{ borderRadius: 2 }}>
            Print receipt
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} className="print-hide">{error}</Alert>}

      <Box sx={{ maxWidth: 820, mx: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <PaymentReceiptDocument receipt={receipt} />
      </Box>
    </PageContainer>
  );
};

export default PurchasePaymentReceiptView;
