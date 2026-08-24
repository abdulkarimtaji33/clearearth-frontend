import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, ButtonBase,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router';
import { IconArrowLeft, IconFileDescription, IconDownload } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import ListDateRangeFilter from '../../../components/erp/ListDateRangeFilter';
import AmountBreakdownDialog from '../../../components/erp/AmountBreakdownDialog';
import apiService from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AGING_LABELS = {
  current: 'Current (not yet due)',
  bucket_1_30: '1–30 days overdue',
  bucket_31_60: '31–60 days overdue',
  bucket_61_90: '61–90 days overdue',
  bucket_over_90: 'Over 90 days overdue',
  bucket_no_due_date: 'No due date',
};

/** A clickable amount — opens the AmountBreakdownDialog with the given kind/payload. */
const AmountButton = ({ children, onClick, color, fontWeight = 700 }) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      fontFamily: 'monospace', fontWeight, fontSize: 'inherit', color: color || 'inherit',
      px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover', textDecoration: 'underline' },
    }}
  >
    {children}
  </ButtonBase>
);

const StatementOfAccountView = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dialog, setDialog] = useState(null); // { kind, payload }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getStatementOfAccount(companyId, { dateFrom, dateTo });
      if (res.success) setData(res.data);
      else setError(res.message || 'Failed to load statement');
    } catch (e) {
      setError(e.message || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  }, [companyId, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const downloadPdf = async () => {
    try {
      setDownloading(true);
      await apiService.downloadStatementOfAccountPdf(companyId, { dateFrom, dateTo });
    } catch (e) {
      setError(e.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const currency = data?.currency || 'AED';

  const agingRows = useMemo(() => {
    if (!data?.aging) return [];
    return Object.keys(AGING_LABELS)
      .map((key) => ({ key, label: AGING_LABELS[key], amount: data.aging[key] || 0 }))
      .filter((r) => r.amount > 0.005 || r.key === 'current');
  }, [data]);

  if (loading && !data) {
    return (
      <PageContainer title="Statement of account">
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Statement of account" description={data?.company?.company_name}>
      <Box>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/receivables')} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFileDescription size={22} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{data?.company?.company_name || 'Statement of account'}</Typography>
              <Typography variant="body2" color="text.secondary">{data?.dateFrom} to {data?.dateTo}</Typography>
            </Box>
          </Stack>
          <Button variant="outlined" startIcon={<IconDownload size={18} />} disabled={downloading} onClick={downloadPdf} sx={{ borderRadius: 2 }}>
            {downloading ? 'Preparing…' : 'Download PDF'}
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <ListDateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
            helperText="Statement period"
            compact
          />
        </Paper>

        {data && (
          <>
            <Stack direction="row" spacing={2} flexWrap="wrap" mb={2.5}>
              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">Balance due</Typography>
                <AmountButton
                  fontWeight={800}
                  color={theme.palette.warning.dark}
                  onClick={() => setDialog({ kind: 'balanceDue', data: data.balanceDueBreakdown })}
                >
                  <Typography variant="h5" component="span" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                    {currency} {fmt(data.balanceDue)}
                  </Typography>
                </AmountButton>
              </Paper>
              {agingRows.map((r) => (
                <Paper key={r.key} variant="outlined" sx={{ borderRadius: 3, p: 2, minWidth: 160 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" noWrap>{r.label}</Typography>
                  <AmountButton
                    onClick={() => setDialog({ kind: 'aging', data: { label: r.label, invoices: data.agingDetail?.[r.key] || [] } })}
                  >
                    {currency} {fmt(r.amount)}
                  </AmountButton>
                </Paper>
              ))}
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      {['Date', 'Type', 'Details', 'Amount', 'Receipts', 'Balance'].map((h) => (
                        <TableCell key={h} align={['Amount', 'Receipts', 'Balance'].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{data.dateFrom}</TableCell>
                      <TableCell colSpan={3}><Typography fontStyle="italic" color="text.secondary" fontWeight={600}>Opening Balance</Typography></TableCell>
                      <TableCell />
                      <TableCell align="right">
                        <AmountButton onClick={() => setDialog({ kind: 'opening', data: data.openingBalanceEntries || [] })}>
                          {fmt(data.openingBalance)}
                        </AmountButton>
                      </TableCell>
                    </TableRow>
                    {(data.transactions || []).length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No transactions in this period</Typography></TableCell></TableRow>
                    ) : data.transactions.map((t, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.8rem' }}>{t.date}</TableCell>
                        <TableCell>
                          <Chip size="small" label={t.docType} color={t.docType === 'Invoice' ? 'warning' : 'success'} variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" noWrap title={t.details}>{t.details}</Typography>
                          {t.dueDate && <Typography variant="caption" color="text.secondary">Due {t.dueDate}</Typography>}
                        </TableCell>
                        <TableCell align="right">
                          {t.amount > 0 ? (
                            <AmountButton onClick={() => setDialog({ kind: 'invoice', data: t.breakdown })}>{fmt(t.amount)}</AmountButton>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          {t.receipts > 0 ? (
                            <AmountButton color={theme.palette.success.dark} onClick={() => setDialog({ kind: 'receipt', data: t.breakdown })}>{fmt(t.receipts)}</AmountButton>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <AmountButton onClick={() => setDialog({ kind: 'balance', data: t })}>{fmt(t.balance)}</AmountButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>

      <AmountBreakdownDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        kind={dialog?.kind}
        data={dialog?.data}
        currency={currency}
      />
    </PageContainer>
  );
};

export default StatementOfAccountView;
