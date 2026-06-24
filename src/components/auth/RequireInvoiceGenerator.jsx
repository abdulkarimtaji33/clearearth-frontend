import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { canGenerateInvoice } from '../../utils/authHelpers';

/** Block sales and sales manager from proforma / tax invoice create screens. */
const RequireInvoiceGenerator = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!canGenerateInvoice(user)) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
};

export default RequireInvoiceGenerator;
