import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import SelectWithAddNew from '../../../components/erp/SelectWithAddNew';
import CascadingAccountSelect from '../../../components/erp/CascadingAccountSelect';
import PayeeSelect, { rememberPayee } from '../../../components/erp/PayeeSelect';
import PaymentRecordingFields from '../../../components/erp/PaymentRecordingFields';
import apiService from '../../../services/api';
import { PAYMENT_METHOD_OPTIONS } from '../../../constants/paymentMethods';
import { filterActiveByType, isPostable } from '../../../utils/accountTree';
import {
  PAYMENT_METHOD_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../../constants/expenseFormOptions';

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
  const [customPaymentMethods, setCustomPaymentMethods] = useState(() => loadStoredOptions(PAYMENT_METHOD_STORAGE_KEY));
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]); // same chart-of-accounts feed the Record payment dialog uses
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [expenseAccountTouched, setExpenseAccountTouched] = useState(false);

  useEffect(() => {
    apiService.getChartOfAccounts({}).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setExpenseAccounts(filterActiveByType(list, 'expense'));
        setAllAccounts(list.filter((a) => a.is_active));
      }
    });
  }, []);

  // Default the account from the selected category's own default account, but don't clobber
  // an explicit user choice. Group accounts are never valid defaults.
  useEffect(() => {
    if (expenseAccountTouched || expenseAccounts.length === 0) return;
    const cat = categories.find((c) => c.value === category);
    const match = cat?.default_account_id
      ? expenseAccounts.filter(isPostable).find((a) => String(a.id) === String(cat.default_account_id))
      : null;
    setExpenseAccountId(match ? String(match.id) : '');
  }, [category, categories, expenseAccounts, expenseAccountTouched]);

  // Standard categories may only use their own account group (Fuel -> Fuel & Transport accounts).
  // "Other" and custom categories can use any expense account.
  const RESTRICTED_CATEGORIES = ['travel', 'utility', 'fuel', 'materials', 'equipment', 'professional'];
  const categoryScope = useMemo(() => {
    const cat = categories.find((c) => c.value === category);
    if (!cat || !RESTRICTED_CATEGORIES.includes(cat.value) || !cat.default_account_id) return null;
    const def = expenseAccounts.find((a) => String(a.id) === String(cat.default_account_id));
    if (!def) return null;
    const group = def.parent_id ? expenseAccounts.find((a) => a.id === def.parent_id) : null;
    const allowed = def.parent_id
      ? expenseAccounts.filter((a) => a.id === def.parent_id || a.parent_id === def.parent_id)
      : [def];
    return { allowed, label: group ? `${group.code} ${group.name}` : `${def.code} ${def.name}`, categoryName: cat.name };
  }, [categories, category, expenseAccounts]);

  const pickableAccounts = categoryScope ? categoryScope.allowed : expenseAccounts;

  const handleCategoryChange = (value) => {
    setCategory(value);
    setExpenseAccountTouched(false); // re-apply the new category's own default account
  };

  const paymentMethodOptions = useMemo(
    () => mergeSelectOptions(PAYMENT_METHOD_OPTIONS, customPaymentMethods, paymentMethod),
    [customPaymentMethods, paymentMethod]
  );

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
    if (paidAmount !== '' && paid > 0) {
      if (!paidTo.trim()) {
        setError('Enter who this expense was paid to.');
        return;
      }
      if (!paymentAccountId) {
        setError('Select the bank or cash account the money was paid from.');
        return;
      }
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
      if (paidAmount !== '' && paid > 0) payload.paymentAccountId = parseInt(paymentAccountId, 10);
      const res = await apiService.createAccountsExpense(payload);
      if (res.success === false) throw new Error(res.message || 'Failed to create expense');
      rememberPayee(paidTo);
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
                onChange={handleCategoryChange}
                options={categoryOptions}
                allowEmpty={false}
                addDialogTitle="Add expense category"
                addDialogDescription="Add a new category for manual expenses"
                addFieldLabel="Category name"
                onOptionAdded={addExpenseCategory}
              />
              {expenseAccounts.length > 0 && (
                <CascadingAccountSelect
                  accounts={pickableAccounts}
                  value={expenseAccountId}
                  onChange={(id) => { setExpenseAccountId(id); setExpenseAccountTouched(true); }}
                  parentLabel="Expense account"
                  childLabel="Expense sub-account"
                  helperText={
                    categoryScope
                      ? `${categoryScope.categoryName} expenses can only use ${categoryScope.label} accounts`
                      : 'GL account debited by this expense — defaults from the category'
                  }
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
              <PayeeSelect
                value={paidTo}
                onChange={setPaidTo}
                label="Paid to"
                preferVendors={['fuel', 'materials', 'equipment', 'professional', 'utility', 'travel'].includes(category)}
              />
              <PaymentRecordingFields
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentAccountId={paymentAccountId}
                onPaymentAccountChange={setPaymentAccountId}
                accounts={allAccounts}
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
