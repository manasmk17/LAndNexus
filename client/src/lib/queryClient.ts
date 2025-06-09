import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Special handling for DELETE operations that return 204 No Content
    if (res.status === 204) {
      return;
    }
    
    let errorText;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await res.json();
        errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } else {
        errorText = await res.text();
      }
    } catch (e) {
      errorText = res.statusText;
    }
    
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? data as FormData : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    throw error;
  }
}

export async function secureFileUpload(
  method: string,
  url: string,
  formData: FormData
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      body: formData,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      queryFn: getQueryFn({ on401: "returnNull" }),
    },
    mutations: {
      retry: false,
    },
  },
});