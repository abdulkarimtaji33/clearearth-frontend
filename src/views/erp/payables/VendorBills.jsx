import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Tabs, Tab, Checkbox, Autocomplete,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReceipt, IconUpload, IconPlus } from '@tabler/icons-react';
import CascadingAccountSelect from '../../../components/erp/CascadingAccountSelect';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { PAYMENT_METHOD_OPTIONS } from '../../../constants/paymentMethods';
import { filterCashBankAccounts, filterActiveByType, isPostable, overdrawInfo } from '../../../utils/accountTree';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const STATUS_COLOR = { open: 'warning', partial: 'info', paid: 'success', void: 'default' };

const partyKey = (b) => `${b.supplier_id || ''}-${b.company_id || ''}`;

const VendorBills = () => {
  const theme = useTheme();
  const [tab, setTab] = useState('awaiting');
  const [awaiting, setAwaiting] = useState([]);
  const [bills, setBills] = useState([]);
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Record bill dialog
  const [billPo, setBillPo] = useState(null);
  const [billForm, setBillForm] = useState({});
  const [billSaving, setBillSaving] = useState(false);
  const [billError, setBillError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Pay dialog
  const [selected, setSelected] = useState({});
  const [payOpen, setPayOpen] = useState(false);
  const [payAmounts, setPayAmounts] = useState({});
  const [payForm, setPayForm] = useState({ accountId: '', method: 'Bank transfer', date: today(), ref: '', notes: '' });
  const [bankAccounts, setBankAccounts] = useState([]);

  // New supplier bill without a PO (an unpaid expense)
  const emptyDirect = () => ({
    supplier: null, expenseAccountId: '', netAmount: '', vatRate: '5', supplierInvoiceNo: '', supplierTrn: '',
    billDate: today(), dueDate: '', attachmentPath: '', attachmentName: '', notes: '',
  });
  const [directOpen, setDirectOpen] = useState(false);
  const [direct, setDirect] = useState(emptyDirect());
  const [directSaving, setDirectSaving] = useState(false);
  const [directError, setDirectError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState('');
  const [negativeOk, setNegativeOk] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [aw, bl] = await Promise.all([
        apiService.getVendorBillsAwaiting(),
        apiService.getVendorBills({ page: 1, pageSize: 500, status: statusFilter || undefined }),
      ]);
      setAwaiting(Array.isArray(aw.data) ? aw.data : []);
      setBills(Array.isArray(bl.data) ? bl.data : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load vendor bills');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiService.getChartOfAccounts({ withBalance: true }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setBankAccounts(filterCashBankAccounts(list).filter(isPostable));
      setAllAccounts(list);
      setExpenseAccounts(filterActiveByType(list, 'expense'));
    }).catch(() => {});
    apiService.getSuppliers({ page: 1, pageSize: 1000 }).then((res) => {
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.items || []);
    }).catch(() => {});
  }, []);

  // ---- New supplier bill (no PO) ----
  const setD = (k) => (e) => setDirect((f) => ({ ...f, [k]: e.target.value }));
  const dNet = parseFloat(direct.netAmount) || 0;
  const dVat = Math.round(dNet * (parseFloat(direct.vatRate) || 0)) / 100;
  const dTotal = Math.round((dNet + dVat) * 100) / 100;

  const uploadDirectAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await apiService.uploadCertificateAttachment(file);
      setDirect((f) => ({ ...f, attachmentPath: res.data.path, attachmentName: file.name }));
    } catch (err) {
      setDirectError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveDirect = async () => {
    if (!direct.supplier) { setDirectError('Select the supplier'); return; }
    if (!direct.expenseAccountId) { setDirectError('Select the expense head and sub-head'); return; }
    if (!direct.supplierInvoiceNo.trim()) { setDirectError('Supplier invoice number is required'); return; }
    if (!(dNet > 0)) { setDirectError('Enter the amount before VAT'); return; }
    if (dVat > 0 && !direct.supplierTrn.trim()) { setDirectError('Recoverable VAT needs the supplier TRN'); return; }
    if (direct.dueDate && direct.dueDate < direct.billDate) { setDirectError('Due date cannot be before the bill date'); return; }
    try {
      setDirectSaving(true);
      setDirectError('');
      await apiService.createDirectVendorBill({
        supplierId: direct.supplier.id,
        expenseAccountId: parseInt(direct.expenseAccountId, 10),
        netAmount: dNet,
        vatRate: parseFloat(direct.vatRate) || 0,
        supplierInvoiceNo: direct.supplierInvoiceNo.trim(),
        supplierTrn: direct.supplierTrn.trim() || undefined,
        billDate: direct.billDate,
        dueDate: direct.dueDate || undefined,
        attachmentPath: direct.attachmentPath || undefined,
        notes: direct.notes.trim() || undefined,
      });
      setDirectOpen(false);
      setTab('bills');
      setSuccess('Supplier bill recorded. It is payable under the supplier until you pay it.');
      await load();
    } catch (e) {
      setDirectError(e.message || 'Failed to record the bill');
    } finally {
      setDirectSaving(false);
    }
  };

  // ---- Record bill ----
  const openBill = (po) => {
    setBillPo(po);
    setBillError('');
    setBillForm({
      supplierInvoiceNo: '',
      supplierTrn: po.supplier?.vat_number || '',
      billDate: today(),
      dueDate: '',
      subtotal: String(po.unbilled_amount ?? ''),
      vatMode: '5',
      vatAmount: '',
      attachmentPath: '',
      attachmentName: '',
      notes: '',
    });
  };
  const setBill = (k) => (e) => setBillForm((f) => ({ ...f, [k]: e.target.value }));
  const billVat = billForm.vatMode === 'manual'
    ? (parseFloat(billForm.vatAmount) || 0)
    : billForm.vatMode === '0'
      ? 0
      : Math.round((parseFloat(billForm.subtotal) || 0) * 5) / 100;
  const billTotal = (parseFloat(billForm.subtotal) || 0) + billVat;

  const uploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await apiService.uploadCertificateAttachment(file);
      setBillForm((f) => ({ ...f, attachmentPath: res.data.path, attachmentName: file.name }));
    } catch (err) {
      setBillError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveBill = async () => {
    if (!billForm.supplierInvoiceNo.trim()) { setBillError('Supplier invoice number is required'); return; }
    if (!billForm.billDate) { setBillError('Bill date is required'); return; }
    if (billForm.dueDate && billForm.dueDate < billForm.billDate) { setBillError('Due date cannot be before the bill date'); return; }
    if (!(parseFloat(billForm.subtotal) > 0)) { setBillError('Amount (excluding VAT) must be greater than zero'); return; }
    try {
      setBillSaving(true);
      setBillError('');
      await apiService.createVendorBill({
        purchaseOrderId: billPo.id,
        supplierInvoiceNo: billForm.supplierInvoiceNo.trim(),
        supplierTrn: billForm.supplierTrn.trim() || undefined,
        billDate: billForm.billDate,
        dueDate: billForm.dueDate || undefined,
        subtotal: parseFloat(billForm.subtotal),
        vatAmount: billVat,
        attachmentPath: billForm.attachmentPath || undefined,
        notes: billForm.notes || undefined,
      });
      setBillPo(null);
      setSuccess('Vendor bill recorded');
      await load();
    } catch (e) {
      setBillError(e.message || 'Failed to record bill');
    } finally {
      setBillSaving(false);
    }
  };

  // ---- Pay selected ----
  const selectedBills = useMemo(() => bills.filter((b) => selected[b.id]), [bills, selected]);
  const selectedParty = selectedBills[0] ? partyKey(selectedBills[0]) : null;

  const toggle = (b) => setSelected((s) => {
    const next = { ...s };
    if (next[b.id]) delete next[b.id]; else next[b.id] = true;
    return next;
  });

  const openPay = () => {
    const amounts = {};
    selectedBills.forEach((b) => { amounts[b.id] = String(b.balance_due); });
    setPayAmounts(amounts);
    setPayForm({ accountId: '', method: 'Bank transfer', date: today(), ref: '', notes: '' });
    setNegativeOk(false);
    setPayError('');
    setPayOpen(true);
  };

  const payTotal = selectedBills.reduce((s, b) => s + (parseFloat(payAmounts[b.id]) || 0), 0);

  const savePay = async () => {
    if (!payForm.accountId) { setPayError('Select the bank / cash account the payment is made from'); return; }
    if (overdrawInfo(allAccounts, payForm.accountId, payTotal) && !negativeOk) { setPayError('This payment takes the account below zero. Tick "Pay anyway" to continue.'); return; }
    for (const b of selectedBills) {
      const amt = parseFloat(payAmounts[b.id]) || 0;
      if (!(amt > 0)) { setPayError(`Enter an amount for ${b.bill_number}`); return; }
      if (amt > b.balance_due + 0.01) { setPayError(`Amount for ${b.bill_number} exceeds its balance`); return; }
    }
    try {
      setPaySaving(true);
      setPayError('');
      await apiService.payVendorBills({
        allocations: selectedBills.map((b) => ({ billId: b.id, amount: parseFloat(payAmounts[b.id]) })),
        paymentAccountId: parseInt(payForm.accountId, 10),
        paymentMethod: payForm.method,
        paymentDate: payForm.date,
        referenceNo: payForm.ref || undefined,
        notes: payForm.notes || undefined,
        confirmNegative: negativeOk || undefined,
      });
      setPayOpen(false);
      setSelected({});
      setSuccess(`Supplier payment of AED ${fmt(payTotal)} recorded`);
      await load();
    } catch (e) {
      setPayError(e.message || 'Failed to record payment');
    } finally {
      setPaySaving(false);
    }
  };

  const headCell = { fontWeight: 700 };

  return (
    <PageContainer title="Vendor Bills" description="Record supplier invoices and pay them">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.15), color: 'secondary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconReceipt size={20} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700}>Vendor Bills</Typography>
            <Typography variant="body2" color="text.secondary">
              PO approved → accrued · bill recorded → Accounts Payable · payment → bank
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => { setDirect(emptyDirect()); setDirectError(''); setDirectOpen(true); }}
            sx={{ borderRadius: 2 }}
          >
            New supplier bill
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab value="awaiting" label={`Awaiting bill (${awaiting.length})`} />
            <Tab value="bills" label="Bills" />
          </Tabs>

          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : tab === 'awaiting' ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={headCell}>PO #</TableCell>
                    <TableCell sx={headCell}>Party</TableCell>
                    <TableCell sx={headCell}>Deal</TableCell>
                    <TableCell sx={headCell} align="right">PO total</TableCell>
                    <TableCell sx={headCell} align="right">Billed</TableCell>
                    <TableCell sx={headCell} align="right">Unbilled</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awaiting.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No purchase orders are waiting for a supplier bill.</TableCell></TableRow>
                  )}
                  {awaiting.map((po) => (
                    <TableRow key={po.id} hover>
                      <TableCell>#{po.id}</TableCell>
                      <TableCell>{po.party_name}</TableCell>
                      <TableCell>{po.deal ? `${po.deal.deal_number || po.deal.id}` : '—'}</TableCell>
                      <TableCell align="right">{fmt(po.po_total)}</TableCell>
                      <TableCell align="right">{fmt(po.billed_amount)}</TableCell>
                      <TableCell align="right"><strong>{fmt(po.unbilled_amount)}</strong></TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" onClick={() => openBill(po)} sx={{ borderRadius: 2 }}>Record bill</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSelected({}); }} sx={{ minWidth: 180 }}>
                  <MenuItem value="unpaid">Unpaid / partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="">All</MenuItem>
                </TextField>
                <Button variant="contained" disabled={selectedBills.length === 0} onClick={openPay} sx={{ borderRadius: 2 }}>
                  Pay selected{selectedBills.length ? ` (${selectedBills.length})` : ''}
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableCell padding="checkbox" />
                      <TableCell sx={headCell}>Bill #</TableCell>
                      <TableCell sx={headCell}>Supplier invoice</TableCell>
                      <TableCell sx={headCell}>Party</TableCell>
                      <TableCell sx={headCell}>For</TableCell>
                      <TableCell sx={headCell}>Bill date</TableCell>
                      <TableCell sx={headCell}>Due</TableCell>
                      <TableCell sx={headCell} align="right">Total</TableCell>
                      <TableCell sx={headCell} align="right">Balance</TableCell>
                      <TableCell sx={headCell}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bills.length === 0 && (
                      <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>No vendor bills.</TableCell></TableRow>
                    )}
                    {bills.map((b) => {
                      const payable = b.status === 'open' || b.status === 'partial';
                      const otherParty = selectedParty && partyKey(b) !== selectedParty;
                      return (
                        <TableRow key={b.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={!!selected[b.id]}
                              disabled={!payable || (otherParty && !selected[b.id])}
                              onChange={() => toggle(b)}
                            />
                          </TableCell>
                          <TableCell>{b.bill_number}</TableCell>
                          <TableCell>
                            {b.supplier_invoice_no}
                            {b.attachment_path && (
                              <Button size="small" component="a" href={apiService.getUploadUrl(b.attachment_path)} target="_blank" sx={{ ml: 1, minWidth: 0 }}>file</Button>
                            )}
                          </TableCell>
                          <TableCell>{b.party_name}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {b.purchase_order_id ? `PO #${b.purchase_order_id}` : b.expenseAccount ? `${b.expenseAccount.code} ${b.expenseAccount.name}` : 'Expense'}
                            </Typography>
                          </TableCell>
                          <TableCell>{b.bill_date?.slice?.(0, 10)}</TableCell>
                          <TableCell>{b.due_date?.slice?.(0, 10) || '—'}</TableCell>
                          <TableCell align="right">{fmt(b.total)}</TableCell>
                          <TableCell align="right"><strong>{fmt(b.balance_due)}</strong></TableCell>
                          <TableCell><Chip size="small" label={b.status} color={STATUS_COLOR[b.status] || 'default'} sx={{ textTransform: 'capitalize' }} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Card>
      </Box>

      {/* New supplier bill (no PO) */}
      <Dialog open={directOpen} onClose={() => !directSaving && setDirectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New supplier bill</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            For an expense that is not paid yet. It posts Dr expense (+ Input VAT) / Cr Accounts Payable and shows as payable under the supplier. Paid expenses go in Add expense.
          </Typography>
          {directError && <Alert severity="error" sx={{ mb: 2 }}>{directError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={suppliers}
              value={direct.supplier}
              onChange={(_, v) => setDirect((f) => ({ ...f, supplier: v, supplierTrn: v?.vat_number || f.supplierTrn }))}
              getOptionLabel={(s) => s.company_name || ''}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(p) => <TextField {...p} required label="Supplier" helperText="Add a new supplier under Clients & Vendors first" />}
            />
            {expenseAccounts.length > 0 && (
              <CascadingAccountSelect
                accounts={expenseAccounts}
                value={direct.expenseAccountId}
                onChange={(id) => setDirect((f) => ({ ...f, expenseAccountId: id }))}
                parentLabel="Expense head"
                childLabel="Expense sub-head"
                size="medium"
              />
            )}
            <Stack direction="row" spacing={2}>
              <TextField required label="Supplier invoice no." value={direct.supplierInvoiceNo} onChange={setD('supplierInvoiceNo')} fullWidth />
              <TextField label="Supplier TRN" value={direct.supplierTrn} onChange={setD('supplierTrn')} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField required type="date" label="Bill date" value={direct.billDate} onChange={setD('billDate')} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="date" label="Due date" value={direct.dueDate} onChange={setD('dueDate')} InputLabelProps={{ shrink: true }} inputProps={{ min: direct.billDate || undefined }} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField required type="number" label="Amount before VAT (AED)" value={direct.netAmount} onChange={setD('netAmount')} inputProps={{ min: 0, step: 'any' }} fullWidth />
              <TextField select label="VAT" value={direct.vatRate} onChange={setD('vatRate')} fullWidth>
                <MenuItem value="5">5%</MenuItem>
                <MenuItem value="0">No VAT</MenuItem>
              </TextField>
              <TextField label="Total (AED)" value={fmt(dTotal)} disabled fullWidth />
            </Stack>
            <Box>
              <Button component="label" size="small" variant="outlined" startIcon={uploading ? <CircularProgress size={14} /> : <IconUpload size={14} />} disabled={uploading} sx={{ borderRadius: 2 }}>
                {direct.attachmentName ? 'Replace attachment' : 'Attach supplier invoice'}
                <input type="file" hidden accept="image/*,application/pdf" onChange={uploadDirectAttachment} />
              </Button>
              {direct.attachmentName && <Chip sx={{ ml: 1.5 }} size="small" label={direct.attachmentName} onDelete={() => setDirect((f) => ({ ...f, attachmentPath: '', attachmentName: '' }))} />}
            </Box>
            <TextField multiline minRows={2} label="Notes" value={direct.notes} onChange={setD('notes')} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setDirectOpen(false)} disabled={directSaving}>Cancel</Button>
          <Button variant="contained" onClick={saveDirect} disabled={directSaving || uploading}>{directSaving ? 'Saving…' : 'Record supplier bill'}</Button>
        </DialogActions>
      </Dialog>

      {/* Record bill */}
      <Dialog open={!!billPo} onClose={() => setBillPo(null)} fullWidth maxWidth="sm">
        <DialogTitle>Record vendor bill — PO #{billPo?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {billPo?.party_name} · unbilled accrual AED {fmt(billPo?.unbilled_amount)}. Posts Dr Accrued Expenses + Dr Input VAT / Cr Accounts Payable.
          </Typography>
          {billError && <Alert severity="error" sx={{ mb: 2 }}>{billError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField required label="Supplier invoice no." value={billForm.supplierInvoiceNo || ''} onChange={setBill('supplierInvoiceNo')} fullWidth />
            <TextField label="Supplier TRN" value={billForm.supplierTrn || ''} onChange={setBill('supplierTrn')} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField required type="date" label="Bill date" value={billForm.billDate || ''} onChange={setBill('billDate')} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="date" label="Due date" value={billForm.dueDate || ''} onChange={setBill('dueDate')} InputLabelProps={{ shrink: true }} inputProps={{ min: billForm.billDate || undefined }} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField required type="number" label="Amount excl. VAT (AED)" value={billForm.subtotal || ''} onChange={setBill('subtotal')} inputProps={{ min: 0, step: 'any' }} fullWidth />
              <TextField select label="VAT" value={billForm.vatMode || '5'} onChange={setBill('vatMode')} fullWidth>
                <MenuItem value="5">5%</MenuItem>
                <MenuItem value="manual">Manual amount</MenuItem>
                <MenuItem value="0">No VAT</MenuItem>
              </TextField>
              {billForm.vatMode === 'manual' && (
                <TextField type="number" label="VAT (AED)" value={billForm.vatAmount || ''} onChange={setBill('vatAmount')} inputProps={{ min: 0, step: 'any' }} fullWidth />
              )}
              <TextField label="Total (AED)" value={fmt(billTotal)} disabled fullWidth />
            </Stack>
            <Box>
              <Button component="label" size="small" variant="outlined" startIcon={uploading ? <CircularProgress size={14} /> : <IconUpload size={14} />} disabled={uploading} sx={{ borderRadius: 2 }}>
                {billForm.attachmentName ? 'Replace attachment' : 'Attach supplier invoice'}
                <input type="file" hidden accept="image/*,application/pdf" onChange={uploadAttachment} />
              </Button>
              {billForm.attachmentName && <Chip sx={{ ml: 1.5 }} size="small" label={billForm.attachmentName} onDelete={() => setBillForm((f) => ({ ...f, attachmentPath: '', attachmentName: '' }))} />}
            </Box>
            <TextField multiline minRows={2} label="Notes" value={billForm.notes || ''} onChange={setBill('notes')} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setBillPo(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveBill} disabled={billSaving || uploading}>{billSaving ? 'Saving…' : 'Record bill'}</Button>
        </DialogActions>
      </Dialog>

      {/* Pay selected */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Pay supplier — {selectedBills[0]?.party_name}</DialogTitle>
        <DialogContent>
          {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedBills.map((b) => (
              <Stack key={b.id} direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 140 }}>{b.bill_number} · {b.supplier_invoice_no}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>Balance {fmt(b.balance_due)}</Typography>
                <TextField
                  size="small" type="number" label="Pay (AED)" value={payAmounts[b.id] ?? ''}
                  onChange={(e) => setPayAmounts((a) => ({ ...a, [b.id]: e.target.value }))}
                  inputProps={{ min: 0, step: 'any' }} fullWidth
                />
              </Stack>
            ))}
            <Typography variant="subtitle2">Total payment: AED {fmt(payTotal)}</Typography>
            {overdrawInfo(allAccounts, payForm.accountId, payTotal) && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                This payment takes the account below zero.
                <Box><Checkbox size="small" checked={negativeOk} onChange={(e) => setNegativeOk(e.target.checked)} /> Pay anyway</Box>
              </Alert>
            )}
            <TextField
              select required label="Pay from account (bank / cash)" value={payForm.accountId}
              onChange={(e) => setPayForm((f) => ({ ...f, accountId: e.target.value }))}
              helperText={bankAccounts.length ? 'Choose the specific bank or cash account — there is no default' : 'No bank or cash accounts found in the chart of accounts'}
              fullWidth
            >
              {bankAccounts.map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField select label="Payment method" value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))} fullWidth>
                {PAYMENT_METHOD_OPTIONS.map((m) => {
                  const v = typeof m === 'string' ? m : m.value;
                  const l = typeof m === 'string' ? m : m.label || m.value;
                  return <MenuItem key={v} value={v}>{l}</MenuItem>;
                })}
              </TextField>
              <TextField type="date" label="Payment date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <TextField label="Reference / cheque no." value={payForm.ref} onChange={(e) => setPayForm((f) => ({ ...f, ref: e.target.value }))} fullWidth />
            <TextField multiline minRows={2} label="Notes" value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePay} disabled={paySaving}>{paySaving ? 'Saving…' : 'Record payment'}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default VendorBills;
