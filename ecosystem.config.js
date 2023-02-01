module.exports = {
  apps: [{
    name: 'radarr-checkerr',
    script: '/app/radarr-checkerr.js',
    cron_restart: process.env.CRON_SCHEDULE,
    autorestart: false,
  }]
}
