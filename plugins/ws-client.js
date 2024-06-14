export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const ws = new WebSocket('ws://wedding-jump-production.up.railway.app:3001');
    
    ws.onopen = () => {
      console.log('WebSocket connected.');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    nuxtApp.provide('websocket', ws);
  }
});
