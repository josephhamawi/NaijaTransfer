/**
 * PM2 Ecosystem Configuration
 * Production process manager for NigeriaTransfer on Oracle ARM VM.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart naijatransfer
 *   pm2 logs naijatransfer
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: "naijatransfer",
      // Custom Node server — disables Node's 5-minute request
      // timeout so long uploads (2 GB / 9+ min) aren't killed
      // mid-stream. `next start` doesn't let us tune this.
      script: "server.js",
      cwd: "/home/naija/NaijaTransfer",
      // Matches the running fork-mode instance on prod. Moving to
      // cluster mode requires `pm2 delete && pm2 start`, which is a
      // separate operation — don't force it in `startOrReload`.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "4G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      error_file: "/var/log/naijatransfer/error.log",
      out_file: "/var/log/naijatransfer/out.log",
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
