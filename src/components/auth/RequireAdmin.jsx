import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/** Restrict route to admin, tenant_admin, and super_admin. */
const RequireAdmin = ({ children }) => {
  const { loading, hasAdminDashboardAccess } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAdminDashboardAccess()) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireAdmin;
