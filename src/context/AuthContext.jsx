import { createContext, useState, useEffect, useCallback } from 'react';
import React from 'react';
import apiService from '../services/api';
import { getUserRole, normalizePermissions, collectPermissionsFromUserPayload } from '../utils/authHelpers';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const token = apiService.getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        const data = response.data;
        const userPayload = data.user || data;
        setUser(userPayload);
        setTenant(data.tenant ?? userPayload.tenant);
        setPermissions(collectPermissionsFromUserPayload(data));
        setIsAuthenticated(true);
        // Cache tenant logo so Logo.js can read it without an extra API call
        const logo = response.data.tenant?.logo;
        if (logo) {
          try { sessionStorage.setItem('tenantLogo', apiService.getUploadUrl(logo)); } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Only wipe the session on auth failures — keep tokens on network/server blips
      if (error?.status === 401 || error?.status === 403) {
        apiService.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setTenant(null);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success && response.data) {
        const data = response.data;
        const userData = data.user || data;
        setUser(userData);
        setTenant(data.tenant);
        setPermissions(collectPermissionsFromUserPayload(data));
        setIsAuthenticated(true);
        await loadUser();
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await apiService.register(data);
      if (response.success && response.data) {
        const data = response.data;
        const userData = data.user || data;
        setUser(userData);
        setTenant(data.tenant);
        setPermissions(collectPermissionsFromUserPayload(data));
        setIsAuthenticated(true);
        await loadUser();
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTenant(null);
      setPermissions([]);
      setIsAuthenticated(false);
    }
  };

  const effectivePermissions = useCallback(() => {
    const fromState = normalizePermissions(permissions);
    if (fromState.length) return fromState;
    return collectPermissionsFromUserPayload(user);
  }, [permissions, user]);

  // Permissions are the effective set from the API: role permissions ± per-user overrides.
  const hasPermission = (permission) => {
    if (!user) return false;
    if (getUserRole(user) === 'super_admin' || user.access?.isSuperAdmin) return true;
    return effectivePermissions().includes(permission);
  };

  const hasAnyPermission = (permissionList) => permissionList.some((p) => hasPermission(p));

  // Display-only helper; avoid using role names for access decisions — use permissions.
  const hasRole = (role) => {
    if (!user) return false;
    return getUserRole(user) === role;
  };

  /** "Admin-level" = holds the admin dashboard permission (or is Super Admin). */
  const hasAdminDashboardAccess = useCallback(() => {
    if (!user) return false;
    if (getUserRole(user) === 'super_admin' || user.access?.isSuperAdmin) return true;
    return effectivePermissions().includes('dashboard.view_admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, permissions]);

  /** Data scope for a module: 'own' | 'team' | 'all'. */
  const getScope = (moduleKey, fallback = 'all') => user?.access?.scopes?.[moduleKey] || fallback;

  /** True when a field group (e.g. "financials") is hidden for this user. */
  const hidesField = (group) => Boolean(user?.access?.hiddenFieldGroups?.includes(group)) && !user?.access?.isSuperAdmin;

  const value = {
    user,
    tenant,
    permissions,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loadUser,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAdminDashboardAccess,
    getScope,
    hidesField,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
