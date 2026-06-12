import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { getUserRole } from '../../utils/authHelpers';

/** Block drivers from CRM deal screens; they use driver pickup views instead. */
const RequireNotDriver = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (getUserRole(user) === 'driver') {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireNotDriver;
