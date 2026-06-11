import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
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
  const roleName = user?.role?.name || user?.Role?.name || 'sales';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getDashboardOverview();
      if (res.success) setData(res.data);
      else setError(res.message || 'Failed to load dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
