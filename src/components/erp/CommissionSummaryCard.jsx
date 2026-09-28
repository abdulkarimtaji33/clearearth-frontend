import React, { useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography, Button, Skeleton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconCoin, IconArrowRight } from '@tabler/icons-react';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getUserRole } from '../../utils/authHelpers';

const SALES_ROLES = ['sales', 'sales_executive', 'sales_manager'];

/**
 * Small commission summary card for the sales dashboard — accrued/paid totals
 * with a link to the full commissions page. Renders nothing for non-sales
 * roles or when there is no commission data at all.
 */
const CommissionSummaryCard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = getUserRole(user);
  const isSales = SALES_ROLES.includes(roleName);

  const [loading, setLoading] = useState(isSales);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isSales) return;
    let mounted = true;
    apiService.getMyCommissions({ limit: 1 })
      .then((res) => {
        if (mounted && res.success) setSummary(res.data);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [isSales]);

  if (!isSales) return null;

  if (loading) {
    return <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3, mb: 3 }} />;
  }

  const totalAccrued = summary?.totalAccrued || 0;
  const totalPaid = summary?.totalPaid || 0;
  if (!totalAccrued && !totalPaid) return null;

  return (
    <Paper elevation={0} sx={{
      mb: 3, p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
      background: (t) => t.palette.mode === 'dark' ? alpha(t.palette.success.main, 0.06) : alpha(t.palette.success.main, 0.04),
    }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, bgcolor: 'success.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <IconCoin size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>My Sales Commission</Typography>
            <Stack direction="row" spacing={2.5} mt={0.25}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Accrued</Typography>
                <Typography variant="body2" fontWeight={800} color={theme.palette.warning.dark}>
                  AED {Number(totalAccrued).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Paid</Typography>
                <Typography variant="body2" fontWeight={800} color="success.main">
                  AED {Number(totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
        <Button
          size="small"
          endIcon={<IconArrowRight size={14} />}
          onClick={() => navigate('/erp/commissions/mine')}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', flexShrink: 0 }}
        >
          View details
        </Button>
      </Stack>
    </Paper>
  );
};

export default CommissionSummaryCard;
