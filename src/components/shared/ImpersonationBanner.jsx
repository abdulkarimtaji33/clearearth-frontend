import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ImpersonationBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasOriginalToken, setHasOriginalToken] = useState(false);

  useEffect(() => {
    try {
      setHasOriginalToken(Boolean(localStorage.getItem('admin_original_token')));
    } catch {
      setHasOriginalToken(false);
    }
  }, []);

  if (!hasOriginalToken) return null;

  const handleReturnToAdmin = () => {
    try {
      const originalToken = localStorage.getItem('admin_original_token');
      if (originalToken) {
        apiService.setAuthToken(originalToken);
        localStorage.removeItem('admin_original_token');
      }
    } catch {
      // ignore storage errors
    }
    navigate('/erp/users');
    window.location.reload();
  };

  const viewingName =
    [user?.first_name || user?.firstName, user?.last_name || user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'user';

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        py: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        Viewing as {viewingName} — Return to Admin
      </Typography>
      <Button size="small" variant="contained" color="inherit" onClick={handleReturnToAdmin} sx={{ borderRadius: 2 }}>
        Return to Admin
      </Button>
    </Box>
  );
};

export default ImpersonationBanner;
