import { create } from 'zustand';
import { WS_URL } from '../utils/constants';
import { logger } from '../utils/logger';
import type { ClientMessage, ServerMessage } from '../types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (message: ServerMessage) => void;
type ReconnectHandler = () => void;

interface WsState {
  status: WebSocketStatus;
  lastMessage: ServerMessage | null;
  isConnected: boolean;

  // Internal
  _ws: WebSocket | null;
  _reconnectCount: number;
  _reconnectTimer: NodeJS.Timeout | null;
  _handlers: Set<MessageHandler>;
  _reconnectHandlers: Set<ReconnectHandler>;
  _hasConnectedOnce: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  send: (message: ClientMessage) => boolean;
  subscribe: (handler: MessageHandler) => () => void;
  onReconnect: (handler: ReconnectHandler) => () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

export const useWsStore = create<WsState>((set, get) => ({
  status: 'disconnected',
  lastMessage: null,
  isConnected: false,

  _ws: null,
  _reconnectCount: 0,
  _reconnectTimer: null,
  _handlers: new Set(),
  _reconnectHandlers: new Set(),
  _hasConnectedOnce: false,

  connect: () => {
    const state = get();
    if (state._ws?.readyState === WebSocket.OPEN) return;

    set({ status: 'connecting' });
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      logger.log('[WS] Connected to', WS_URL);
      const wasConnectedBefore = get()._hasConnectedOnce;
      set({ status: 'connected', isConnected: true, _reconnectCount: 0, _hasConnectedOnce: true });
      if (wasConnectedBefore) {
        logger.log('[WS] Reconnected — notifying handlers');
        get()._reconnectHandlers.forEach((handler) => handler());
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        logger.log('[WS] Received:', message.type);
        set({ lastMessage: message });
        // Notify all subscribers
        get()._handlers.forEach((handler) => handler(message));
      } catch (error) {
        logger.error('[WS] Failed to parse message:', error);
      }
    };

    ws.onclose = (event) => {
      logger.log('[WS] Disconnected:', event.code, event.reason);
      set({ status: 'disconnected', isConnected: false, _ws: null });

      const { _reconnectCount } = get();
      if (_reconnectCount < MAX_RECONNECT_ATTEMPTS) {
        set({ _reconnectCount: _reconnectCount + 1 });
        logger.log(`[WS] Reconnecting... (${_reconnectCount + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        const timer = setTimeout(() => get().connect(), RECONNECT_INTERVAL);
        set({ _reconnectTimer: timer });
      }
    };

    ws.onerror = (error) => {
      logger.error('[WS] Error:', error);
      set({ status: 'error', isConnected: false });
    };

    set({ _ws: ws });
  },

  disconnect: () => {
    const state = get();
    if (state._reconnectTimer) {
      clearTimeout(state._reconnectTimer);
    }
    state._ws?.close();
    set({
      _ws: null,
      _reconnectTimer: null,
      _reconnectCount: MAX_RECONNECT_ATTEMPTS, // prevent reconnect
      status: 'disconnected',
      isConnected: false,
    });
  },

  send: (message) => {
    const { _ws } = get();
    if (_ws?.readyState === WebSocket.OPEN) {
      logger.log('[WS] Sending:', message.type);
      _ws.send(JSON.stringify(message));
      return true;
    }
    logger.warn('[WS] Cannot send - not connected');
    return false;
  },

  subscribe: (handler) => {
    get()._handlers.add(handler);
    return () => {
      get()._handlers.delete(handler);
    };
  },

  onReconnect: (handler) => {
    get()._reconnectHandlers.add(handler);
    return () => {
      get()._reconnectHandlers.delete(handler);
    };
  },
}));
