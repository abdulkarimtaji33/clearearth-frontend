import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { canModifyOrders } from '../../utils/authHelpers';

/** Only users with `orders.modify` may open quotation / purchase-order create and edit forms. */
const RequireQuotationPoEditor = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!canModifyOrders(user)) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireQuotationPoEditor;
