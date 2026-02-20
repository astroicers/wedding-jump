// 直接WebSocket連接，避免過度封裝
export const useDirectWebSocket = () => {
  const config = useRuntimeConfig();
  const wsUrl = config.public.wsUrl || 'ws://localhost:3001';
  
  let ws = null;
  let messageHandlers = new Map();
  let isConnected = ref(false);
  
  const connect = (clientId) => {
    return new Promise((resolve, reject) => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log(`✅ WebSocket connected as ${clientId}`);
          isConnected.value = true;
          
          // 立即發送join消息
          ws.send(JSON.stringify({ type: 'join', name: clientId }));
          resolve(ws);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Received:', data.type, data);
            
            // 觸發對應的處理器
            const handler = messageHandlers.get(data.type);
            if (handler) {
              handler(data);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          isConnected.value = false;
          reject(error);
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          isConnected.value = false;
        };
        
      } catch (error) {
        reject(error);
      }
    });
  };
  
  const send = (data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    console.error('Cannot send - WebSocket not connected');
    return false;
  };
  
  const onMessage = (type, handler) => {
    messageHandlers.set(type, handler);
  };
  
  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };
  
  return {
    connect,
    send,
    onMessage,
    disconnect,
    isConnected
  };
};