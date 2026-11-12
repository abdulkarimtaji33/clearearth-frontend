import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Section = ({ title, rows, empty }) => (
  <Box mb={3}>
    <Typography variant="subtitle1" fontWeight={800} gutterBottom>{title}</Typography>
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Date', 'Entry', 'Description', 'Money in', 'Money out'].map((h, i) => <TableCell key={h} align={i >= 3 ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 && <TableRow><TableCell colSpan={5} sx={{ color: 'text.secondary' }}>{empty}</TableCell></TableRow>}
        {rows.map((l) => (
          <TableRow key={l.id}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.date}</TableCell>
            <TableCell>{l.entryNumber}</TableCell>
            <TableCell>{l.description}</TableCell>
            <TableCell align="right">{l.debit ? fmt(l.debit) : ''}</TableCell>
            <TableCell align="right">{l.credit ? fmt(l.credit) : ''}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

/** Printable reconciliation report: statement balance, what cleared, what is still outstanding. */
const ReconciliationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getReconciliationReport(id).then((res) => setR(res.data)).catch((e) => setError(e.message || 'Could not load the report'));
  }, [id]);

  if (error) return <PageContainer title="Reconciliation"><Alert severity="error">{error}</Alert></PageContainer>;
  if (!r) return <PageContainer title="Reconciliation"><Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box></PageContainer>;

  const company = r.tenant?.company_name || r.tenant?.name || '';
  const done = r.status === 'completed';

  return (
    <PageContainer title="Bank reconciliation report">
      <Stack direction="row" spacing={1.5} mb={2} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/bank-reconciliation')} sx={{ borderRadius: 2 }}>Back</Button>
        <Button variant="contained" startIcon={<IconPrinter size={18} />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>Print / save as PDF</Button>
      </Stack>

      <Box sx={{ maxWidth: 900, mx: 'auto', bgcolor: 'background.paper', p: { xs: 2.5, md: 5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', '@media print': { border: 'none', p: 0 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{company}</Typography>
            <Typography variant="h6" fontWeight={700}>Bank reconciliation report</Typography>
            <Typography variant="body2" color="text.secondary">{r.account ? `${r.account.code} ${r.account.name}` : ''}</Typography>
          </Box>
          <Box textAlign="right">
            <Chip label={done ? 'Completed' : 'Draft'} color={done ? 'success' : 'warning'} sx={{ mb: 1 }} />
            <Typography variant="body2">Statement date: <strong>{r.statement_date}</strong></Typography>
            {r.completed_at && <Typography variant="body2" color="text.secondary">Completed: {String(r.completed_at).slice(0, 10)}</Typography>}
          </Box>
        </Stack>
        <Divider sx={{ mb: 3 }} />

        <Table size="small" sx={{ mb: 3, maxWidth: 520 }}>
          <TableBody>
            <TableRow><TableCell>Balance per bank statement</TableCell><TableCell align="right"><strong>{fmt(r.statement_balance)}</strong></TableCell></TableRow>
            <TableRow><TableCell>Reconciled in earlier statements</TableCell><TableCell align="right">{fmt(r.opening_cleared_balance)}</TableCell></TableRow>
            <TableRow><TableCell>Cleared in this reconciliation</TableCell><TableCell align="right">{fmt(r.cleared_balance - r.opening_cleared_balance)}</TableCell></TableRow>
            <TableRow><TableCell>Total cleared</TableCell><TableCell align="right">{fmt(r.cleared_balance)}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 800 }}>Difference</TableCell><TableCell align="right" sx={{ fontWeight: 800, color: Math.abs(r.difference) < 0.01 ? 'success.main' : 'error.main' }}>{fmt(r.difference)}</TableCell></TableRow>
            <TableRow><TableCell>Not yet on the statement (net)</TableCell><TableCell align="right">{fmt(r.unreconciledNet)}</TableCell></TableRow>
            <TableRow><TableCell>Balance per books on {r.statement_date}</TableCell><TableCell align="right"><strong>{fmt(r.bookBalance)}</strong></TableCell></TableRow>
          </TableBody>
        </Table>

        <Section title={`Cleared entries (${r.cleared.length})`} rows={r.cleared} empty="No entries were ticked." />
        <Section title={`Unreconciled entries (${r.unreconciled.length})`} rows={r.unreconciled} empty="Every entry up to this date is reconciled." />

        {r.notes && <Typography variant="body2" color="text.secondary">Notes: {r.notes}</Typography>}
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Prepared by {r.createdByUser ? [r.createdByUser.first_name, r.createdByUser.last_name].filter(Boolean).join(' ') : '—'}
        </Typography>
      </Box>
    </PageContainer>
  );
};

export default ReconciliationReport;
