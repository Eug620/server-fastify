module.exports = {
  apps: [
    {
      name: 'server-fastify',
      script: './dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_dev: {
        NODE_ENV: 'dev'
      },
      env_prod: {
        NODE_ENV: 'production'
      }
    }
  ]
};