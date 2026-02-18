import { useEffect, useRef, useState, useCallback } from 'react';
import type { WSMessage } from '../shared/types';
import { WS_URL } from '../lib/config';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface UseWebSocketReturn {
  lastMessage: WSMessage | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

const MAX_BACKOFF = 10000; // 10 seconds max
const INITIAL_BACKOFF = 1000; // 1 second

export function useWebSocket(onMessage?: (message: WSMessage) => void): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', WS_URL);
        setConnectionStatus('connected');
        backoffRef.current = INITIAL_BACKOFF; // Reset backoff on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (shouldReconnectRef.current) {
          const backoff = backoffRef.current;
          console.log(`[WebSocket] Reconnecting in ${backoff}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            // Exponential backoff: double the wait time, up to MAX_BACKOFF
            backoffRef.current = Math.min(backoff * 2, MAX_BACKOFF);
            connect();
          }, backoff);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setConnectionStatus('disconnected');
    }
  }, [onMessage]);

  const reconnect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      shouldReconnectRef.current = false;
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset and reconnect
    shouldReconnectRef.current = true;
    backoffRef.current = INITIAL_BACKOFF;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    lastMessage,
    connectionStatus,
    reconnect,
  };
}
