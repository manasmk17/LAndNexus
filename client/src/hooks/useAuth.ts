import { useState, useEffect } from 'react';
import { authStore } from '../lib/authStore';

interface User {
  id: number;
  username: string;
  userType: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authStore.subscribe((state) => {
      setAuthState(state);
    });

    // Initialize with current state
    setAuthState(authStore.getState());

    return unsubscribe;
  }, []);

  const login = async (credentials: { username: string; password: string; rememberMe?: boolean }) => {
    return authStore.login(credentials);
  };

  const logout = async () => {
    await authStore.logout();
  };

  const hasRole = (role: string) => {
    return authStore.hasRole(role);
  };

  return {
    ...authState,
    login,
    logout,
    hasRole
  };
}