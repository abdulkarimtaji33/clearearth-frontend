import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  CircularProgress, Alert, Box, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconHistory } from '@tabler/icons-react';
import apiService from '../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FETCHERS = {
  receivable: (id) => apiService.getReceivablePayments(id),
  payable: (id) => apiService.getPayablePayments(id),
  expense: (id) => apiService.getExpensePayments(id),
};

const PaymentHistoryDialog = ({ open, onClose, sourceType, sourceId, title, currency = 'AED' }) => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !sourceId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const fetcher = FETCHERS[sourceType];
        if (!fetcher) throw new Error('Invalid payment source');
        const res = await fetcher(sourceId);
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load payment history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, sourceId, sourceType]);

  const totalPaid = rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconHistory size={20} />
          <Box>
            <Typography fontWeight={800}>Payment history</Typography>
            {title && <Typography variant="body2" color="text.secondary">{title}</Typography>}
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No payments recorded yet</Typography>
        ) : (
          <Stack spacing={0}>
            {rows.map((r, idx) => (
              <Box key={r.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" py={1.5}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Chip size="small" label={`#${idx + 1}`} sx={{ height: 20, fontWeight: 700, fontSize: '0.65rem' }} />
                      <Typography variant="body2" fontWeight={700}>{r.paid_at || '—'}</Typography>
                    </Stack>
                    {r.payment_method && (
                      <Typography variant="caption" color="text.secondary" display="block">{r.payment_method}</Typography>
                    )}
                    {r.paymentAccount && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {r.paymentAccount.code} — {r.paymentAccount.name}
                      </Typography>
                    )}
                    {r.reference_no && (
                      <Typography variant="caption" color="text.secondary" display="block">Ref: {r.reference_no}</Typography>
                    )}
                    {r.received_from && (
                      <Typography variant="caption" color="success.main" display="block">From: {r.received_from}</Typography>
                    )}
                    {r.paid_to && (
                      <Typography variant="caption" color="warning.main" display="block">To: {r.paid_to}</Typography>
                    )}
                    {r.createdByUser && (
                      <Typography variant="caption" color="text.disabled" display="block">
                        Recorded by {r.createdByUser.first_name} {r.createdByUser.last_name}
                      </Typography>
                    )}
                  </Box>
                  <Typography fontWeight={800} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                    {currency} {fmt(r.amount)}
                  </Typography>
                </Stack>
                {idx < rows.length - 1 && <Divider />}
              </Box>
            ))}
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>Total recorded</Typography>
                <Typography fontWeight={800} sx={{ fontFamily: 'monospace' }}>{currency} {fmt(totalPaid)}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{rows.length} payment{rows.length !== 1 ? 's' : ''}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentHistoryDialog;
