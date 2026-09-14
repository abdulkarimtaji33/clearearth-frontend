import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Button, Stack, TextField, Autocomplete, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconCoin, IconWand } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import apiService from '../../../services/api';
import { extractListData } from '../../../utils/reportApi';
import { resolveDefaultPaymentAccountId } from '../../../constants/paymentAccounts';
import {
  RECEIVED_FROM_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
  RECEIVED_FROM_OPTIONS,
} from '../../../constants/expenseFormOptions';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Accounts Receivable → Receive Payment: record one customer receipt and allocate it across
 * multiple outstanding invoices (partial receipts, advance settlement, multi-invoice payoff).
 */
const ReceivePaymentView = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [allocations, setAllocations] = useState({}); // invoiceId -> amount string

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [referenceNo, setReferenceNo] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [customReceivedFrom, setCustomReceivedFrom] = useState(() => loadStoredOptions(RECEIVED_FROM_STORAGE_KEY));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiService.getCompanies({ pageSize: 500 }).then((res) => {
      if (res.success) setCompanies(Array.isArray(res.data) ? res.data : extractListData(res));
    });
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setPaymentAccounts(list.filter((a) => a.is_active));
      }
    });
  }, []);

  const receivedFromOptions = useMemo(
    () => mergeSelectOptions(RECEIVED_FROM_OPTIONS, customReceivedFrom, receivedFrom),
    [customReceivedFrom, receivedFrom]
  );
  const addCustomReceivedFrom = useCallback((v) => {
    setCustomReceivedFrom((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(RECEIVED_FROM_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const defaultPayAccountId = useMemo(
    () => resolveDefaultPaymentAccountId(paymentAccounts, paymentMethod),
    [paymentAccounts, paymentMethod]
  );

  const fetchInvoices = useCallback(async (companyId) => {
    if (!companyId) { setInvoices([]); setAllocations({}); return; }
    try {
      setInvoicesLoading(true);
      setError('');
      const res = await apiService.getReceivables({ companyId, pageSize: 200 });
      const rows = Array.isArray(res.data) ? res.data : extractListData(res);
      setInvoices(rows);
      setAllocations({});
    } catch (e) {
      setError(e.message || 'Failed to load outstanding invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    setReceivedFrom(company?.company_name || '');
    fetchInvoices(company?.id);
  };

  const setAllocation = (invoiceId, value) => {
    setAllocations((prev) => ({ ...prev, [invoiceId]: value }));
  };

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [allocations]
  );
  const receivedNum = parseFloat(amountReceived) || 0;
  const remaining = receivedNum - totalAllocated;

  // Convenience: apply the entered amount across invoices, oldest first, capped at each balance.
  const autoAllocate = () => {
    let left = receivedNum;
    const next = {};
    for (const inv of invoices) {
      const bal = parseFloat(inv.balance_due) || 0;
      if (left <= 0.005 || bal <= 0.005) continue;
      const apply = Math.min(bal, left);
      next[inv.id] = apply.toFixed(2);
      left -= apply;
    }
    setAllocations(next);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!selectedCompany) { setError('Select a customer.'); return; }
    if (receivedNum <= 0) { setError('Enter the amount received.'); return; }
    const allocationList = Object.entries(allocations)
      .map(([taxInvoiceId, amount]) => ({ taxInvoiceId: parseInt(taxInvoiceId, 10), amount: parseFloat(amount) }))
      .filter((a) => Number.isFinite(a.amount) && a.amount > 0);
    if (allocationList.length === 0) { setError('Apply the receipt to at least one invoice.'); return; }
    if (Math.abs(remaining) > 0.01) {
      setError(`Allocated total (AED ${fmt(totalAllocated)}) must match the amount received (AED ${fmt(receivedNum)}).`);
      return;
    }

    try {
      setSaving(true);
      const res = await apiService.receiveCustomerPayment({
        companyId: selectedCompany.id,
        paymentDate,
        paymentMethod,
        paymentAccountId: paymentAccountId ? parseInt(paymentAccountId, 10) : undefined,
        referenceNo: referenceNo || undefined,
        receivedFrom: receivedFrom || undefined,
        allocations: allocationList,
      });
      if (res.success) {
        setSuccess(`Payment received and applied to ${allocationList.length} invoice(s).`);
        setAmountReceived('');
        setReferenceNo('');
        await fetchInvoices(selectedCompany.id);
      }
    } catch (e) {
      setError(e.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Receive Payment" description="Receive a customer payment and allocate it across outstanding invoices">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<IconArrowLeft size={18} />} variant="outlined" onClick={() => navigate('/erp/receivables')} sx={{ borderRadius: 2 }}>
          Back
        </Button>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.15), color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCoin size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Receive Payment</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>Receipt details</Typography>
        <Stack spacing={2}>
          <Autocomplete
            options={companies}
            getOptionLabel={(opt) => opt.company_name || ''}
            value={selectedCompany}
            onChange={(_, val) => handleCompanyChange(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            renderInput={(params) => (
              <TextField {...params} label="Customer" placeholder="Select customer…" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Amount received"
              type="number"
              size="small"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Payment date"
              type="date"
              size="small"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Reference / cheque no."
              size="small"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
          <PaymentRecordingFields
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            paymentAccountId={paymentAccountId || defaultPayAccountId}
            onPaymentAccountChange={setPaymentAccountId}
            accounts={paymentAccounts}
            showReceivedFrom
            receivedFrom={receivedFrom}
            onReceivedFromChange={setReceivedFrom}
            receivedFromOptions={receivedFromOptions}
            onReceivedFromAdded={addCustomReceivedFrom}
          />
        </Stack>
      </Card>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
          <Typography variant="subtitle2" fontWeight={800}>Allocate to outstanding invoices</Typography>
          <Button size="small" startIcon={<IconWand size={14} />} onClick={autoAllocate} disabled={!selectedCompany || receivedNum <= 0 || invoices.length === 0} sx={{ borderRadius: 2 }}>
            Auto-allocate (oldest first)
          </Button>
        </Stack>
        {!selectedCompany ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Select a customer to see their outstanding invoices</Typography>
          </Box>
        ) : invoicesLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No outstanding invoices for this customer</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Balance due</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 160 }}>Apply amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const bal = parseFloat(inv.balance_due) || 0;
                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.tax_invoice_number}</TableCell>
                      <TableCell>{inv.invoice_date || '—'}</TableCell>
                      <TableCell>{inv.due_date || '—'}</TableCell>
                      <TableCell align="right">{inv.currency || 'AED'} {fmt(bal)}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: bal, step: '0.01', style: { textAlign: 'right' } }}
                          value={allocations[inv.id] ?? ''}
                          onChange={(e) => setAllocation(inv.id, e.target.value)}
                          sx={{ width: 140 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {selectedCompany && invoices.length > 0 && (
          <>
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.75 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2" color="text.secondary">Allocated: <strong>AED {fmt(totalAllocated)}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Received: <strong>AED {fmt(receivedNum)}</strong></Typography>
                <Chip
                  size="small"
                  label={Math.abs(remaining) < 0.01 ? 'Balanced' : `Unapplied: AED ${fmt(remaining)}`}
                  color={Math.abs(remaining) < 0.01 ? 'success' : 'warning'}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Button variant="contained" color="warning" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
                {saving ? <CircularProgress size={20} /> : 'Save receipt'}
              </Button>
            </Stack>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default ReceivePaymentView;
