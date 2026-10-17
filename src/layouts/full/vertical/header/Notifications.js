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
  Tooltip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import {
  IconBellRinging,
  IconBellOff,
  IconCheck,
  IconX,
  IconClipboardCheck,
  IconFileText,
  IconTruck,
  IconCalendarEvent,
  IconCash,
  IconReceipt2,
  IconUserCheck,
  IconClockHour4,
  IconFileInvoice,
  IconPackage,
  IconCertificate,
} from '@tabler/icons';
import { Stack } from '@mui/system';
import apiService from 'src/services/api';
import { notificationEntityLink } from 'src/utils/notificationLinks';

const entityLink = (n) => notificationEntityLink(n);

// Icon + accent color per notification type, grouped by what the notification is about.
// Falls back to a generic bell for any type not listed here.
const TYPE_META = {
  deal_status_change: { icon: IconFileText, color: 'info' },
  deal_approval_requested: { icon: IconClipboardCheck, color: 'warning' },
  quotation_approval_requested: { icon: IconClipboardCheck, color: 'warning' },
  purchase_order_approval_requested: { icon: IconClipboardCheck, color: 'warning' },
  lead_approval_requested: { icon: IconClipboardCheck, color: 'warning' },
  quotation_approved: { icon: IconCheck, color: 'success' },
  purchase_order_approved: { icon: IconCheck, color: 'success' },
  lead_created: { icon: IconFileText, color: 'info' },
  inspection_request_created: { icon: IconClipboardCheck, color: 'info' },
  inspection_report_submitted: { icon: IconFileText, color: 'info' },
  inspection_rejected: { icon: IconX, color: 'error' },
  pickup_date_scheduled: { icon: IconCalendarEvent, color: 'primary' },
  pickup_date_confirmed: { icon: IconCalendarEvent, color: 'success' },
  pickup_reschedule_requested: { icon: IconCalendarEvent, color: 'warning' },
  pickup_date_rescheduled: { icon: IconCalendarEvent, color: 'warning' },
  expense_submitted: { icon: IconCash, color: 'warning' },
  grn_submitted: { icon: IconPackage, color: 'info' },
  leave_requested: { icon: IconClockHour4, color: 'warning' },
  leave_approved: { icon: IconCheck, color: 'success' },
  leave_rejected: { icon: IconX, color: 'error' },
  regularization_requested: { icon: IconClockHour4, color: 'warning' },
  regularization_approved: { icon: IconCheck, color: 'success' },
  regularization_rejected: { icon: IconX, color: 'error' },
  profile_change_requested: { icon: IconUserCheck, color: 'warning' },
  profile_change_approved: { icon: IconCheck, color: 'success' },
  profile_change_rejected: { icon: IconX, color: 'error' },
  payslip_published: { icon: IconFileInvoice, color: 'info' },
  certificate_request_submitted: { icon: IconCertificate, color: 'info' },
};
const DEFAULT_TYPE_META = { icon: IconReceipt2, color: 'default' };

/** "5m ago" / "3h ago" / "2d ago", falling back to a short date past a week. */
const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

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
        aria-controls="notifications-menu"
        aria-haspopup="true"
        sx={{ ...(anchorEl2 && { color: 'primary.main' }) }}
        onClick={handleClick2}
      >
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <IconBellRinging size="21" stroke="1.5" />
        </Badge>
      </IconButton>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ '& .MuiMenu-paper': { width: '380px', maxWidth: 'calc(100vw - 32px)' } }}
      >
        <Stack direction="row" py={1.75} px={2.5} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: 'none', minWidth: 0 }}>
                Mark all read
              </Button>
            </Tooltip>
          )}
        </Stack>
        <Scrollbar sx={{ height: '385px' }}>
          {loading && notifications.length === 0 ? (
            <Box py={4} display="flex" justifyContent="center"><CircularProgress size={24} /></Box>
          ) : notifications.length === 0 ? (
            <Box py={6} display="flex" flexDirection="column" alignItems="center" gap={1} color="text.disabled">
              <IconBellOff size={28} stroke={1.5} />
              <Typography variant="body2" color="text.secondary">You're all caught up</Typography>
            </Box>
          ) : (
            notifications.map((notification) => {
              const { icon: TypeIcon, color } = TYPE_META[notification.type] || DEFAULT_TYPE_META;
              const unread = !notification.is_read;
              return (
                <MenuItem
                  key={notification.id}
                  sx={{
                    py: 1.5, px: 2.5, alignItems: 'flex-start', gap: 1.5,
                    bgcolor: unread ? 'action.hover' : 'transparent',
                    borderLeft: '3px solid', borderLeftColor: unread ? `${color}.main` : 'transparent',
                    whiteSpace: 'normal',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Avatar sx={{ width: 34, height: 34, bgcolor: `${color}.light`, color: `${color}.main`, flexShrink: 0 }}>
                    <TypeIcon size={18} stroke={1.75} />
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="textPrimary"
                      fontWeight={unread ? 700 : 500}
                      noWrap
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="caption"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 0.25,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                      {formatRelativeTime(notification.created_at)}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })
          )}
        </Scrollbar>
      </Menu>
    </Box>
  );
};

export default Notifications;
