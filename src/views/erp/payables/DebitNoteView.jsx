import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Alert, Box, Button, CircularProgress, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Printable supplier debit note. */
const DebitNoteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getSupplierDebitNote(id).then((res) => setNote(res.data)).catch((e) => setError(e.message || 'Could not load the debit note'));
  }, [id]);

  if (error) return <PageContainer title="Debit note"><Alert severity="error">{error}</Alert></PageContainer>;
  if (!note) return <PageContainer title="Debit note"><Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box></PageContainer>;

  const t = note.tenant || {};
  const company = t.company_name || t.name || '';
  const trn = t.trn_number || t.vat_registration_number;

  return (
    <PageContainer title={`Debit note ${note.debit_note_number}`}>
      <Stack direction="row" spacing={1.5} mb={2} className="no-print" sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/debit-notes')} sx={{ borderRadius: 2 }}>Back</Button>
        <Button variant="contained" startIcon={<IconPrinter size={18} />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>Print / save as PDF</Button>
      </Stack>

      <Box sx={{ maxWidth: 820, mx: 'auto', bgcolor: 'background.paper', p: { xs: 2.5, md: 5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', '@media print': { border: 'none', p: 0 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{company}</Typography>
            {[t.address, t.city, t.country].filter(Boolean).length > 0 && <Typography variant="body2" color="text.secondary">{[t.address, t.city, t.country].filter(Boolean).join(', ')}</Typography>}
            {trn && <Typography variant="body2" color="text.secondary">TRN: {trn}</Typography>}
          </Box>
          <Box textAlign="right">
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: 1 }}>DEBIT NOTE</Typography>
            <Typography variant="subtitle1" fontWeight={700}>{note.debit_note_number}</Typography>
            <Typography variant="body2" color="text.secondary">Date: {String(note.note_date).slice(0, 10)}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} mb={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>ISSUED TO (SUPPLIER)</Typography>
            <Typography variant="subtitle1" fontWeight={700}>{note.party_name}</Typography>
            {note.supplier?.vat_number && <Typography variant="body2" color="text.secondary">TRN: {note.supplier.vat_number}</Typography>}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>AGAINST BILL</Typography>
            <Typography variant="subtitle1" fontWeight={700}>{note.vendorBill?.bill_number || '—'}</Typography>
            {note.vendorBill?.supplier_invoice_no && <Typography variant="body2" color="text.secondary">Supplier invoice {note.vendorBill.supplier_invoice_no}</Typography>}
          </Box>
        </Stack>

        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (AED)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {note.reason}
                {note.notes && <Typography variant="caption" color="text.secondary" display="block">{note.notes}</Typography>}
              </TableCell>
              <TableCell align="right">{fmt(note.subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="right" sx={{ border: 0 }}>VAT</TableCell>
              <TableCell align="right" sx={{ border: 0 }}>{fmt(note.vat_amount)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid' }}>Total debited</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid' }}>{fmt(note.total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Typography variant="caption" color="text.secondary">
          This debit note reduces the amount payable to the supplier on the bill above.
        </Typography>
      </Box>
    </PageContainer>
  );
};

export default DebitNoteView;
