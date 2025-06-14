import { useContext, useEffect } from "react";
import { AuthContext } from "@/lib/auth";
import { getStoredToken, getStoredUser, clearStoredAuth } from "@/lib/utils"; // Assuming these are in utils

export const useAuth = () => {
  const { user, setUser, loading, setLoading } = useContext(AuthContext);

  useEffect(() => {
    const token = getStoredToken();
    if (token && !user) {
      console.log("Attempting session restoration from localStorage");
      const userData = getStoredUser();
      if (userData) {
        setUser(userData);
        console.log("Session restored successfully");
      } else {
        clearStoredAuth();
        console.log("Authentication cleared");
      }
    }
    // Only set loading to false if we've checked for stored auth
    setLoading(false);
  }, []); // Remove user dependency to prevent infinite loop

  return { user, setUser, loading, setLoading }; //returning loading and setLoading to avoid errors.
};