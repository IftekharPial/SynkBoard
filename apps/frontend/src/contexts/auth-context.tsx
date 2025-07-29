/**
 * Authentication context for SynkBoard
 * Following frontend-behavior.md and role-based-access.md
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient, ApiError } from '@/lib/api';
import { User, Role, canPerform, Permission } from '@synkboard/types';

interface AuthUser extends User {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasMinimumRole: (role: Role) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'synkboard_token';
const REFRESH_TOKEN_KEY = 'synkboard_refresh_token';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      // Set token in API client
      apiClient.setToken(token);

      // Fetch current user
      const userData = await api.auth.me();
      setUser(userData as AuthUser);
      
      // Set tenant ID in API client
      apiClient.setTenantId(userData.tenant.id);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      
      // Clear invalid token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      apiClient.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await api.auth.login({ email, password });
      const { user: userData, token, expires_at } = response as any;

      // Store tokens
      localStorage.setItem(TOKEN_KEY, token);
      if (response.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      }

      // Set token in API client
      apiClient.setToken(token);
      apiClient.setTenantId(userData.tenant.id);

      // Set user state
      setUser(userData);

      // Setup token refresh if needed
      if (expires_at) {
        setupTokenRefresh(expires_at);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // Clear API client
    apiClient.clearAuth();
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  const setupTokenRefresh = (expiresAt: string) => {
    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);
    
    setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          logout();
          return;
        }

        const response = await api.auth.refresh(refreshToken);
        const { token, expires_at } = response as any;

        // Update stored token
        localStorage.setItem(TOKEN_KEY, token);
        apiClient.setToken(token);

        // Setup next refresh
        if (expires_at) {
          setupTokenRefresh(expires_at);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, refreshTime);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return canPerform(permission, user.role as Role);
  };

  const hasMinimumRole = (role: Role): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      superadmin: 5,
      admin: 4,
      editor: 3,
      analyst: 2,
      viewer: 1,
      integration: 0,
    };

    return roleHierarchy[user.role as Role] >= roleHierarchy[role];
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasMinimumRole,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: Permission,
  requiredRole?: Role
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasPermission, hasMinimumRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }

      if (requiredRole && !hasMinimumRole(requiredRole)) {
        router.push('/unauthorized');
        return;
      }
    }, [user, loading, hasPermission, hasMinimumRole, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return null;
    }

    if (requiredRole && !hasMinimumRole(requiredRole)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for checking permissions
export function usePermissions() {
  const { hasPermission, hasMinimumRole, user } = useAuth();
  
  return {
    hasPermission,
    hasMinimumRole,
    canView: (resource: string) => hasPermission(`${resource}:view` as Permission),
    canCreate: (resource: string) => hasPermission(`${resource}:create` as Permission),
    canEdit: (resource: string) => hasPermission(`${resource}:edit` as Permission),
    canDelete: (resource: string) => hasPermission(`${resource}:delete` as Permission),
    isAdmin: () => hasMinimumRole('admin'),
    isEditor: () => hasMinimumRole('editor'),
    role: user?.role,
  };
}
