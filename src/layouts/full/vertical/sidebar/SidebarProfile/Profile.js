import React, { useContext, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useAuth } from 'src/context/AuthContext';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconPower, IconLock, IconChevronUp } from '@tabler/icons';
import { useNavigate } from 'react-router';

export const Profile = () => {
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

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

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/auth/login');
  };

  const openMenu = (event) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={closeMenu}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2, mt: -1 } } }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>{displayName}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
      </Box>
      <Divider />
      <MenuItem
        onClick={() => {
          closeMenu();
          setTimeout(() => navigate('/erp/account/password'), 0);
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
  );

  if (hideMenu) {
    return (
      <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={displayName} placement="right">
          <IconButton onClick={openMenu} size="small" sx={{ p: 0 }}>
            <Avatar alt={displayName} src={img1} sx={{ width: 36, height: 36, cursor: 'pointer' }}>
              {getInitials()}
            </Avatar>
          </IconButton>
        </Tooltip>
        {profileMenu}
      </Box>
    );
  }

  return (
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
      {profileMenu}
    </Box>
  );
};
