import React from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext } from 'react';
import { useAuth } from 'src/context/AuthContext';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconPower } from '@tabler/icons';
import { Link, useNavigate } from "react-router";

export const Profile = () => {
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? isCollapse == 'mini-sidebar' && !isSidebarHover : '';

  // Handle both camelCase (firstName) and snake_case (first_name) from API
  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';
  
  // Handle role display name
  const displayRole = user?.role?.displayName || user?.role?.display_name || user?.role?.name || 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // Get initials for avatar
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${'secondary.light'}` }}
    >
      {!hideMenu ? (
        <>
          <Avatar alt={displayName} src={img1}>
            {getInitials()}
          </Avatar>

          <Box>
            <Typography variant="h6" color="textPrimary">{displayName}</Typography>
            <Typography variant="caption" color="textSecondary">{displayRole}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton color="primary" onClick={handleLogout} aria-label="logout" size="small">
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
