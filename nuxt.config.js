export default defineNuxtConfig({
  plugins: [
    { src: '~/plugins/ws-client.js', mode: 'client' }
  ],
  buildModules: [
    '@nuxtjs/axios'
  ],
  axios: {
    baseURL: 'http://localhost:3002' // API 伺服器的基礎 URL
  }
});
