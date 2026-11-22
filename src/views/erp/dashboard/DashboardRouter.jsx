import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import apiService from '../../../services/api';
import PageContainer from '../../../components/container/PageContainer';
import AdminDashboard from './AdminDashboard';
import SalesDashboard from './SalesDashboard';
import SalesManagerDashboard from './SalesManagerDashboard';
import InspectionDashboard from './InspectionDashboard';
import OperationsDashboard from './OperationsDashboard';
import DriverPickupList from '../driver/DriverPickupList';
import SuperAdminDashboard from './SuperAdminDashboard';
import AccountsDashboard from './AccountsDashboard';
import HrDashboardWidgets from '../hr/HrDashboardWidgets';
import DateRangeFilter, { DEFAULT_RANGE, rangeToParams } from './shared/DateRangeFilter';

// Which dashboard a user gets is decided by their dashboard.view_* permissions (first match wins),
// matching the server's choice of data — configurable per role in Roles & Access.
const VARIANTS = [
  ['dashboard.view_super_admin', SuperAdminDashboard, 'super_admin'],
  ['dashboard.view_admin', AdminDashboard, 'admin'],
  ['dashboard.view_operations', OperationsDashboard, 'operations_manager'],
  ['dashboard.view_accounts', AccountsDashboard, 'accounts'],
  ['dashboard.view_sales_manager', SalesManagerDashboard, 'sales_manager'],
  ['dashboard.view_inspection', InspectionDashboard, 'inspection_team'],
  ['dashboard.view_driver', DriverPickupList, 'driver'],
  ['dashboard.view_sales', SalesDashboard, 'sales'],
];

const DashboardRouter = () => {
  const { user, hasPermission } = useAuth();
  const { on, connected } = useSocket() || {};
  const variant = VARIANTS.find(([perm]) => hasPermission(perm)) || [null, SalesDashboard, 'sales'];
  const roleName = variant[2];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE); // one date filter for the whole dashboard (default: this month)
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const silentRefresh = useCallback(() => {
    apiService.getDashboardOverview(rangeToParams(range)).then((res) => {
      if (isMounted.current && res.success) setData(res.data);
    }).catch(() => {});
  }, [range]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getDashboardOverview(rangeToParams(range));
      if (isMounted.current) {
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load dashboard');
      }
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Real-time refresh on socket notification (e.g. approval requests for sales manager)
  useEffect(() => {
    if (!connected || !on) return;
    const off = on('notification', silentRefresh);
    return off;
  }, [connected, on, silentRefresh]);

  // Polling fallback every 7s for roles that care about live data
  useEffect(() => {
    const POLLING_ROLES = ['sales_manager', 'inspection_team', 'accounts', 'operations_manager'];
    if (!POLLING_ROLES.includes(roleName)) return;
    const interval = setInterval(silentRefresh, 7000);
    return () => clearInterval(interval);
  }, [roleName, silentRefresh]);

  const Component = variant[1];
  const isAdmin = roleName === 'admin';
  const showHr = hasPermission('hr.employees.manage');
  const filter = <DateRangeFilter value={range} onChange={setRange} />;
  const hrSlot = showHr ? <HrDashboardWidgets range={range} /> : null;

  return (
    <PageContainer title="Dashboard" description="Your workspace overview">
      {loading && !data ? (
        <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {!isAdmin && showHr && <Box mb={2}>{filter}</Box>}
          {!isAdmin && hrSlot}
          <Component
            data={data}
            onRefresh={load}
            toolbar={filter}
            hrSlot={hrSlot}
            loading={loading}
          />
        </>
      )}
    </PageContainer>
  );
};

export default DashboardRouter;
