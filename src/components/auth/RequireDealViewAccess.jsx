import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { canViewDealDetails } from '../../utils/authHelpers';

/** The deal detail page needs `deals.read` and is hidden from users whose prices & amounts are hidden. */
const RequireDealViewAccess = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!canViewDealDetails(user)) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireDealViewAccess;
