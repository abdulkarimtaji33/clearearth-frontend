import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Chip, Button, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconMessageReport } from '@tabler/icons-react';
import apiService from '../../services/api';

const when = (v) => (v ? new Date(v).toLocaleString() : '');
const name = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || '—';

/**
 * Accounts asks sales to correct details of an approved quotation before any document is generated from it;
 * sales answers when corrected. Both sides are notified.
 * canRequest: accounts side. canAnswer: the quotation's salesperson / a manager.
 */
const QuotationCorrectionPanel = ({ quotationId, hasInvoice, canRequest, canAnswer }) => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // { mode: 'request' | 'answer', requestId }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getQuotationCorrections(quotationId);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Could not load correction requests');
    }
  }, [quotationId]);
  useEffect(() => { load(); }, [load]);

  const open = rows.find((r) => r.status === 'open');
  const showRequestButton = canRequest && !open && !hasInvoice;
  if (!rows.length && !showRequestButton) return null;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (dialog.mode === 'request') await apiService.requestQuotationCorrection(quotationId, text);
      else await apiService.resolveQuotationCorrection(quotationId, dialog.requestId, text);
      setDialog(null);
      setText('');
      await load();
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, px: 2.5, py: 2, borderRadius: 2.5, borderColor: open ? alpha(theme.palette.warning.main, 0.5) : 'divider', bgcolor: open ? alpha(theme.palette.warning.main, 0.05) : 'transparent' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <IconMessageReport size={20} />
          <Typography variant="subtitle2" fontWeight={800}>Corrections between accounts and sales</Typography>
          {open && <Chip size="small" color="warning" label="Waiting for sales" sx={{ fontWeight: 700 }} />}
        </Stack>
        <Stack direction="row" spacing={1}>
          {showRequestButton && (
            <Button size="small" variant="outlined" onClick={() => { setText(''); setDialog({ mode: 'request' }); }} sx={{ borderRadius: 2 }}>Request correction from sales</Button>
          )}
          {open && canAnswer && (
            <Button size="small" variant="contained" color="success" onClick={() => { setText(''); setDialog({ mode: 'answer', requestId: open.id }); }} sx={{ borderRadius: 2 }}>Mark as corrected</Button>
          )}
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {rows.map((r) => (
        <Box key={r.id} sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2"><strong>{name(r.requestedByUser)}</strong> asked for a correction · {when(r.created_at)}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.25 }}>{r.message}</Typography>
          {r.status === 'corrected' && (
            <Typography variant="body2" color="success.main" sx={{ mt: 0.75 }}>
              Corrected by {name(r.respondedByUser)} · {when(r.responded_at)}{r.response_note ? ` — ${r.response_note}` : ''}
            </Typography>
          )}
        </Box>
      ))}

      <Dialog open={Boolean(dialog)} onClose={() => !busy && setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog?.mode === 'request' ? 'Request correction from sales' : 'Mark as corrected'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {dialog?.mode === 'request'
              ? 'Say what details sales should correct. Sales is notified and accounts is notified back when it is done.'
              : 'Tell accounts what was corrected. Accounts is notified.'}
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={3} label={dialog?.mode === 'request' ? 'What should be corrected' : 'What was corrected (optional)'} value={text} onChange={(e) => setText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={busy || (dialog?.mode === 'request' && !text.trim())}>{dialog?.mode === 'request' ? 'Send to sales' : 'Notify accounts'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default QuotationCorrectionPanel;
