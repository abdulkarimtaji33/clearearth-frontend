import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconPlus, IconUpload, IconPaperclip } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import CascadingAccountSelect from '../../../components/erp/CascadingAccountSelect';
import PayeeSelect, { rememberPayee } from '../../../components/erp/PayeeSelect';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import apiService from '../../../services/api';
import { filterActiveByType } from '../../../utils/accountTree';

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Add Expense = a PAID expense. Posts one entry: Dr expense sub-head (+ Dr 1200 Input VAT) / Cr the
 * cash or bank account it was paid from. Unpaid expenses are entered as supplier bills instead.
 */
const ExpenseCreate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]); // all active accounts (for payment picker)
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [vatRate, setVatRate] = useState('5');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [supplierTrn, setSupplierTrn] = useState('');
  const [attachmentPath, setAttachmentPath] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setAccounts(list.filter((a) => a.is_active));
        setExpenseAccounts(filterActiveByType(list, 'expense'));
      }
    });
  }, []);

  const net = round2(netAmount);
  const vat = round2((net * (parseFloat(vatRate) || 0)) / 100);
  const total = round2(net + vat);
  const hasVat = vat > 0;

  const onAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await apiService.uploadExpenseEvidence(file);
      const path = res.data?.path || res.data?.url || res.path || res.url || '';
      if (!path) throw new Error('Upload failed');
      setAttachmentPath(path);
      setAttachmentName(file.name);
    } catch (err) {
      setError(err.message || 'Could not upload the file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!expenseAccountId) { setError('Select the expense head and sub-head.'); return; }
    if (!(net > 0)) { setError('Enter the amount before VAT (greater than zero).'); return; }
    if (!expenseDate) { setError('Expense date is required.'); return; }
    if (!paymentAccountId) { setError('Select the bank or cash account the expense is paid from.'); return; }
    if (hasVat && (!receiptNo.trim() || !supplierTrn.trim())) {
      setError('Recoverable VAT needs the supplier receipt / invoice number and the supplier TRN.');
      return;
    }
    try {
      setSaving(true);
      const res = await apiService.createAccountsExpense({
        expenseAccountId: parseInt(expenseAccountId, 10),
        netAmount: net,
        vatRate: parseFloat(vatRate) || 0,
        expenseDate,
        paidTo: paidTo.trim() || undefined,
        receiptNo: receiptNo.trim() || undefined,
        supplierTrn: supplierTrn.trim() || undefined,
        attachmentPath: attachmentPath || undefined,
        paymentMethod: paymentMethod.trim() || undefined,
        paymentAccountId: parseInt(paymentAccountId, 10),
        notes: notes.trim() || undefined,
      });
      if (res.success === false) throw new Error(res.message || 'Failed to create expense');
      rememberPayee(paidTo);
      navigate('/erp/accounts/expenses');
    } catch (err) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setSaving(false);
    }
  };

  const field = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <PageContainer title="Add expense" description="Record a paid expense">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/accounts/expenses')} color="inherit">
            Back
          </Button>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPlus size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>Add expense</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={3}>
          For expenses that are already paid. It posts one entry: expense (plus input VAT) against the bank or cash account you choose.
          If it is still unpaid, enter it as a supplier bill instead (Vendor Bills → New supplier bill).
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, maxWidth: 600 }}>
          <CardContent component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              {expenseAccounts.length > 0 && (
                <CascadingAccountSelect
                  accounts={expenseAccounts}
                  value={expenseAccountId}
                  onChange={setExpenseAccountId}
                  parentLabel="Expense head"
                  childLabel="Expense sub-head"
                  helperText="Only active posting accounts from the chart of accounts can be debited"
                />
              )}

              <Divider textAlign="left"><Typography variant="caption" color="text.secondary" fontWeight={700}>AMOUNT</Typography></Divider>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required fullWidth size="small" type="number" inputProps={{ min: 0, step: '0.01' }}
                  label="Amount before VAT (AED)" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} sx={field}
                />
                <TextField select fullWidth size="small" label="VAT" value={vatRate} onChange={(e) => setVatRate(e.target.value)} sx={field}>
                  <MenuItem value="5">5%</MenuItem>
                  <MenuItem value="0">No VAT</MenuItem>
                </TextField>
              </Stack>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">VAT (recoverable)</Typography><Typography variant="body2" fontWeight={700}>AED {fmt(vat)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Total paid</Typography><Typography variant="subtitle2" fontWeight={800}>AED {fmt(total)}</Typography></Stack>
              </Box>

              <TextField
                required fullWidth size="small" type="date" label="Expense date" InputLabelProps={{ shrink: true }}
                value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} sx={field}
              />
              <PayeeSelect value={paidTo} onChange={setPaidTo} label="Paid to" preferVendors />

              <Divider textAlign="left"><Typography variant="caption" color="text.secondary" fontWeight={700}>RECEIPT</Typography></Divider>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth size="small" label="Receipt / invoice no." required={hasVat}
                  value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} sx={field}
                />
                <TextField
                  fullWidth size="small" label="Supplier TRN" required={hasVat}
                  value={supplierTrn} onChange={(e) => setSupplierTrn(e.target.value)} sx={field}
                  helperText={hasVat ? 'Needed to claim the VAT' : undefined}
                />
              </Stack>
              <Box>
                <Button component="label" variant="outlined" size="small" startIcon={attachmentName ? <IconPaperclip size={16} /> : <IconUpload size={16} />} disabled={uploading} sx={{ borderRadius: 2 }}>
                  {uploading ? 'Uploading…' : attachmentName || 'Attach receipt / invoice'}
                  <input hidden type="file" accept="image/*,.pdf" onChange={onAttach} />
                </Button>
              </Box>

              <Divider textAlign="left"><Typography variant="caption" color="text.secondary" fontWeight={700}>PAID FROM</Typography></Divider>
              <PaymentRecordingFields
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentAccountId={paymentAccountId}
                onPaymentAccountChange={setPaymentAccountId}
                accounts={accounts}
                autoPickAccount={false}
                allowAddMethod={false}
              />

              <TextField fullWidth size="small" label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={field} />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" pt={1}>
                <Button color="inherit" onClick={() => navigate('/erp/accounts/expenses')} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save expense'}</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ExpenseCreate;
