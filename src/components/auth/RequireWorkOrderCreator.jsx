import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { canCreateWorkOrder } from '../../utils/authHelpers';

/** Block sales and sales manager from the work order create form. */
const RequireWorkOrderCreator = ({ children }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!canCreateWorkOrder(user, hasPermission)) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireWorkOrderCreator;
