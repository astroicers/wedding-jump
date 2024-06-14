export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const ws = new WebSocket('wss://wedding-jump-production.up.railway.app:3001');
    
    ws.onopen = () => {
      console.log('WebSocket connected.');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    nuxtApp.provide('websocket', ws);
  }
});
