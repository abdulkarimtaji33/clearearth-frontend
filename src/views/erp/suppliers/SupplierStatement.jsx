import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { localToday, localYearStart } from '../../../utils/dateLocal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BUCKETS = [
  { key: 'b0_30', label: '0–30 days' },
  { key: 'b31_60', label: '31–60 days' },
  { key: 'b61_90', label: '61–90 days' },
  { key: 'b90_plus', label: '90+ days' },
];
const TYPE_COLOR = { Bill: 'warning', 'Purchase order': 'warning', Payment: 'success', 'Debit note': 'info', Advance: 'secondary' };

/** Supplier statement of account: bills, payments, debit notes, advances and the running balance. Printable. */
const SupplierStatement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState(localYearStart());
  const [dateTo, setDateTo] = useState(localToday());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSupplierStatement(id, { dateFrom, dateTo });
      setData(res.data || null);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load the statement');
    } finally {
      setLoading(false);
    }
  }, [id, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const s = data?.supplier;
  const head = { fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' };

  return (
    <PageContainer title="Supplier statement" description="Statement of account">
      <Box
        sx={{
          '@media print': {
            '& .no-print': { display: 'none !important' },
          },
        }}
      >
        <Stack className="no-print" direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2.5}>
          <Button color="inherit" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField size="small" type="date" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField size="small" type="date" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Button variant="contained" startIcon={<IconPrinter size={18} />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>Print / save as PDF</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : data && (
          <>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>Statement of account</Typography>
                  <Typography variant="h4" fontWeight={800}>{s?.company_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[s?.supplier_code, s?.vat_number && `TRN ${s.vat_number}`, s?.email, s?.phone].filter(Boolean).join(' · ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>Period {data.dateFrom} to {data.dateTo}</Typography>
                </Box>
                <Box textAlign={{ sm: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>We owe this supplier</Typography>
                  <Typography variant="h3" fontWeight={800} color={data.balanceDue > 0.005 ? 'warning.dark' : 'success.main'}>AED {fmt(data.balanceDue)}</Typography>
                  <Typography variant="caption" color="text.secondary">Billed {fmt(data.billedTotal)} · Paid / settled {fmt(data.paidTotal)}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {BUCKETS.map((b) => (
                <Paper key={b.key} variant="outlined" sx={{ p: 1.5, borderRadius: 3, flex: 1, minWidth: 130, bgcolor: b.key === 'b90_plus' && data.aging[b.key] > 0 ? alpha(theme.palette.error.main, 0.06) : 'background.paper' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>{b.label}</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>{fmt(data.aging[b.key])}</Typography>
                </Paper>
              ))}
            </Stack>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={head}>Date</TableCell>
                      <TableCell sx={head}>Type</TableCell>
                      <TableCell sx={head}>Details</TableCell>
                      <TableCell sx={head} align="right">Billed (AED)</TableCell>
                      <TableCell sx={head} align="right">Paid / credited (AED)</TableCell>
                      <TableCell sx={head} align="right">Balance (AED)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                      <TableCell colSpan={5} sx={{ fontWeight: 700 }}>Opening balance at {data.dateFrom}</TableCell>
                      <TableCell align="right"><strong>{fmt(data.openingBalance)}</strong></TableCell>
                    </TableRow>
                    {data.transactions.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No activity in this period.</TableCell></TableRow>
                    )}
                    {data.transactions.map((t, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.date}</TableCell>
                        <TableCell><Chip size="small" label={t.docType} color={TYPE_COLOR[t.docType] || 'default'} variant="outlined" /></TableCell>
                        <TableCell>{t.details}{t.dueDate ? <Typography component="span" variant="caption" color="text.secondary"> · due {t.dueDate}</Typography> : null}</TableCell>
                        <TableCell align="right">{t.amount ? fmt(t.amount) : ''}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.dark' }}>{t.paid ? fmt(t.paid) : ''}</TableCell>
                        <TableCell align="right"><strong>{fmt(t.balance)}</strong></TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell colSpan={5} sx={{ fontWeight: 800 }}>Closing balance at {data.dateTo}</TableCell>
                      <TableCell align="right"><strong>{fmt(data.transactions.length ? data.transactions[data.transactions.length - 1].balance : data.openingBalance)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}
      </Box>
    </PageContainer>
  );
};

export default SupplierStatement;
