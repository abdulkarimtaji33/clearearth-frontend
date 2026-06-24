import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Snackbar, Alert, Button } from '@mui/material';
import { useSocket } from '../../context/SocketContext';
import { APPROVAL_NOTIFICATION_TYPES, notificationEntityLink } from '../../utils/notificationLinks';

const RealtimeNotificationToast = () => {
  const navigate = useNavigate();
  const { on, connected } = useSocket() || {};
  const queueRef = useRef([]);
  const [toast, setToast] = useState(null);

  const showNext = useCallback(() => {
    setToast((current) => {
      if (current) return current;
      const next = queueRef.current.shift();
      return next || null;
    });
  }, []);

  const enqueue = useCallback((payload) => {
    queueRef.current.push(payload);
    showNext();
  }, [showNext]);

  useEffect(() => {
    if (!connected || !on) return undefined;

    const off = on('notification', (payload) => {
      if (!payload?.title) return;
      enqueue({
        type: payload.type,
        title: payload.title,
        message: payload.message || '',
        entityType: payload.entityType,
        entityId: payload.entityId,
      });
    });

    return off;
  }, [connected, on, enqueue]);

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    setToast(null);
    setTimeout(showNext, 300);
  };

  const handleView = () => {
    if (!toast) return;
    const link = notificationEntityLink(toast);
    setToast(null);
    setTimeout(showNext, 300);
    if (link) navigate(link);
  };

  if (!toast) return null;

  const isApproval = APPROVAL_NOTIFICATION_TYPES.has(toast.type);
  const link = notificationEntityLink(toast);

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={isApproval ? 10000 : 7000}
      onClose={handleClose}
      sx={{ mt: 7, maxWidth: 420 }}
    >
      <Alert
        onClose={handleClose}
        severity={isApproval ? 'warning' : 'info'}
        variant="filled"
        sx={{ width: '100%', alignItems: 'flex-start' }}
        action={
          link ? (
            <Button color="inherit" size="small" onClick={handleView} sx={{ whiteSpace: 'nowrap' }}>
              View
            </Button>
          ) : null
        }
      >
        <strong>{toast.title}</strong>
        {toast.message ? (
          <>
            <br />
            {toast.message}
          </>
        ) : null}
      </Alert>
    </Snackbar>
  );
};

export default RealtimeNotificationToast;
