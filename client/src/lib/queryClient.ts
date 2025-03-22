import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Gets CSRF token from cookies
 */
export function getCsrfToken(): string | null {
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  return null;
}

/**
 * Makes authenticated API requests with CSRF protection
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<Response> {
  // Build headers with CSRF token
  const headers: Record<string, string> = {};
  
  // Add content type for JSON requests
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for non-GET methods
  if (method !== 'GET') {
    let csrfToken = getCsrfToken();
    
    // If the token is missing, immediately try to refresh it
    if (!csrfToken) {
      console.warn('CSRF token not found for API request to:', url, 'method:', method);
      
      try {
        console.log("Attempting to refresh CSRF token for API request...");
        const tokenResponse = await fetch("/api/csrf-token", { 
          method: "GET",
          credentials: "include"
        });
        
        if (tokenResponse.ok) {
          // Wait a moment for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 50));
          csrfToken = getCsrfToken();
        }
      } catch (e) {
        console.error('Error refreshing CSRF token for API request:', e);
      }
    }
    
    // Set the token if we have it
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
      console.log(`Using CSRF token for ${method} request to ${url}`);
    } else {
      console.warn("Failed to obtain CSRF token for API request after refresh attempt");
    }
    
    // Log request details for debugging
    try {
      console.log('apiRequest details:', {
        method,
        url,
        dataType: data ? typeof data : 'undefined',
        isFormData,
        hasCSRFToken: !!csrfToken,
        cookies: document.cookie
      });
    } catch (e) {
      console.error('Error logging request details:', e);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? data as FormData : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    // Enhanced error handling for CSRF-specific errors
    if (res.status === 403) {
      const responseText = await res.text();
      if (responseText.includes('CSRF') || responseText.includes('csrf')) {
        console.error('CSRF protection error:', responseText);
        throw new Error(`CSRF Protection Error (403): ${responseText}. Please refresh the page and try again.`);
      }
      throw new Error(`Forbidden (403): ${responseText}`);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('Error during API request:', error);
    throw error;
  }
}

/**
 * Upload a file with FormData while preserving CSRF protection
 * Use this for file uploads instead of regular apiRequest
 */
export async function secureFileUpload(
  method: string,
  url: string,
  formData: FormData
): Promise<Response> {
  // Build headers with CSRF token only
  const headers: Record<string, string> = {};
  
  // Add CSRF token
  let csrfToken = getCsrfToken();
  
  // If the token is missing, immediately try to refresh it
  if (!csrfToken) {
    console.warn('CSRF token not found when uploading to:', url);
    console.log('Current cookies:', document.cookie);
    
    try {
      console.log("Attempting to refresh CSRF token...");
      const tokenResponse = await fetch("/api/csrf-token", { 
        method: "GET",
        credentials: "include"
      });
      
      if (tokenResponse.ok) {
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 50));
        csrfToken = getCsrfToken();
      }
    } catch (e) {
      console.error('Error refreshing CSRF token:', e);
    }
  }
  
  // Set the token if we have it
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
    console.log(`Using CSRF token for ${method} request to ${url}`);
  } else {
    console.warn("Failed to obtain CSRF token after refresh attempt");
  }
  
  // Log request details for debugging regardless
  console.log('secureFileUpload request details:', {
    method,
    url,
    formDataEntries: Array.from(formData.entries()).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, value];
      } else {
        return [key, '(File or Blob object)'];
      }
    }),
    hasCSRFToken: !!csrfToken,
    cookies: document.cookie
  });

  try {
    console.log(`Sending ${method} request to ${url} with ${formData ? Array.from(formData.keys()).length : 0} form fields`);
    
    const res = await fetch(url, {
      method,
      headers,
      body: formData,
      credentials: "include",
    });

    console.log(`Response received: ${res.status} ${res.statusText}`);

    // Enhanced error handling for CSRF-specific errors
    if (res.status === 403) {
      const responseText = await res.text();
      if (responseText.includes('CSRF') || responseText.includes('csrf')) {
        console.error('CSRF protection error:', responseText);
        throw new Error(`CSRF Protection Error (403): ${responseText}. Please refresh the page and try again.`);
      }
      throw new Error(`Forbidden (403): ${responseText}`);
    }
    
    // Handle authentication errors
    if (res.status === 401) {
      const responseText = await res.text();
      console.error('Authentication error:', responseText);
      throw new Error(`Authentication Error (401): You must be logged in to perform this action. Please log in and try again.`);
    }

    // Handle other errors with detailed information
    if (!res.ok) {
      const responseText = await res.text();
      console.error(`Error ${res.status} from server:`, responseText);
      throw new Error(`Server Error (${res.status}): ${responseText}`);
    }
    
    return res;
  } catch (error) {
    console.error('Error during file upload:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build headers with CSRF token if needed
    const headers: Record<string, string> = {};
    
    // For non-GET methods we need to include CSRF tokens
    // This applies to some query patterns that might use POST
    const url = queryKey[0] as string;
    const method = queryKey.length > 1 && typeof queryKey[1] === 'string' ? queryKey[1] : 'GET';
    
    if (method !== 'GET') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
        console.log(`Using CSRF token for query function ${method} request to ${url}`);
      } else {
        console.warn(`CSRF token not found for query ${url} with method ${method}`);
        
        // If the token is missing, try to refresh it by making a GET request
        try {
          console.log("Attempting to refresh CSRF token for query function...");
          await fetch("/api/csrf-token", { 
            method: "GET",
            credentials: "include"
          });
          
          // Try again to get the token
          const refreshedToken = getCsrfToken();
          if (refreshedToken) {
            console.log("Successfully refreshed CSRF token for query function");
            headers['X-CSRF-Token'] = refreshedToken;
          } else {
            console.warn("Failed to refresh CSRF token for query function");
            console.log('Current cookies:', document.cookie);
          }
        } catch (e) {
          console.error('Error refreshing CSRF token for query function:', e);
        }
      }
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Enhanced error handling for CSRF-specific errors
      if (res.status === 403) {
        const responseText = await res.text();
        if (responseText.includes('CSRF') || responseText.includes('csrf')) {
          console.error('CSRF protection error in query function:', responseText);
          throw new Error(`CSRF Protection Error (403): ${responseText}. Please refresh the page and try again.`);
        }
        throw new Error(`Forbidden (403): ${responseText}`);
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Error in query function for ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
