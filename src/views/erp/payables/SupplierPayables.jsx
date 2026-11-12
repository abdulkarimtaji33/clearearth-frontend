import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Collapse, IconButton, InputAdornment, Paper, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import {
  IconChevronDown, IconChevronRight, IconSearch, IconTruckDelivery, IconFileInvoice, IconReceipt,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { localToday } from '../../../utils/dateLocal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BUCKETS = [
  { key: 'b0_30', label: '0–30 days', color: 'success' },
  { key: 'b31_60', label: '31–60 days', color: 'warning' },
  { key: 'b61_90', label: '61–90 days', color: 'warning' },
  { key: 'b90_plus', label: '90+ days', color: 'error' },
];

const Stat = ({ label, value, color, hint }) => {
  const theme = useTheme();
  const main = color ? theme.palette[color].main : theme.palette.text.primary;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1, minWidth: 150, borderColor: color ? alpha(main, 0.35) : 'divider', bgcolor: color ? alpha(main, 0.05) : 'background.paper' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color: main }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
};

/** What we owe, grouped by supplier, with an aging view. */
const SupplierPayables = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('outstanding');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [asOf, setAsOf] = useState(localToday());
  const [open, setOpen] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getPayablesBySupplier({ asOf });
      setData(res.data || null);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load payables');
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.suppliers || []).filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [data, search]);

  const totals = data?.totals;
  const head = { fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' };

  return (
    <PageContainer title="Supplier payables" description="What we owe, supplier by supplier">
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.12), color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTruckDelivery size={24} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Supplier payables</Typography>
            <Typography variant="body2" color="text.secondary">Outstanding bills grouped by supplier. Open a supplier for its statement, or pay bills from Vendor Bills.</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<IconFileInvoice size={18} />} onClick={() => navigate('/erp/vendor-bills')} sx={{ borderRadius: 2 }}>Vendor bills</Button>
          <Button variant="outlined" startIcon={<IconReceipt size={18} />} onClick={() => navigate('/erp/payment-receipts')} sx={{ borderRadius: 2 }}>Payment receipts</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Stat label="Total owed" value={`AED ${fmt(totals?.total)}`} color="primary" hint={`${totals?.billCount || 0} open bill${totals?.billCount === 1 ? '' : 's'}`} />
        <Stat label="Overdue" value={`AED ${fmt(totals?.overdue)}`} color={totals?.overdue > 0 ? 'error' : undefined} hint="past the due date" />
        <Stat label="Suppliers owed" value={String((data?.suppliers || []).length)} />
      </Stack>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab value="outstanding" label="Outstanding by supplier" />
          <Tab value="aging" label="Aging" />
        </Tabs>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2 }} alignItems={{ sm: 'center' }}>
          <TextField
            size="small" placeholder="Search supplier…" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
          />
          <TextField
            size="small" type="date" label="As of" value={asOf} onChange={(e) => setAsOf(e.target.value || localToday())}
            InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {tab === 'aging' && (
            <Typography variant="caption" color="text.secondary">Counted by days past the due date. A bill that is not due yet is in 0–30.</Typography>
          )}
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box textAlign="center" py={7}>
            <Typography fontWeight={700}>Nothing is owed to suppliers</Typography>
            <Typography variant="body2" color="text.secondary">Unpaid supplier bills will show up here, grouped by supplier.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={head}>Supplier</TableCell>
                  <TableCell sx={head} align="right">Bills</TableCell>
                  {tab === 'outstanding' ? (
                    <>
                      <TableCell sx={head} align="right">Overdue (AED)</TableCell>
                      <TableCell sx={head} align="right">Total owed (AED)</TableCell>
                    </>
                  ) : (
                    <>
                      {BUCKETS.map((b) => <TableCell key={b.key} sx={head} align="right">{b.label}</TableCell>)}
                      <TableCell sx={head} align="right">Total (AED)</TableCell>
                    </>
                  )}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((s) => (
                  <React.Fragment key={s.key}>
                    <TableRow hover onClick={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <IconButton size="small">{open[s.key] ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}</IconButton>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                      <TableCell align="right">{s.billCount}</TableCell>
                      {tab === 'outstanding' ? (
                        <>
                          <TableCell align="right" sx={{ color: s.overdue > 0 ? 'error.main' : 'text.secondary', fontWeight: s.overdue > 0 ? 700 : 400 }}>{s.overdue > 0 ? fmt(s.overdue) : '—'}</TableCell>
                          <TableCell align="right"><strong>{fmt(s.total)}</strong></TableCell>
                        </>
                      ) : (
                        <>
                          {BUCKETS.map((b) => (
                            <TableCell key={b.key} align="right" sx={{ color: s.buckets[b.key] > 0 && b.key !== 'b0_30' ? `${b.color}.main` : 'inherit' }}>
                              {s.buckets[b.key] > 0 ? fmt(s.buckets[b.key]) : '—'}
                            </TableCell>
                          ))}
                          <TableCell align="right"><strong>{fmt(s.total)}</strong></TableCell>
                        </>
                      )}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {s.supplierId && (
                          <Button size="small" onClick={() => navigate(`/erp/suppliers/${s.supplierId}/statement`)} sx={{ borderRadius: 2 }}>Statement</Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, borderBottom: open[s.key] ? undefined : 'none' }}>
                        <Collapse in={!!open[s.key]} unmountOnExit>
                          <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {['Document', 'Supplier invoice', 'Date', 'Due', 'Days past due', 'Total', 'Balance'].map((h, i) => (
                                    <TableCell key={h} sx={head} align={i >= 5 ? 'right' : 'left'}>{h}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {s.items.map((it) => (
                                  <TableRow key={`${it.kind}-${it.id}`}>
                                    <TableCell>{it.number}{it.kind === 'po' && <Chip size="small" label="older PO" sx={{ ml: 1, height: 18 }} />}</TableCell>
                                    <TableCell>{it.reference || '—'}</TableCell>
                                    <TableCell>{it.date}</TableCell>
                                    <TableCell>{it.dueDate || '—'}</TableCell>
                                    <TableCell align="right" sx={{ color: it.daysPastDue > 0 ? 'error.main' : 'text.secondary' }}>{it.daysPastDue > 0 ? it.daysPastDue : 'not due'}</TableCell>
                                    <TableCell align="right">{fmt(it.total)}</TableCell>
                                    <TableCell align="right"><strong>{fmt(it.balance)}</strong></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                  <TableCell align="right"><strong>{totals?.billCount || 0}</strong></TableCell>
                  {tab === 'outstanding' ? (
                    <>
                      <TableCell align="right"><strong>{fmt(totals?.overdue)}</strong></TableCell>
                      <TableCell align="right"><strong>{fmt(totals?.total)}</strong></TableCell>
                    </>
                  ) : (
                    <>
                      {BUCKETS.map((b) => <TableCell key={b.key} align="right"><strong>{fmt(totals?.buckets?.[b.key])}</strong></TableCell>)}
                      <TableCell align="right"><strong>{fmt(totals?.total)}</strong></TableCell>
                    </>
                  )}
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default SupplierPayables;
