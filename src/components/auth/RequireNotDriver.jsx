import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/** Only users who can view deals (`deals.read`) may open CRM deal screens — e.g. drivers use pickup views instead. */
const RequireNotDriver = ({ children }) => {
  const { loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission('deals.read')) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireNotDriver;
