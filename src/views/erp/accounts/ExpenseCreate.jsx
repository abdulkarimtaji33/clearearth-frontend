import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'utility', label: 'Utility' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'professional', label: 'Professional services' },
  { value: 'other', label: 'Other' },
];

const ExpenseCreate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('other');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(String(amount).replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt < 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (!expenseDate) {
      setError('Expense date is required.');
      return;
    }
    try {
      setSaving(true);
      const res = await apiService.createAccountsExpense({
        category,
        amount: amt,
        expenseDate,
        paidTo: paidTo.trim() || undefined,
        paymentMethod: paymentMethod.trim() || undefined,
        notes: notes.trim() || undefined,
      });
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
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <TextField
                fullWidth
                size="small"
                label="Paid to"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Payment method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
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
