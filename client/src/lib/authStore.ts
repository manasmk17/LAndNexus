/**
 * Frontend Authentication Store
 * Manages authentication state, token refresh, and session persistence
 */

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
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthStore {
  private static instance: AuthStore;
  private state: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true
  };
  private refreshTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(state: AuthState) => void> = [];

  static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state change
  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Get current auth state
  getState(): AuthState {
    return { ...this.state };
  }

  // Initialize authentication on app start
  private async initializeAuth(): Promise<void> {
    try {
      // Check if user is already authenticated
      const response = await fetch('/api/me', {
        credentials: 'include',
        headers: {
          'Authorization': this.state.accessToken ? `Bearer ${this.state.accessToken}` : ''
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        this.startTokenRefresh();
      } else {
        // Try to refresh token
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  // Update state and notify listeners
  private setState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // Login with credentials
  async login(credentials: { username: string; password: string; rememberMe?: boolean }): Promise<boolean> {
    try {
      this.setState({ isLoading: true });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const userData = await response.json();
        
        this.setState({
          user: userData,
          accessToken: userData.accessToken,
          isAuthenticated: true,
          isLoading: false
        });

        this.startTokenRefresh();
        console.log('Authentication successful for user:', userData.username);
        return true;
      } else {
        const error = await response.json();
        this.setState({ isLoading: false });
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      this.setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
      throw error;
    }
  }

  // Logout and clear auth state
  async logout(): Promise<void> {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    this.clearAuth();
  }

  // Clear authentication state
  private clearAuth(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false
    });

    console.log('Authentication cleared');
  }

  // Refresh access token
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false
        });
        this.startTokenRefresh();
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Start automatic token refresh
  private startTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token every 14 minutes (1 minute before expiry)
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, 14 * 60 * 1000);
  }

  // Get authorization header for API requests
  getAuthHeader(): string | null {
    return this.state.accessToken ? `Bearer ${this.state.accessToken}` : null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.state.user?.userType === role;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.state.user;
  }
}

export const authStore = AuthStore.getInstance();