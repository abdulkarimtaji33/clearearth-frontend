import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography, LinearProgress } from '@mui/material';
import { IconBeach } from '@tabler/icons-react';
import apiService from '../../../../../../services/api';
import { SectionCard, LoadingBlock, EmptyState } from '../../../components/HrUi';

const num = (v) => parseFloat(v) || 0;

/**
 * Leave balances for the current year. HR mode reads GET /hr/leave/balances/:employeeId, which needs
 * a leave permission; if the caller lacks it the card simply stays hidden.
 */
const LeaveBalancesCard = ({ employeeId, isSelf }) => {
  const [balances, setBalances] = useState(null);
  const [hidden, setHidden] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;
    const call = isSelf ? apiService.getMyLeaveBalances(year) : apiService.getHrLeaveBalances(employeeId, year);
    call
      .then((res) => { if (!cancelled) setBalances(res.data || []); })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, [employeeId, isSelf, year]);

  if (hidden) return null;

  return (
    <SectionCard icon={IconBeach} title="Leave balances" subtitle={String(year)}>
      {balances === null ? (
        <LoadingBlock py={3} />
      ) : balances.length === 0 ? (
        <EmptyState compact icon={IconBeach} message="No leave entitlements allocated for this year." />
      ) : (
        <Stack spacing={1.75}>
          {balances.map((b) => {
            const total = num(b.entitled_days) + num(b.accrued_days);
            const used = num(b.used_days);
            const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
            return (
              <Box key={b.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.5}>
                  <Typography variant="body2" fontWeight={600}>{b.leaveType?.name || 'Leave'}</Typography>
                  <Typography variant="caption" color="text.secondary">{total - used} left of {total} days</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
};

export default LeaveBalancesCard;
