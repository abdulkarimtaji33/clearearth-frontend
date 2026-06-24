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

const ROLE_MAP = {
  admin: AdminDashboard,
  tenant_admin: AdminDashboard,
  super_admin: SuperAdminDashboard,
  sales: SalesDashboard,
  sales_manager: SalesManagerDashboard,
  inspection_team: InspectionDashboard,
  operations_manager: OperationsDashboard,
  driver: DriverPickupList,
  accounts: AccountsDashboard,
};

const DashboardRouter = () => {
  const { user } = useAuth();
  const { on, connected } = useSocket() || {};
  const roleName = user?.role?.name || user?.Role?.name || 'sales';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const silentRefresh = useCallback(() => {
    apiService.getDashboardOverview().then((res) => {
      if (isMounted.current && res.success) setData(res.data);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getDashboardOverview();
      if (isMounted.current) {
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load dashboard');
      }
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

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

  const Component = ROLE_MAP[roleName] || SalesDashboard;

  return (
    <PageContainer title="Dashboard" description="Your workspace overview">
      {loading ? (
        <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Component data={data} onRefresh={load} />
      )}
    </PageContainer>
  );
};

export default DashboardRouter;
