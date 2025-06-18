export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;
    
    const createWebSocket = () => {
      try {
        const config = useRuntimeConfig();
        // Priority: 1. Environment variable, 2. Auto-detect from current port, 3. Default
        let wsUrl = config.public.wsUrl;
        
        if (!wsUrl) {
          const currentPort = window.location.port;
          const wsPort = currentPort ? (parseInt(currentPort) + 1) : 3001;
          wsUrl = `ws://${window.location.hostname}:${wsPort}`;
        }
        
        console.log('Connecting to WebSocket:', wsUrl);
        console.log('Window location:', window.location.href);
        console.log('Config wsUrl:', config.public.wsUrl);
        const finalUrl = wsUrl.replace('http:', 'ws:').replace('https:', 'wss:');
        console.log('Final WebSocket URL:', finalUrl);
        ws = new WebSocket(finalUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          reconnectAttempts = 0;
          
          // Notify components about connection status
          if (nuxtApp.$router?.currentRoute?.value?.name) {
            window.dispatchEvent(new CustomEvent('websocket-connected'));
          }
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          
          // Notify components about disconnection
          window.dispatchEvent(new CustomEvent('websocket-disconnected'));
          
          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
              createWebSocket();
            }, reconnectDelay * reconnectAttempts);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached. Please refresh the page.');
            window.dispatchEvent(new CustomEvent('websocket-max-retries'));
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          console.error('Failed URL was:', finalUrl);
          console.error('Error details:', {
            readyState: ws.readyState,
            url: ws.url || finalUrl
          });
          window.dispatchEvent(new CustomEvent('websocket-error', { detail: error }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Dispatch custom events for different message types
            window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
            
            // CRITICAL FIX: Also trigger for any legacy handlers
            if (wsWrapper._onmessage) {
              wsWrapper._onmessage(event);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        
        // Fallback to regular WebSocket if secure connection fails
        if (error.message?.includes('wss')) {
          console.log('Falling back to insecure WebSocket connection...');
          const config = useRuntimeConfig();
          let wsUrl = config.public.wsUrl;
          
          if (!wsUrl) {
            const currentPort = window.location.port;
            const wsPort = currentPort ? (parseInt(currentPort) + 1) : 3001;
            wsUrl = `ws://${window.location.hostname}:${wsPort}`;
          }
          
          ws = new WebSocket(wsUrl);
          setupWebSocketHandlers();
        }
      }
    };
    
    const setupWebSocketHandlers = () => {
      if (!ws) return;
      
      ws.onopen = () => {
        console.log('WebSocket connected (fallback)');
        reconnectAttempts = 0;
        window.dispatchEvent(new CustomEvent('websocket-connected'));
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code);
        window.dispatchEvent(new CustomEvent('websocket-disconnected'));
        
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => createWebSocket(), reconnectDelay * reconnectAttempts);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket Error (fallback):', error);
        window.dispatchEvent(new CustomEvent('websocket-error', { detail: error }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };
    
    // Enhanced WebSocket wrapper with additional methods
    const wsWrapper = {
      get readyState() {
        return ws?.readyState || WebSocket.CLOSED;
      },
      
      send(data) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(data);
            return true;
          } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
          }
        } else {
          console.warn('WebSocket is not connected. Message not sent:', data);
          return false;
        }
      },
      
      close(code = 1000, reason = 'Normal closure') {
        if (ws) {
          ws.close(code, reason);
        }
      },
      
      reconnect() {
        if (ws) {
          ws.close();
        }
        reconnectAttempts = 0;
        createWebSocket();
      },
      
      // Legacy event handlers for backward compatibility
      set onopen(handler) {
        console.warn('⚠️ Using legacy onopen handler - consider using websocket-connected event');
        if (ws) ws.addEventListener('open', handler);
      },
      
      set onclose(handler) {
        console.warn('⚠️ Using legacy onclose handler - consider using websocket-disconnected event');
        if (ws) ws.addEventListener('close', handler);
      },
      
      set onerror(handler) {
        console.warn('⚠️ Using legacy onerror handler - consider using websocket-error event');
        if (ws) ws.addEventListener('error', handler);
      },
      
      set onmessage(handler) {
        console.warn('⚠️ Using legacy onmessage handler - consider using websocket-message event');
        wsWrapper._onmessage = handler;
      },
      
      // Get actual WebSocket instance for debugging
      get ws() {
        return ws;
      }
    };
    
    // Initialize WebSocket connection
    createWebSocket();
    
    // Provide the enhanced wrapper
    nuxtApp.provide('websocket', wsWrapper);
    
    // Cleanup on app unmount
    nuxtApp.hook('app:beforeUnmount', () => {
      if (ws) {
        ws.close(1000, 'App unmounting');
      }
    });
  }
});