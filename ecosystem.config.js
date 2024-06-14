module.exports = {
    apps: [
      {
        name: "api",
        script: "server/api.js",
        watch: true
      },
      {
        name: "ws-server",
        script: "server/ws-server.js",
        watch: true
      },
      {
        name: "nuxt",
        script: "npm",
        args: "run dev",
        watch: true
      }
    ]
  };
  