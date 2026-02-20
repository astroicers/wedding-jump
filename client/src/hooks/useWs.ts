import { useEffect, useRef } from 'react';
import { useWsStore } from '../stores';
import type { ServerMessage } from '../types';

interface UseWsOptions {
  onMessage?: (message: ServerMessage) => void;
  onReconnect?: () => void;
  autoConnect?: boolean;
}

/**
 * Hook to use the global WebSocket connection.
 * Unlike useWebSocket, this doesn't create/destroy connections per component.
 */
export function useWs(options: UseWsOptions = {}) {
  const { onMessage, onReconnect, autoConnect = true } = options;

  const { status, isConnected, send, connect, disconnect, subscribe, onReconnect: subscribeReconnect } = useWsStore();

  // Use a ref so the subscribe callback always calls the latest onMessage
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  // Subscribe to messages
  useEffect(() => {
    if (!onMessage) return;
    const unsubscribe = subscribe((message: ServerMessage) => {
      onMessageRef.current?.(message);
    });
    return unsubscribe;
  }, [subscribe]); // subscribe is stable from zustand

  // Subscribe to reconnect events
  useEffect(() => {
    if (!onReconnect) return;
    const unsubscribe = subscribeReconnect(() => {
      onReconnectRef.current?.();
    });
    return unsubscribe;
  }, [subscribeReconnect]); // subscribeReconnect is stable from zustand

  // Auto-connect on first use
  useEffect(() => {
    if (autoConnect && !isConnected && status === 'disconnected') {
      connect();
    }
  }, [autoConnect, isConnected, status, connect]);

  return { status, isConnected, send, connect, disconnect };
}
