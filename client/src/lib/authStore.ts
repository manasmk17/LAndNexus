/**
 * Frontend Authentication Store
 * Manages authentication state using session-based auth only
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
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthStore {
  private static instance: AuthStore;
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };
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
      const response = await fetch('/api/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const user = await response.json();
        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        // Don't immediately mark as unauthenticated, might be a temporary issue
        // Only clear auth if we get a definitive 401
        if (response.status === 401) {
          this.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        } else {
          // For other errors, just stop loading but don't clear potential auth state
          this.setState({
            isLoading: false
          });
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Network errors shouldn't clear auth state - user might be offline temporarily
      this.setState({
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
          isAuthenticated: true,
          isLoading: false
        });

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
  clearAuth(): void {
    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    console.log('Authentication cleared');
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