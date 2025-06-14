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
  createdAt?: string;
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
      try {
        // First, try to restore from localStorage
        const storedToken = localStorage.getItem('session_token');
        const storedUserData = localStorage.getItem('user_data');
        
        if (storedToken && storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log("Attempting session restoration from localStorage");
            
            // Verify the session is still valid with the server
            const response = await apiRequest("GET", "/api/me", undefined);
            if (response.ok) {
              const currentUserData = await response.json();
              setUser(currentUserData);
              console.log("Session restored successfully");
              return;
            }
          } catch (e) {
            console.log("Session restoration failed, clearing stored data");
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_data');
          }
        }

        // Fallback to standard session check
        const response = await fetch("/api/me", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            setUser(userData);
          } else {
            console.log("Authentication cleared");
            setUser(null);
          }
        } else {
          console.log("Authentication cleared");
          setUser(null);
        }
      } catch (err) {
        console.warn("Authentication check failed:", err);
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
      const userData = await response.json();
      
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
      await apiRequest("POST", "/api/logout", {});
      
      // Clear session token from both cookie and localStorage
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
