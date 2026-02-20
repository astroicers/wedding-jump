import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWsStore } from './wsStore';

// --- MockWebSocket -----------------------------------------------------------

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate async open
    setTimeout(() => this.onopen?.(new Event('open')), 0);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  });
}

vi.stubGlobal('WebSocket', MockWebSocket);

// --- Helpers -----------------------------------------------------------------

/** Reset the zustand singleton to a pristine disconnected state. */
function resetStore() {
  // Clear any pending reconnect timers
  const state = useWsStore.getState();
  if (state._reconnectTimer) {
    clearTimeout(state._reconnectTimer);
  }
  state._ws?.close();

  useWsStore.setState({
    status: 'disconnected',
    lastMessage: null,
    isConnected: false,
    _ws: null,
    _reconnectCount: 0,
    _reconnectTimer: null,
    _handlers: new Set(),
    _reconnectHandlers: new Set(),
    _hasConnectedOnce: false,
  });
}

// --- Tests -------------------------------------------------------------------

describe('wsStore — onReconnect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    resetStore();
    vi.useRealTimers();
  });

  it('should NOT call onReconnect handler on first connect', async () => {
    const handler = vi.fn();
    useWsStore.getState().onReconnect(handler);

    // Initiate the first connection
    useWsStore.getState().connect();

    // Flush the setTimeout inside MockWebSocket constructor (triggers onopen)
    vi.runAllTimers();

    expect(useWsStore.getState().isConnected).toBe(true);
    expect(useWsStore.getState()._hasConnectedOnce).toBe(true);
    // The handler should NOT have been called on first connect
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call onReconnect handler on reconnect (not first connect)', () => {
    const handler = vi.fn();
    useWsStore.getState().onReconnect(handler);

    // --- First connection ---
    useWsStore.getState().connect();
    vi.runAllTimers();

    expect(useWsStore.getState().isConnected).toBe(true);
    expect(useWsStore.getState()._hasConnectedOnce).toBe(true);
    expect(handler).not.toHaveBeenCalled();

    // --- Simulate disconnect ---
    const ws1 = useWsStore.getState()._ws as unknown as MockWebSocket;
    ws1.readyState = MockWebSocket.CLOSED;
    ws1.onclose?.(new CloseEvent('close'));

    expect(useWsStore.getState().isConnected).toBe(false);
    expect(useWsStore.getState().status).toBe('disconnected');

    // The auto-reconnect schedules a setTimeout(connect, 3000).
    // Advance past it to trigger the reconnect.
    vi.runAllTimers();

    // The new MockWebSocket's constructor fires onopen via setTimeout(0).
    // Flush that timer too.
    vi.runAllTimers();

    expect(useWsStore.getState().isConnected).toBe(true);
    // NOW the handler should have been called exactly once
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should call multiple registered onReconnect handlers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    useWsStore.getState().onReconnect(handler1);
    useWsStore.getState().onReconnect(handler2);
    useWsStore.getState().onReconnect(handler3);

    // --- First connection ---
    useWsStore.getState().connect();
    vi.runAllTimers();

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();

    // --- Simulate disconnect + reconnect ---
    const ws1 = useWsStore.getState()._ws as unknown as MockWebSocket;
    ws1.readyState = MockWebSocket.CLOSED;
    ws1.onclose?.(new CloseEvent('close'));

    vi.runAllTimers(); // reconnect timer
    vi.runAllTimers(); // MockWebSocket constructor onopen

    // All three handlers should have been called
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
  });

  it('should support unsubscribe from onReconnect', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const unsub1 = useWsStore.getState().onReconnect(handler1);
    useWsStore.getState().onReconnect(handler2);

    // --- First connection ---
    useWsStore.getState().connect();
    vi.runAllTimers();

    // Unsubscribe handler1 before the reconnect happens
    unsub1();

    // --- Simulate disconnect + reconnect ---
    const ws1 = useWsStore.getState()._ws as unknown as MockWebSocket;
    ws1.readyState = MockWebSocket.CLOSED;
    ws1.onclose?.(new CloseEvent('close'));

    vi.runAllTimers(); // reconnect timer
    vi.runAllTimers(); // MockWebSocket constructor onopen

    // handler1 was unsubscribed — should NOT have been called
    expect(handler1).not.toHaveBeenCalled();
    // handler2 should still be called
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
