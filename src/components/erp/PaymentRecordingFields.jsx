import React, { useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SelectWithAddNew from './SelectWithAddNew';
import { PAYMENT_METHOD_OPTIONS } from '../../constants/paymentMethods';
import {
  PAYMENT_METHOD_STORAGE_KEY,
  loadStoredOptions,
  saveStoredOptions,
  mergeSelectOptions,
} from '../../constants/expenseFormOptions';
import {
  filterPaymentAccounts,
  resolveDefaultPaymentAccountId,
  accountLabel,
  defaultAccountCodeForMethod,
} from '../../constants/paymentAccounts';

/**
 * Shared payment method dropdown + GL account picker for record-payment dialogs.
 */
const PaymentRecordingFields = ({
  paymentMethod,
  onPaymentMethodChange,
  paymentAccountId,
  onPaymentAccountChange,
  accounts = [],
  autoPickAccount = true,
  showPaidOn = false,
  paidOn,
  onPaidOnChange,
  showReceivedFrom = false,
  receivedFrom,
  onReceivedFromChange,
  receivedFromOptions = [],
  onReceivedFromAdded,
  showPaidTo = false,
  paidTo,
  onPaidToChange,
  paidToOptions = [],
  onPaidToAdded,
}) => {
  const theme = useTheme();
  const [customPaymentMethods, setCustomPaymentMethods] = React.useState(() => loadStoredOptions(PAYMENT_METHOD_STORAGE_KEY));

  const paymentMethodOptions = useMemo(
    () => mergeSelectOptions(PAYMENT_METHOD_OPTIONS, customPaymentMethods, paymentMethod),
    [customPaymentMethods, paymentMethod]
  );

  const paymentAccounts = useMemo(() => filterPaymentAccounts(accounts), [accounts]);
  const defaultCode = defaultAccountCodeForMethod(paymentMethod);
  const defaultAccount = paymentAccounts.find((a) => String(a.code) === defaultCode);

  const addCustomPaymentMethod = useCallback((v) => {
    setCustomPaymentMethods((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAYMENT_METHOD_STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!autoPickAccount || !onPaymentAccountChange) return;
    const nextId = resolveDefaultPaymentAccountId(accounts, paymentMethod);
    if (nextId && String(paymentAccountId) !== String(nextId)) {
      onPaymentAccountChange(String(nextId));
    }
  }, [paymentMethod, accounts, autoPickAccount, onPaymentAccountChange, paymentAccountId]);

  const selectedAccount = paymentAccounts.find((a) => String(a.id) === String(paymentAccountId));
  const isDefaultAccount = selectedAccount && defaultAccount && String(selectedAccount.id) === String(defaultAccount.id);

  return (
    <Stack spacing={2}>
      <SelectWithAddNew
        label="Payment method"
        value={paymentMethod}
        onChange={onPaymentMethodChange}
        options={paymentMethodOptions}
        allowEmpty={false}
        emptyLabel="Select method"
        addDialogTitle="Add payment method"
        addDialogDescription="Add a custom payment method for this and future payments"
        addFieldLabel="Payment method"
        onOptionAdded={addCustomPaymentMethod}
      />

      {paymentAccounts.length > 0 && onPaymentAccountChange && (
        <Box>
          <TextField
            select
            size="small"
            fullWidth
            label="Deposit / pay from account"
            value={paymentAccountId || ''}
            onChange={(e) => onPaymentAccountChange(e.target.value)}
            helperText={
              defaultAccount
                ? `Default for ${paymentMethod || 'this method'}: ${accountLabel(defaultAccount)}`
                : 'Choose which cash or bank account this amount posts to'
            }
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {paymentAccounts.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>
                {accountLabel(a)}
                {String(a.code) === defaultCode ? ' (default)' : ''}
              </MenuItem>
            ))}
          </TextField>
          {selectedAccount && (
            <Chip
              size="small"
              label={isDefaultAccount ? 'Using default account' : 'Custom account selected'}
              color={isDefaultAccount ? 'default' : 'primary'}
              variant="outlined"
              sx={{
                mt: 1,
                fontWeight: 600,
                bgcolor: alpha(isDefaultAccount ? theme.palette.grey[500] : theme.palette.primary.main, 0.08),
              }}
            />
          )}
        </Box>
      )}

      {showPaidOn && onPaidOnChange && (
        <TextField
          size="small"
          label="Paid on"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={paidOn || ''}
          onChange={(e) => onPaidOnChange(e.target.value)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}

      {showReceivedFrom && onReceivedFromChange && (
        <SelectWithAddNew
          label="Received from"
          value={receivedFrom || ''}
          onChange={onReceivedFromChange}
          options={receivedFromOptions}
          allowEmpty
          emptyLabel="Optional"
          addDialogTitle="Add payer"
          addDialogDescription="Add a payer name for receipts"
          addFieldLabel="Payer name"
          onOptionAdded={onReceivedFromAdded}
        />
      )}

      {showPaidTo && onPaidToChange && (
        <SelectWithAddNew
          label="Paid to"
          value={paidTo || ''}
          onChange={onPaidToChange}
          options={paidToOptions}
          allowEmpty
          emptyLabel="Optional"
          addDialogTitle="Add payee"
          addFieldLabel="Payee name"
          onOptionAdded={onPaidToAdded}
        />
      )}
    </Stack>
  );
};

export default PaymentRecordingFields;
