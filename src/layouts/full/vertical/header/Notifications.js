import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSocket } from 'src/context/SocketContext';
import {
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { IconBellRinging } from '@tabler/icons';
import { Stack } from '@mui/system';
import apiService from 'src/services/api';
import { notificationEntityLink } from 'src/utils/notificationLinks';

const entityLink = (n) => notificationEntityLink(n);

const Notifications = () => {
  const navigate = useNavigate();
  const { on, connected } = useSocket() || {};
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getNotifications({ limit: 20 });
      if (res.success) {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time: increment badge and re-fetch when a notification arrives via socket
  useEffect(() => {
    if (!connected || !on) return;
    const off = on('notification', () => {
      setUnreadCount(c => c + 1);
      fetchNotifications();
    });
    return off;
  }, [connected, on, fetchNotifications]);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
    fetchNotifications();
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await apiService.markNotificationRead(n.id);
        setUnreadCount(c => Math.max(0, c - 1));
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      } catch { /* ignore */ }
    }
    const link = entityLink(n);
    handleClose2();
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    } catch { /* ignore */ }
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{ ...(anchorEl2 && { color: 'primary.main' }) }}
        onClick={handleClick2}
      >
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <IconBellRinging size="21" stroke="1.5" />
        </Badge>
      </IconButton>
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ '& .MuiMenu-paper': { width: '360px', maxWidth: 'calc(100vw - 32px)' } }}
      >
        <Stack direction="row" py={2} px={4} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} color="primary" size="small" onClick={handleMarkAllRead} sx={{ cursor: 'pointer' }} />
          )}
        </Stack>
        <Scrollbar sx={{ height: '385px' }}>
          {loading && notifications.length === 0 ? (
            <Box py={4} display="flex" justifyContent="center"><CircularProgress size={24} /></Box>
          ) : notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" px={4} py={2}>No notifications</Typography>
          ) : (
            notifications.map((notification) => (
              <Box key={notification.id}>
                <MenuItem
                  sx={{ py: 2, px: 4, bgcolor: notification.is_read ? 'transparent' : 'action.hover' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Box>
                    <Typography variant="subtitle2" color="textPrimary" fontWeight={600} sx={{ width: '280px' }}>
                      {notification.title}
                    </Typography>
                    <Typography color="textSecondary" variant="caption" sx={{ width: '280px', display: 'block', mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                      {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                    </Typography>
                  </Box>
                </MenuItem>
              </Box>
            ))
          )}
        </Scrollbar>
        {unreadCount > 0 && (
          <Box p={2} pb={1}>
            <Button variant="outlined" color="primary" fullWidth onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

export default Notifications;
