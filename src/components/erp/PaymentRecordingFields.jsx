import React, { useMemo, useEffect, useCallback } from 'react';
import {
  Box,
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
} from '../../constants/paymentAccounts';
import { isPostable } from '../../utils/accountTree';

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
  allowAddMethod = true,
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
  // Only a default when there is exactly one cash/bank account; with several, the user picks the bank.
  const postableAccounts = paymentAccounts.filter(isPostable);
  const defaultAccount = postableAccounts.length === 1 ? postableAccounts[0] : null;

  const addCustomPaymentMethod = useCallback((v) => {
    setCustomPaymentMethods((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      saveStoredOptions(PAYMENT_METHOD_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Only re-suggest the default account when the payment method (or account
  // list) changes — NOT when paymentAccountId changes, since that includes
  // the user's own manual selection, which would otherwise get immediately
  // overwritten back to the default on every pick (paymentAccountId is
  // intentionally excluded from the dependency array for this reason).
  useEffect(() => {
    if (!autoPickAccount || !onPaymentAccountChange) return;
    const nextId = resolveDefaultPaymentAccountId(accounts, paymentMethod);
    if (nextId && String(paymentAccountId) !== String(nextId)) {
      onPaymentAccountChange(String(nextId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, accounts, autoPickAccount, onPaymentAccountChange]);

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
        hideAdd={!allowAddMethod}
      />

      {paymentAccounts.length > 0 && onPaymentAccountChange && (
        <Box>
          <TextField
            select
            fullWidth
            size="small"
            label="Deposit / pay from account"
            value={paymentAccountId ? String(paymentAccountId) : ''}
            onChange={(e) => onPaymentAccountChange(e.target.value)}
            helperText={
              defaultAccount
                ? `Only cash/bank account: ${accountLabel(defaultAccount)}`
                : 'Required — choose the specific cash or bank account this amount posts to'
            }
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {postableAccounts.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{accountLabel(a)}</MenuItem>
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
