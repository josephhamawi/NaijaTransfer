/**
 * PM2 Ecosystem Configuration
 * Production process manager for NigeriaTransfer on Oracle ARM VM.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart nigeriatransfer
 *   pm2 logs nigeriatransfer
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: "nigeriatransfer",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/nigeriatransfer",
      instances: 2, // 2 instances across 4 OCPUs
      exec_mode: "cluster", // Cluster mode for load balancing
      max_memory_restart: "4G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      error_file: "/var/log/nigeriatransfer/error.log",
      out_file: "/var/log/nigeriatransfer/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Restart policy
      restart_delay: 5000, // 5 seconds between restarts
      max_restarts: 10, // Max 10 restarts before stopping
      min_uptime: "10s", // Minimum uptime to consider started
      // Graceful shutdown: give in-flight uploads up to 2h to finish before
      // SIGKILL. Matches Caddy's upload read/write_timeout (2h) so a `pm2
      // reload` during deploy won't kill a user's large upload mid-stream.
      kill_timeout: 7_200_000,
      listen_timeout: 30_000,
      // Required for graceful shutdown: next.js responds to SIGINT, so PM2
      // must send SIGINT (not the default SIGTERM) and wait for the process
      // to exit on its own.
      shutdown_with_message: false,
      wait_ready: false,
      // Watch (disabled in production)
      watch: false,
    },
  ],
};
