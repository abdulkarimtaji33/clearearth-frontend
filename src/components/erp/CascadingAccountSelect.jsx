import React, { useMemo } from 'react';
import { TextField, MenuItem, ListSubheader, Stack } from '@mui/material';
import { getTopLevelAccounts, getChildAccounts, findTopLevelId, accountLabel } from '../../utils/accountTree';

/**
 * Two-step account picker: choose the parent account, then (only if it has
 * sub-accounts) choose the sub-account in a second dropdown. `accounts`
 * must already be filtered to the relevant type + active accounts, and may
 * include group (header) accounts — those appear only in the parent step.
 */
const CascadingAccountSelect = ({
  accounts = [],
  value,
  onChange,
  parentLabel = 'Account',
  childLabel = 'Sub-account',
  size = 'small',
  helperText,
  disabled = false,
}) => {
  const topLevel = useMemo(() => getTopLevelAccounts(accounts), [accounts]);
  const postableTop = useMemo(() => topLevel.filter((a) => !a.is_group), [topLevel]);
  const groupTop = useMemo(() => topLevel.filter((a) => a.is_group), [topLevel]);
  const selectedTopId = useMemo(() => findTopLevelId(accounts, value), [accounts, value]);
  const selectedTop = topLevel.find((a) => String(a.id) === String(selectedTopId));
  const children = useMemo(() => getChildAccounts(accounts, selectedTopId), [accounts, selectedTopId]);

  const handleTopChange = (topId) => {
    const top = topLevel.find((a) => String(a.id) === String(topId));
    const kids = getChildAccounts(accounts, topId);
    if (kids.length === 0 || (top && !top.is_group)) {
      onChange(String(topId));
    } else {
      onChange(String(kids[0].id));
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        select
        fullWidth
        size={size}
        disabled={disabled}
        label={parentLabel}
        value={selectedTopId || ''}
        onChange={(e) => handleTopChange(e.target.value)}
        helperText={children.length === 0 ? helperText : undefined}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      >
        {postableTop.length > 0 && groupTop.length > 0 && <ListSubheader>Accounts</ListSubheader>}
        {postableTop.map((a) => (
          <MenuItem key={a.id} value={String(a.id)}>{accountLabel(a)}</MenuItem>
        ))}
        {groupTop.length > 0 && <ListSubheader>Account groups — then pick a sub-account</ListSubheader>}
        {groupTop.map((a) => (
          <MenuItem key={a.id} value={String(a.id)} sx={{ fontWeight: 600 }}>{accountLabel(a)}</MenuItem>
        ))}
      </TextField>
      {children.length > 0 && (
        <TextField
          select
          fullWidth
          size={size}
          disabled={disabled}
          label={childLabel}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          helperText={helperText}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        >
          {selectedTop && !selectedTop.is_group && (
            <MenuItem value={String(selectedTop.id)}>— {selectedTop.name} (directly) —</MenuItem>
          )}
          {children.map((a) => (
            <MenuItem key={a.id} value={String(a.id)}>{accountLabel(a)}</MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );
};

export default CascadingAccountSelect;
