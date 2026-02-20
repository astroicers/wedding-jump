export default defineNuxtConfig({
  modules: [],
  plugins: [
    { src: '~/plugins/ws-client.js', mode: 'client' }
  ],
  buildModules: [
    '@nuxtjs/axios'
  ],
  axios: {
    baseURL: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3002'
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    apiSecret: process.env.API_SECRET,
    
    // Public keys (exposed to client-side)
    public: {
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3002'
    }
  },
  nitro: {
    host: process.env.NUXT_HOST || 'localhost',
    port: process.env.NUXT_PORT || 3000
  }
});
