import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PaymentReceiptDocument = ({ receipt, printId = 'payment-receipt-print' }) => {
  if (!receipt) return null;

  const tenant = receipt.tenant || {};
  const po = receipt.purchase_order || {};
  const currency = po.currency || 'AED';

  return (
    <Box id={printId} sx={{ bgcolor: 'background.paper', color: 'text.primary', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          {tenant.company_name || tenant.name || 'Clear Earth'}
        </Typography>
        {(tenant.address || tenant.city || tenant.country) && (
          <Typography variant="body2" color="text.secondary">
            {[tenant.address, tenant.city, tenant.country].filter(Boolean).join(', ')}
          </Typography>
        )}
        {(tenant.phone || tenant.email) && (
          <Typography variant="caption" color="text.secondary" display="block">
            {[tenant.phone, tenant.email].filter(Boolean).join(' · ')}
          </Typography>
        )}
        {(tenant.trn_number || tenant.vat_registration_number) && (
          <Typography variant="caption" color="text.secondary" display="block">
            TRN: {tenant.trn_number || tenant.vat_registration_number}
          </Typography>
        )}
      </Box>

      <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ letterSpacing: 1, mb: 0.5 }}>
        PAYMENT RECEIPT
      </Typography>
      <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
        {receipt.receipt_number || `PPR-${receipt.id}`}
      </Typography>

      <Divider sx={{ mb: 2.5 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Paid to
          </Typography>
          <Typography fontWeight={700}>{receipt.paid_to || receipt.party_name || '—'}</Typography>
          {receipt.party_label && (
            <Typography variant="caption" color="text.secondary">{receipt.party_label}</Typography>
          )}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Payment date
          </Typography>
          <Typography fontWeight={700}>{fmtDate(receipt.paid_at)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Purchase order
          </Typography>
          <Typography fontWeight={700}>PO #{receipt.po_id || po.id}</Typography>
          {po.deal?.title && (
            <Typography variant="caption" color="text.secondary" display="block">{po.deal.title}</Typography>
          )}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Payment method
          </Typography>
          <Typography fontWeight={700}>{receipt.payment_method || '—'}</Typography>
          {receipt.paymentAccount && (
            <Typography variant="caption" color="text.secondary" display="block">
              {receipt.paymentAccount.code} — {receipt.paymentAccount.name}
            </Typography>
          )}
        </Box>
        {receipt.reference_no && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
              Reference
            </Typography>
            <Typography fontWeight={700}>{receipt.reference_no}</Typography>
          </Box>
        )}
        {po.po_date && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
              PO date
            </Typography>
            <Typography fontWeight={700}>{fmtDate(po.po_date)}</Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
          Amount paid
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'monospace', mt: 0.5 }}>
          {currency} {fmt(receipt.amount)}
        </Typography>
      </Box>

      {Array.isArray(po.items) && po.items.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight={800} mb={1}>
            Purchase order summary
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {po.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productService?.name || item.description || '—'}</TableCell>
                  <TableCell align="right">{item.quantity ?? '—'}</TableCell>
                  <TableCell align="right">{currency} {fmt(item.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>PO total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{currency} {fmt(po.po_total)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>Total paid on PO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{currency} {fmt(po.paid_amount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>Balance due</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{currency} {fmt(po.balance_due)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}

      {receipt.createdByUser && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Recorded by {receipt.createdByUser.first_name} {receipt.createdByUser.last_name}
        </Typography>
      )}

      <Typography variant="caption" color="text.disabled" display="block" mt={3} textAlign="center">
        This is a computer-generated payment receipt for purchase payments.
      </Typography>
    </Box>
  );
};

export default PaymentReceiptDocument;
