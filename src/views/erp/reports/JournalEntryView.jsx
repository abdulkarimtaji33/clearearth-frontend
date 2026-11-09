import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconBook2, IconArrowBackUp } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { asArray } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOURCE_NAV = {
  tax_invoice: (id) => `/erp/tax-invoices/view/${id}`,
  payment_received: (id) => `/erp/tax-invoices/view/${id}`,
  expense: (id) => `/erp/accounts/work-orders`,
  expense_payment: (id) => `/erp/accounts/work-orders`,
  purchase_order_approved: (id) => `/erp/purchase-orders/view/${id}`,
  po_payment: (id) => `/erp/purchase-orders/view/${id}`,
  reversal: (id) => `/erp/journal/view/${id}`,
};

const userName = (u, fallbackId) => {
  const full = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
  return full || u?.name || u?.email || (fallbackId != null ? `User #${fallbackId}` : '—');
};

const JournalEntryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reversing, setReversing] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getJournalEntry(id);
        if (res.success) setEntry(res.data);
        else setError(res.message || 'Not found');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReverse = async () => {
    if (!reason.trim()) return;
    setReversing(true);
    setError('');
    try {
      const res = await apiService.reverseJournalEntry(id, { reason: reason.trim() });
      if (res.success) {
        setEntry(res.data);
        setReverseOpen(false);
        setReason('');
        setMsg(`Entry reversed${res.data?.reversedByEntry ? ` — reversal ${res.data.reversedByEntry.entry_number} posted.` : '.'}`);
      } else {
        setError(res.message || 'Failed to reverse');
      }
    } catch (e) {
      setError(e.message || 'Failed to reverse');
    } finally {
      setReversing(false);
    }
  };

  if (loading) return <PageContainer title="Journal Entry"><Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box></PageContainer>;

  const lines = asArray(entry?.lines);
  const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const sourceUrl = entry?.source_type && entry?.source_id && SOURCE_NAV[entry.source_type]
    ? SOURCE_NAV[entry.source_type](entry.source_id)
    : null;

  return (
    <PageContainer title="Journal Entry" description={entry?.entry_number}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/journal')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBook2 size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800}>{entry?.entry_number}</Typography>
          <Chip label={entry?.reversed_by_id ? 'reversed' : entry?.status} color={entry?.reversed_by_id ? 'warning' : entry?.status === 'posted' ? 'success' : 'default'} />
        </Stack>
        {entry?.status === 'posted' && !entry?.reversed_by_id && !entry?.reverses_entry_id && (
          <Button variant="outlined" color="error" startIcon={<IconArrowBackUp size={18} />} onClick={() => { setReason(''); setReverseOpen(true); }} sx={{ borderRadius: 2 }}>
            Reverse entry
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">Date</Typography>
              <Typography fontWeight={700}>{entry?.entry_date}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography fontWeight={600}>{entry?.description}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Source</Typography>
              <Typography fontWeight={600}>{entry?.source_type || '—'}</Typography>
            </Box>
            {sourceUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary">Source Document</Typography>
                <Box>
                  <Button size="small" variant="text" onClick={() => navigate(sourceUrl)} sx={{ p: 0, minWidth: 0, fontWeight: 600 }}>
                    View #{entry.source_id}
                  </Button>
                </Box>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Created By</Typography>
              <Typography fontWeight={600}>{userName(entry?.createdByUser, entry?.created_by)}</Typography>
            </Box>
            {entry?.reversedByEntry && (
              <Box>
                <Typography variant="caption" color="text.secondary">Reversed by</Typography>
                <Box>
                  <Button size="small" variant="text" onClick={() => navigate(`/erp/journal/view/${entry.reversedByEntry.id}`)} sx={{ p: 0, minWidth: 0, fontWeight: 600 }}>
                    {entry.reversedByEntry.entry_number}
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary">{entry.reversal_reason}</Typography>
                </Box>
              </Box>
            )}
            {entry?.reversesEntry && (
              <Box>
                <Typography variant="caption" color="text.secondary">Reverses</Typography>
                <Box>
                  <Button size="small" variant="text" onClick={() => navigate(`/erp/journal/view/${entry.reversesEntry.id}`)} sx={{ p: 0, minWidth: 0, fontWeight: 600 }}>
                    {entry.reversesEntry.entry_number}
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary">{entry.reversal_reason}</Typography>
                </Box>
              </Box>
            )}
            {(entry?.paid_to || entry?.received_from) && (
              <>
                {entry?.paid_to && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Paid to</Typography>
                    <Chip size="small" label={entry.paid_to} variant="outlined" sx={{ mt: 0.5, fontWeight: 600 }} />
                  </Box>
                )}
                {entry?.received_from && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Received from</Typography>
                    <Chip size="small" label={entry.received_from} color="success" variant="outlined" sx={{ mt: 0.5, fontWeight: 600 }} />
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={800}>Journal Lines</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Account Code', 'Account Name', 'Description', 'Debit (AED)', 'Credit (AED)'].map((h) => (
                    <TableCell key={h} align={h.includes('Debit') || h.includes('Credit') ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={l.id || i}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      <Button size="small" variant="text" sx={{ p: 0, fontFamily: 'monospace', fontWeight: 600 }}
                        onClick={() => navigate(`/erp/reports/general-ledger?accountId=${l.account_id}`)}>
                        {l.account?.code || l.account_id}
                      </Button>
                    </TableCell>
                    <TableCell>{l.account?.name || '—'}</TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{l.description || '—'}</Typography></TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.debit) > 0 ? 'text.primary' : 'text.disabled' }}>
                      {parseFloat(l.debit) > 0 ? fmt(l.debit) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: parseFloat(l.credit) > 0 ? 'text.primary' : 'text.disabled' }}>
                      {parseFloat(l.credit) > 0 ? fmt(l.credit) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Totals</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(totalDebit)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(totalCredit)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {isBalanced
              ? <Alert severity="success" sx={{ py: 0.5 }}>Entry is balanced — Debits = Credits</Alert>
              : <Alert severity="error" sx={{ py: 0.5 }}>Entry is NOT balanced — difference: AED {fmt(Math.abs(totalDebit - totalCredit))}</Alert>}
          </Box>
        </Paper>
      </Stack>
      <Dialog open={reverseOpen} onClose={() => !reversing && setReverseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Reverse {entry?.entry_number}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The original entry stays in the ledger. A new entry with every debit and credit swapped is posted today and linked to it.
          </Typography>
          <TextField
            autoFocus fullWidth multiline minRows={2} required label="Reason for reversal" value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setReverseOpen(false)} disabled={reversing}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReverse} disabled={reversing || !reason.trim()}>
            {reversing ? 'Reversing…' : 'Reverse entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default JournalEntryView;
