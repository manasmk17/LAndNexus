import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

interface WebSocketMessage {
  type: 'auth_success' | 'new_message' | 'message_sent' | 'error' | 'unread_notifications';
  data?: any;
  message?: string;
}

export function useWebSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        
        // Authenticate with the server
        if (ws.current && user) {
          ws.current.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'auth_success':
              console.log('WebSocket authenticated successfully');
              break;
              
            case 'new_message':
              // Invalidate message queries to refresh the UI
              queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
              if (message.data) {
                const msg = message.data as Message;
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/messages/${msg.senderId}`] 
                });
              }
              break;
              
            case 'message_sent':
              // Message successfully sent, refresh conversation
              if (message.data) {
                const msg = message.data as Message;
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/messages/${msg.receiverId}`] 
                });
                queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
              }
              break;
              
            case 'unread_notifications':
              // Handle unread notifications
              console.log('Unread notifications:', message.data);
              break;
              
            case 'error':
              console.error('WebSocket error:', message.message);
              setConnectionError(message.message || 'WebSocket error');
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection failed');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, queryClient]);

  const sendMessage = (type: string, data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...data }));
      return true;
    }
    return false;
  };

  return {
    isConnected,
    connectionError,
    sendMessage
  };
}