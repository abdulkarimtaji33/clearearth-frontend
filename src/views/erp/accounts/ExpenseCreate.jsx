import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import SelectWithAddNew from '../../../components/erp/SelectWithAddNew';
import CascadingAccountSelect from '../../../components/erp/CascadingAccountSelect';
import apiService from '../../../services/api';
import { PAYMENT_METHOD_OPTIONS } from '../../../constants/paymentMethods';
import { filterActiveByType, isPostable } from '../../../utils/accountTree';
import {
  PAID_TO_OPTIONS,
  PAID_TO_STORAGE_KEY,
  PAYMENT_METHOD_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../../constants/expenseFormOptions';

/** Mirrors chartOfAccounts.service.EXPENSE_CATEGORY_TO_CODE on the backend */
const EXPENSE_CATEGORY_TO_CODE = {
  work_orders: '5000',
  materials: '5200',
  equipment: '5200',
  professional: '5300',
  travel: '5400',
  fuel: '5400',
  utility: '5500',
  other: '5100',
};

const ExpenseCreate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('other');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [customPaidTo, setCustomPaidTo] = useState(() => loadStoredOptions(PAID_TO_STORAGE_KEY));
  const [customPaymentMethods, setCustomPaymentMethods] = useState(() => loadStoredOptions(PAYMENT_METHOD_STORAGE_KEY));
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [expenseAccountTouched, setExpenseAccountTouched] = useState(false);

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setExpenseAccounts(filterActiveByType(list, 'expense'));
      }
    });
  }, []);

  // Default the account from the category map, but don't clobber an explicit user choice.
  // Only postable (non-group) accounts are valid defaults/leaves.
  useEffect(() => {
    if (expenseAccountTouched || expenseAccounts.length === 0) return;
    const postable = expenseAccounts.filter(isPostable);
    const code = EXPENSE_CATEGORY_TO_CODE[category] || '5100';
    const match = postable.find((a) => String(a.code) === code) || postable[0];
    if (match) setExpenseAccountId(String(match.id));
  }, [category, expenseAccounts, expenseAccountTouched]);

  const paidToOptions = useMemo(
    () => mergeSelectOptions(PAID_TO_OPTIONS, customPaidTo, paidTo),
    [customPaidTo, paidTo]
  );

  const paymentMethodOptions = useMemo(
    () => mergeSelectOptions(PAYMENT_METHOD_OPTIONS, customPaymentMethods, paymentMethod),
    [customPaymentMethods, paymentMethod]
  );

  const addCustomPaidTo = useCallback((v) => {
    setCustomPaidTo((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAID_TO_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.value, label: c.name })),
    [categories]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiService.getExpenseCategories({ activeOnly: true });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setCategories(list);
        if (list.length > 0 && !list.some((c) => c.value === category)) {
          setCategory(list.find((c) => c.value === 'other')?.value || list[0].value);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [category]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addExpenseCategory = useCallback(async (name) => {
    const res = await apiService.createExpenseCategory({ name });
    if (res.success && res.data) {
      setCategories((prev) => [...prev, res.data]);
      setCategory(res.data.value);
    } else {
      throw new Error(res.message || 'Failed to add category');
    }
  }, []);

  const addCustomPaymentMethod = useCallback((v) => {
    setCustomPaymentMethods((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAYMENT_METHOD_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(String(amount).replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (!expenseDate) {
      setError('Expense date is required.');
      return;
    }
    const paid = paidAmount !== '' ? parseFloat(String(paidAmount).replace(/,/g, '')) : 0;
    if (paidAmount !== '' && (!Number.isFinite(paid) || paid < 0 || paid > amt)) {
      setError('Paid amount must be between 0 and the expense total.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        category,
        amount: amt,
        expenseDate,
        paidTo: paidTo.trim() || undefined,
        paymentMethod: paymentMethod.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (paidAmount !== '') payload.paidAmount = paid;
      if (paidAt) payload.paidAt = paidAt;
      if (expenseAccountId) payload.expenseAccountId = parseInt(expenseAccountId, 10);
      const res = await apiService.createAccountsExpense(payload);
      if (res.success === false) throw new Error(res.message || 'Failed to create expense');
      navigate('/erp/accounts/expenses');
    } catch (err) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Add expense" description="Post a manual ledger entry">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Button
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => navigate('/erp/accounts/expenses')}
            color="inherit"
          >
            Back
          </Button>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: 'success.dark',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPlus size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            Add expense
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, maxWidth: 560 }}>
          <CardContent component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <SelectWithAddNew
                label="Category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                allowEmpty={false}
                addDialogTitle="Add expense category"
                addDialogDescription="Add a new category for manual expenses"
                addFieldLabel="Category name"
                onOptionAdded={addExpenseCategory}
              />
              {expenseAccounts.length > 0 && (
                <CascadingAccountSelect
                  accounts={expenseAccounts}
                  value={expenseAccountId}
                  onChange={(id) => { setExpenseAccountId(id); setExpenseAccountTouched(true); }}
                  parentLabel="Expense account"
                  childLabel="Expense sub-account"
                  helperText="GL account debited by this expense — defaults from the category"
                />
              )}
              <TextField
                required
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                label="Amount (AED)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required
                fullWidth
                size="small"
                type="date"
                label="Expense date"
                InputLabelProps={{ shrink: true }}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <SelectWithAddNew
                label="Paid to"
                value={paidTo}
                onChange={setPaidTo}
                options={paidToOptions}
                addDialogTitle="Add payee"
                addDialogDescription="Add a new payee name for this and future expenses"
                addFieldLabel="Payee name"
                onOptionAdded={addCustomPaidTo}
              />
              <SelectWithAddNew
                label="Payment method"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={paymentMethodOptions}
                addDialogTitle="Add payment method"
                addDialogDescription="Add a custom payment method for this and future expenses"
                addFieldLabel="Payment method"
                onOptionAdded={addCustomPaymentMethod}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                label="Amount paid now (AED)"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                helperText="Settlement status is set automatically from the amount paid"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {paidAmount !== '' && parseFloat(paidAmount) > 0 && (
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Payment date (optional)"
                  InputLabelProps={{ shrink: true }}
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" pt={1}>
                <Button color="inherit" onClick={() => navigate('/erp/accounts/expenses')} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Saving…' : 'Save expense'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ExpenseCreate;
