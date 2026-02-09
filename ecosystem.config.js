module.exports = {
  apps: [
    {
      name: 'ubora-frontend',
      script: 'npx',
      args: 'http-server ./dist/ubora-frontend -p 8080 -a 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
}
