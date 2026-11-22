import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard driven by permissions (not role names).
 * <RequirePermission permission="roles.read">…</RequirePermission>
 * <RequirePermission anyOf={['users.read', 'users.update']}>…</RequirePermission>
 */
const RequirePermission = ({ permission, anyOf, children }) => {
  const { loading, hasPermission, hasAnyPermission } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  const list = anyOf || (permission ? [permission] : []);
  const allowed = list.length === 0 ? true : (anyOf ? hasAnyPermission(list) : hasPermission(permission));
  if (!allowed) return <Navigate to="/erp/dashboard" replace />;

  return children;
};

export default RequirePermission;
