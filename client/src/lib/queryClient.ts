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
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      console.warn('CSRF token not found for API request to:', url, 'method:', method);
      console.log('Current cookies:', document.cookie);
      
      // Log request details for debugging
      try {
        console.log('Request details:', {
          method,
          url,
          dataType: data ? typeof data : 'undefined',
          isFormData,
          cookies: document.cookie,
          origin: window.location.origin,
          path: window.location.pathname
        });
      } catch (e) {
        console.error('Error logging request details:', e);
      }
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
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  } else {
    console.warn('CSRF token not found when uploading to:', url);
    console.log('Current cookies:', document.cookie);
    
    // If the token is missing, we'll attempt to log detailed info for debugging
    try {
      // Log all request details for debugging
      console.log('Request details:', {
        method,
        url,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => {
          if (typeof value === 'string') {
            return [key, value];
          } else {
            return [key, '(File or Blob object)'];
          }
        }),
        cookies: document.cookie,
        origin: window.location.origin,
        path: window.location.pathname
      });
    } catch (e) {
      console.error('Error logging request details:', e);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: formData,
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
      } else {
        console.warn(`CSRF token not found for query ${url} with method ${method}`);
        console.log('Current cookies:', document.cookie);
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
