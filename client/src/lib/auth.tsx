import { createContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  username: string;
  userType: "professional" | "company" | "admin";
  isAdmin: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface LoginCredentials {
  username: string; // This can be either username or email
  password: string;
  rememberMe?: boolean; // Optional flag to keep the user logged in
}

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error("login function not implemented");
  },
  logout: async () => {
    throw new Error("logout function not implemented");
  },
  isLoading: false,
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('session_token');
        const storedUserData = localStorage.getItem('user_data');

        if (storedToken && storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);

          try {
            const response = await apiRequest("GET", "/api/me");
            if (response.ok) {
              const freshUserData = await response.json();
              setUser(freshUserData);
            } else {
              await logout();
            }
          } catch (e) {
            await logout();
          }
        } else {
          try {
            const response = await fetch("/api/me", {
              credentials: "include",
              headers: {
                "Cache-Control": "no-cache",
              },
            });
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              console.log("User data", userData);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/login", credentials);
      
      // Check if response is successful
      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 401) {
          throw new Error("Invalid username or password");
        } else if (response.status === 403) {
          throw new Error("Account is disabled or blocked");
        } else if (response.status === 429) {
          throw new Error("Too many login attempts. Please try again later");
        } else {
          throw new Error("Login failed. Please try again");
        }
      }

      const userData = await response.json();
      
      // Validate user data
      if (!userData || !userData.username || !userData.id) {
        setUser(null);
        throw new Error("Invalid user data received");
      }
      
      // Store session token if provided for persistent authentication
      if (userData.sessionToken) {
        // Store in both cookie and localStorage for maximum persistence
        document.cookie = `session_token=${userData.sessionToken}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem('session_token', userData.sessionToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        console.log("Session token stored for persistent auth");
      }
      
      setUser(userData);
      return userData;
    } catch (err) {
      // Ensure user is null on any error
      setUser(null);
      
      // Clear any existing session data on login failure
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_data');
      document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to logout from server, but don't fail if it doesn't work
      try {
        await apiRequest("POST", "/api/logout", {});
      } catch (e) {
        // Log but don't throw - we still want to clear local session
        console.warn("Server logout failed:", e);
      }
      
      // Always clear session token from both cookie and localStorage
      document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_data');
      console.log("Session token cleared");
      
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};