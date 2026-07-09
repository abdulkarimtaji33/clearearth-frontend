import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  CircularProgress, Alert, Box, Chip, IconButton, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconHistory, IconCoin, IconEye, IconPrinter, IconDownload } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FETCHERS = {
  receivable: (id) => apiService.getReceivablePayments(id),
  payable: (id) => apiService.getPayablePayments(id),
  expense: (id) => apiService.getExpensePayments(id),
};

const PaymentHistoryDialog = ({ open, onClose, sourceType, sourceId, title, currency = 'AED' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const downloadReceipt = async (paymentId) => {
    try {
      setDownloadingId(paymentId);
      await apiService.downloadReceivableReceiptPdf(paymentId);
    } catch (e) {
      setError(e.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

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
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconHistory size={18} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.2}>
              {sourceType === 'payable' ? 'Payment receipts' : 'Payment history'}
            </Typography>
            {title && (
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
            )}
          </Box>
          {rows.length > 0 && (
            <Chip
              size="small"
              label={`${rows.length} payment${rows.length !== 1 ? 's' : ''}`}
              sx={{ ml: 'auto', fontWeight: 700 }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Box p={2.5}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          </Box>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Box py={6} textAlign="center">
            <IconCoin size={36} color={theme.palette.text.disabled} />
            <Typography color="text.secondary" mt={1.5} fontWeight={600}>
              No payments recorded yet
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={0.5}>
              Payments will appear here as they're recorded
            </Typography>
          </Box>
        ) : (
          <Box>
            {rows.map((r, idx) => (
              <Box
                key={r.id}
                sx={{
                  px: 2.5,
                  py: 2,
                  borderBottom: idx < rows.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 2,
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.14s',
                }}
              >
                {/* Timeline dot */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: theme.palette.primary.main,
                      border: '2px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.25),
                      flexShrink: 0,
                    }}
                  />
                  {idx < rows.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        flex: 1,
                        minHeight: 24,
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        mt: 0.5,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>

                {/* Content */}
                <Box flex={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                        <Chip
                          size="small"
                          label={`#${idx + 1}`}
                          sx={{ height: 18, fontWeight: 700, fontSize: '0.62rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                        />
                        <Typography variant="body2" fontWeight={700}>
                          {r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </Typography>
                      </Stack>
                      {r.payment_method && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {r.payment_method}
                        </Typography>
                      )}
                      {r.paymentAccount && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {r.paymentAccount.code} — {r.paymentAccount.name}
                        </Typography>
                      )}
                      {r.reference_no && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Ref: {r.reference_no}
                        </Typography>
                      )}
                      {r.received_from && (
                        <Typography variant="caption" color="success.main" display="block" fontWeight={600}>
                          From: {r.received_from}
                        </Typography>
                      )}
                      {r.paid_to && (
                        <Typography variant="caption" color="warning.dark" display="block" fontWeight={600}>
                          To: {r.paid_to}
                        </Typography>
                      )}
                      {r.createdByUser && (
                        <Typography variant="caption" color="text.disabled" display="block" mt={0.25}>
                          Recorded by {r.createdByUser.first_name} {r.createdByUser.last_name}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      fontWeight={800}
                      sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: '1rem', flexShrink: 0, ml: 1 }}
                    >
                      {currency} {fmt(r.amount)}
                    </Typography>
                  </Stack>
                  {sourceType === 'payable' && (
                    <Stack direction="row" spacing={0.5} mt={1}>
                      <Tooltip title="View receipt">
                        <IconButton size="small" onClick={() => { onClose(); navigate(`/erp/payment-receipts/${r.id}`); }} sx={{ borderRadius: 1.5 }}>
                          <IconEye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print receipt">
                        <IconButton size="small" onClick={() => { onClose(); navigate(`/erp/payment-receipts/${r.id}?print=1`); }} sx={{ borderRadius: 1.5 }}>
                          <IconPrinter size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                  {sourceType === 'receivable' && (
                    <Stack direction="row" spacing={0.5} mt={1}>
                      <Tooltip title="Download receipt">
                        <IconButton size="small" disabled={downloadingId === r.id} onClick={() => downloadReceipt(r.id)} sx={{ borderRadius: 1.5 }}>
                          <IconDownload size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Box>
              </Box>
            ))}

            {/* Total */}
            <Box
              sx={{
                px: 2.5,
                py: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderTop: '2px solid',
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    Total recorded
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rows.length} payment{rows.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Typography fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'primary.main' }}>
                  {currency} {fmt(totalPaid)}
                </Typography>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentHistoryDialog;
