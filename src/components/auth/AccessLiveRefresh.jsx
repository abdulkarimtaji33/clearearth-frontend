import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

/**
 * Keeps the signed-in user's effective access fresh without a re-login:
 *  - the server pushes `access:changed` (role edited, override saved, role switched) → reload immediately
 *  - fallback: re-check when the tab regains focus and every 2 minutes
 * Renders nothing.
 */
const AccessLiveRefresh = () => {
  const { isAuthenticated, loadUser } = useAuth();
  const { on, connected } = useSocket() || {};

  useEffect(() => {
    if (!isAuthenticated || !connected || !on) return undefined;
    const off = on('access:changed', () => { loadUser(); });
    return off;
  }, [isAuthenticated, connected, on, loadUser]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onFocus = () => { loadUser(); };
    window.addEventListener('focus', onFocus);
    const timer = setInterval(() => { loadUser(); }, 120000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [isAuthenticated, loadUser]);

  return null;
};

export default AccessLiveRefresh;
