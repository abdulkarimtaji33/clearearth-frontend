import React from 'react';
import { Box, Avatar, IconButton } from '@mui/material';
import { useAuth } from 'src/context/AuthContext';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { useAccountMenu } from 'src/hooks/useAccountMenu';
import AccountProfileMenu from 'src/components/account/AccountProfileMenu';

const Profile = () => {
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

  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="account menu"
        aria-controls="header-profile-menu"
        aria-haspopup="true"
        onClick={openMenu}
        color="inherit"
        sx={{ ...(menuOpen && { color: 'primary.main' }) }}
      >
        <Avatar alt={displayName} src={img1} sx={{ width: 35, height: 35 }}>
          {getInitials()}
        </Avatar>
      </IconButton>
      <AccountProfileMenu
        id="header-profile-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        menuTransitionProps={menuTransitionProps}
        displayName={displayName}
        email={user?.email}
        onChangePassword={goToChangePassword}
        onMySignature={goToMySignature}
        onLogout={handleLogout}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        paperSx={{ minWidth: 220, borderRadius: 2, mt: 1 }}
      />
    </Box>
  );
};

export default Profile;
