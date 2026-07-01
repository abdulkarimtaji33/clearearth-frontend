import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { IconPower, IconLock } from '@tabler/icons';
import { useAuth } from 'src/context/AuthContext';
import img1 from 'src/assets/images/profile/user-1.jpg';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const closeMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/auth/login');
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="account menu"
        aria-controls="header-profile-menu"
        aria-haspopup="true"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        color="inherit"
        sx={{ ...(anchorEl && { color: 'primary.main' }) }}
      >
        <Avatar alt={displayName} src={img1} sx={{ width: 35, height: 35 }}>
          {getInitials()}
        </Avatar>
      </IconButton>
      <Menu
        id="header-profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate('/erp/account/password');
          }}
        >
          <ListItemIcon><IconLock size={18} /></ListItemIcon>
          <ListItemText>Change password</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><IconPower size={18} /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Profile;
