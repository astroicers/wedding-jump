module.exports = {
    apps: [
      {
        name: "api",
        script: "server/api.js",
        watch: false
      },
      {
        name: "ws-server",
        script: "server/ws-server.js",
        watch: false
      },
      {
        name: "nuxt",
        script: "npm",
        args: "run dev",
        watch: false,
        env: {
          NODE_ENV: "development",
          NUXT_HOST: "0.0.0.0",
          NUXT_PORT: "3000"
        }
      }
    ]
  };
  