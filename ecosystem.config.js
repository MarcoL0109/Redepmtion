module.exports = {
  apps: [
    {
      name: 'api',
      script: './Backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'sockets',
      script: './Backend/sockets/socketServer.js',
      instances: 1,
      autorestart: true,
      watch: false,
    }
  ]
};