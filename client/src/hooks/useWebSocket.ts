import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_URL } from '../utils/constants';
import type { ClientMessage, ServerMessage } from '../types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage?: (message: ServerMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for callbacks to avoid stale closures and unnecessary reconnections
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  onMessageRef.current = onMessage;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onErrorRef.current = onError;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected to', WS_URL);
      setStatus('connected');
      reconnectCountRef.current = 0;
      onConnectRef.current?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        console.log('[WS] Received:', message.type);
        setLastMessage(message);
        onMessageRef.current?.(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code, event.reason);
      setStatus('disconnected');
      onDisconnectRef.current?.();

      // 嘗試重新連線
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current += 1;
        console.log(`[WS] Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`);
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      setStatus('error');
      onErrorRef.current?.(error);
    };

    wsRef.current = ws;
  }, [reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectCountRef.current = reconnectAttempts; // 防止重連
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, [reconnectAttempts]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Sending:', message.type);
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('[WS] Cannot send - not connected');
    return false;
  }, []);

  // 自動連線
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    lastMessage,
    send,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}
