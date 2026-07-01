import { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useAuth } from 'src/context/AuthContext';

/**
 * Profile menu state + navigation that waits for the MUI Menu exit transition.
 * Navigating while the menu Modal is still closing leaves an invisible backdrop that blocks clicks.
 */
export function useAccountMenu() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setIsMobileSidebar } = useContext(CustomizerContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const pendingActionRef = useRef(null);

  const openMenu = (event) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const runAfterMenuClose = (action) => {
    setIsMobileSidebar(false);
    pendingActionRef.current = action;
    closeMenu();
  };

  const menuTransitionProps = {
    onExited: () => {
      const action = pendingActionRef.current;
      if (!action) return;
      pendingActionRef.current = null;
      action();
    },
  };

  const goToChangePassword = () => {
    runAfterMenuClose(() => navigate('/erp/account/password'));
  };

  const handleLogout = () => {
    runAfterMenuClose(async () => {
      await logout();
      navigate('/auth/login');
    });
  };

  return {
    anchorEl,
    menuOpen: Boolean(anchorEl),
    openMenu,
    closeMenu,
    menuTransitionProps,
    goToChangePassword,
    handleLogout,
  };
}
