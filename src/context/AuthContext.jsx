import { createContext, useState, useEffect, useCallback } from 'react';
import React from 'react';
import apiService from '../services/api';

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
        setUser(response.data.user || response.data);
        setTenant(response.data.tenant);
        setPermissions(response.data.permissions || []);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      apiService.clearTokens();
      setIsAuthenticated(false);
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
        setUser(response.data.user);
        setTenant(response.data.tenant);
        setPermissions(response.data.permissions || []);
        setIsAuthenticated(true);
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
        setUser(response.data.user);
        setTenant(response.data.tenant);
        setPermissions(response.data.permissions || []);
        setIsAuthenticated(true);
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

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissionList.some((permission) => permissions.includes(permission));
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

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
