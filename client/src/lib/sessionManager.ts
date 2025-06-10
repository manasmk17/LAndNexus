/**
 * Session Management Utility
 * Ensures consistent session handling across all API requests
 */

class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Extract session ID from cookies
  getSessionId(): string | null {
    const cookies = document.cookie.split('; ');
    const sessionCookie = cookies.find(cookie => 
      cookie.startsWith('sessionId=') || cookie.startsWith('connect.sid=')
    );
    
    if (sessionCookie) {
      this.sessionId = sessionCookie.split('=')[1];
      return this.sessionId;
    }
    
    return null;
  }

  // Force session cookie to be set with proper attributes
  setSessionCookie(sessionId: string): void {
    this.sessionId = sessionId;
    document.cookie = `sessionId=${sessionId}; path=/; SameSite=lax; max-age=86400`;
  }

  // Clear session
  clearSession(): void {
    this.sessionId = null;
    document.cookie = 'sessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'connect.sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // Enhanced fetch wrapper with session persistence
  async sessionFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Ensure session ID is available
    const currentSession = this.getSessionId();
    
    const enhancedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        // Force session header if available
        ...(currentSession && { 'X-Session-ID': currentSession })
      }
    };

    const response = await fetch(url, enhancedOptions);
    
    // Check if new session was established
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('sessionId=')) {
      const match = setCookieHeader.match(/sessionId=([^;]+)/);
      if (match) {
        this.setSessionCookie(match[1]);
      }
    }

    return response;
  }
}

export const sessionManager = SessionManager.getInstance();