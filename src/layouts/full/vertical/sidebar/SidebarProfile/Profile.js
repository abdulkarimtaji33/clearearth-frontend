import React, { useContext } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useAuth } from 'src/context/AuthContext';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconChevronUp } from '@tabler/icons';
import { useAccountMenu } from 'src/hooks/useAccountMenu';
import AccountProfileMenu from 'src/components/account/AccountProfileMenu';

export const Profile = () => {
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const { user } = useAuth();
  const {
    anchorEl,
    menuOpen,
    openMenu,
    closeMenu,
    menuTransitionProps,
    goToChangePassword,
    goToMySignature,
    handleLogout,
  } = useAccountMenu();

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? isCollapse === 'mini-sidebar' && !isSidebarHover : '';

  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';
  const displayRole = user?.role?.displayName || user?.role?.display_name || user?.role?.name || 'User';

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const profileMenu = (
    <AccountProfileMenu
      id="sidebar-profile-menu"
      anchorEl={anchorEl}
      open={menuOpen}
      onClose={closeMenu}
      menuTransitionProps={menuTransitionProps}
      displayName={displayName}
      email={user?.email}
      onChangePassword={goToChangePassword}
        onMySignature={goToMySignature}
      onLogout={handleLogout}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      paperSx={{ minWidth: 200, borderRadius: 2, mt: -1 }}
    />
  );

  if (hideMenu) {
    return (
      <>
        <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={displayName} placement="right">
            <IconButton onClick={openMenu} size="small" sx={{ p: 0 }}>
              <Avatar alt={displayName} src={img1} sx={{ width: 36, height: 36, cursor: 'pointer' }}>
                {getInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
        {profileMenu}
      </>
    );
  }

  return (
    <>
      <Box
        onClick={openMenu}
        sx={{
          m: 3,
          p: 2,
          bgcolor: 'secondary.light',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar alt={displayName} src={img1} sx={{ width: 42, height: 42 }}>
          {getInitials()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{displayRole}</Typography>
        </Box>
        <IconChevronUp size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
      </Box>
      {profileMenu}
    </>
  );
};
