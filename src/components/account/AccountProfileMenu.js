import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { IconPower, IconLock, IconSignature } from '@tabler/icons';

const AccountProfileMenu = ({
  id,
  anchorEl,
  open,
  onClose,
  menuTransitionProps,
  displayName,
  email,
  onChangePassword,
  onMySignature,
  onLogout,
  anchorOrigin,
  transformOrigin,
  paperSx,
}) => (
  <Menu
    id={id}
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    anchorOrigin={anchorOrigin}
    transformOrigin={transformOrigin}
    TransitionProps={menuTransitionProps}
    disableScrollLock
    slotProps={{ paper: { sx: paperSx } }}
  >
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={600} noWrap>{displayName}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap>{email}</Typography>
    </Box>
    <Divider />
    <MenuItem onClick={onChangePassword}>
      <ListItemIcon><IconLock size={18} /></ListItemIcon>
      <ListItemText>Change password</ListItemText>
    </MenuItem>
    <MenuItem onClick={onMySignature}>
      <ListItemIcon><IconSignature size={18} /></ListItemIcon>
      <ListItemText>My signature</ListItemText>
    </MenuItem>
    <MenuItem onClick={onLogout} sx={{ color: 'error.main' }}>
      <ListItemIcon sx={{ color: 'error.main' }}><IconPower size={18} /></ListItemIcon>
      <ListItemText>Logout</ListItemText>
    </MenuItem>
  </Menu>
);

export default AccountProfileMenu;
