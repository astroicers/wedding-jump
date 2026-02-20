module.exports = {
  apps: [
    {
      name: 'frontend',
      script: './static-server.cjs',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'api-server',
      script: './server/src/api.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3002,
      },
    },
    {
      name: 'ws-server',
      script: './server/src/ws-server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001,
      },
    },
  ],
};
