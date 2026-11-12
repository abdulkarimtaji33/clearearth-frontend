import React, { useMemo } from 'react';
import { TextField, MenuItem, ListSubheader, Stack } from '@mui/material';
import { accountLabel } from '../../utils/accountTree';

/**
 * Account picker that follows the chart of accounts down as many levels as it goes: choose an account,
 * and if it has sub-accounts a second dropdown appears with them, then a third, and so on
 * (e.g. 1000 Cash -> 1002 Bank Accounts -> 1003 ADCB). `accounts` must already be filtered to the
 * relevant type + active accounts, and may include group (header) accounts; groups are only ever
 * stepping stones, the final value is always a posting account.
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
  const { byId, kids, roots } = useMemo(() => {
    const map = {};
    accounts.forEach((a) => { map[a.id] = a; });
    const childMap = {};
    accounts.forEach((a) => {
      if (a.parent_id != null && map[a.parent_id]) (childMap[a.parent_id] = childMap[a.parent_id] || []).push(a);
    });
    const byCode = (x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true });
    Object.values(childMap).forEach((l) => l.sort(byCode));
    const top = accounts.filter((a) => a.parent_id == null || !map[a.parent_id]).sort(byCode);
    return { byId: map, kids: childMap, roots: top };
  }, [accounts]);

  // Chain of accounts from the top level down to the selected one.
  const path = useMemo(() => {
    const chain = [];
    let cur = value !== '' && value != null ? byId[value] : null;
    let guard = 0;
    while (cur && guard < 20) {
      chain.unshift(cur);
      cur = cur.parent_id != null ? byId[cur.parent_id] : null;
      guard += 1;
    }
    return chain;
  }, [byId, value]);

  // Selecting a group steps down to its first sub-account (repeatedly) so the value is never a group.
  const resolve = (id) => {
    let acc = byId[id];
    let guard = 0;
    while (acc && acc.is_group && (kids[acc.id] || []).length > 0 && guard < 20) {
      acc = kids[acc.id][0];
      guard += 1;
    }
    return String(acc ? acc.id : id);
  };

  // Levels to render: level 0 = top-level accounts; each next level = children of the account chosen above it.
  const levels = [];
  levels.push({ options: roots, parent: null, selected: path[0] || null });
  for (let i = 0; i < path.length; i += 1) {
    const children = kids[path[i].id] || [];
    if (children.length === 0) break;
    levels.push({ options: children, parent: path[i], selected: path[i + 1] || null });
  }

  const sx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <Stack spacing={2}>
      {levels.map((lv, idx) => {
        const parent = lv.parent;
        const direct = parent && !parent.is_group;
        const postable = lv.options.filter((a) => !a.is_group);
        const groups = lv.options.filter((a) => a.is_group);
        const isLast = idx === levels.length - 1;
        const current = lv.selected ? String(lv.selected.id) : direct ? String(parent.id) : '';
        return (
          <TextField
            key={idx}
            select
            fullWidth
            size={size}
            disabled={disabled}
            label={idx === 0 ? parentLabel : idx === 1 ? childLabel : `${childLabel} (level ${idx})`}
            value={current}
            onChange={(e) => onChange(resolve(e.target.value))}
            helperText={isLast ? helperText : undefined}
            sx={sx}
          >
            {direct && (
              <MenuItem value={String(parent.id)}>— {parent.name} (directly) —</MenuItem>
            )}
            {postable.length > 0 && groups.length > 0 && <ListSubheader>Accounts</ListSubheader>}
            {postable.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{accountLabel(a)}</MenuItem>
            ))}
            {groups.length > 0 && <ListSubheader>Account groups — then pick a sub-account</ListSubheader>}
            {groups.map((a) => (
              <MenuItem key={a.id} value={String(a.id)} sx={{ fontWeight: 600 }}>{accountLabel(a)}</MenuItem>
            ))}
          </TextField>
        );
      })}
    </Stack>
  );
};

export default CascadingAccountSelect;
