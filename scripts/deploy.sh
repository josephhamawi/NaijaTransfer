#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# NigeriaTransfer — Production deploy
# Runs on the server (invoked by .github/workflows/deploy.yml).
#
# Does three things the default `git pull && build && pm2 restart` doesn't:
#
#   1. Stamps BUILD_ID into the build so next.config's deploymentId /
#      skew-protection kicks in. Old tabs that request dead chunk hashes
#      will hard-refresh instead of crashing with React #418/#423.
#
#   2. Preserves the PREVIOUS build's static chunks by copying them into
#      the new .next/static tree after build finishes. Any client loaded
#      just before the deploy can still fetch its chunks for a grace
#      period, so the transition is seamless.
#
#   3. Uses `pm2 reload` (not `restart`) so the cluster workers roll one
#      at a time. Combined with the bumped kill_timeout in
#      ecosystem.config.js, in-flight large uploads get up to 2h to
#      finish before the old worker is killed.
# ─────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="${APP_DIR:-/home/naija/NaijaTransfer}"
PM2_APP="${PM2_APP:-nigeriatransfer}"

cd "$APP_DIR"

echo "==> Pulling latest code"
git fetch --all --prune
git reset --hard origin/main

# Stable, per-deploy build ID. Next.js bakes this into every chunk URL and
# client bundle; clients with a different ID are considered skewed and will
# hard-refresh on their next navigation instead of fetching missing chunks.
BUILD_ID="$(git rev-parse HEAD)"
export BUILD_ID
echo "==> BUILD_ID=$BUILD_ID"

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running database migrations"
npx prisma migrate deploy

# ── Preserve previous build's static assets ──────────────────────────
# `next build` rewrites .next/ in-place. Save the old static tree first so
# we can graft it back in after the build. This keeps old chunk hashes
# resolvable for the grace period (until skew-protection triggers a hard
# refresh on the stale client).
PREV_STATIC="$APP_DIR/.next-static-previous"
if [[ -d "$APP_DIR/.next/static" ]]; then
  echo "==> Saving previous .next/static to $PREV_STATIC"
  rm -rf "$PREV_STATIC"
  cp -r "$APP_DIR/.next/static" "$PREV_STATIC"
fi

echo "==> Building Next.js"
npm run build

# Graft the previous static tree into the new build — ONLY for files the
# new build doesn't already have. This way:
#   - New chunks win (they share names if-and-only-if they're identical).
#   - Old chunks remain reachable for clients that loaded before the deploy.
#   - No stale manifest / build-artifact overwrites happen.
if [[ -d "$PREV_STATIC" ]]; then
  echo "==> Merging previous chunks back into .next/static"
  # cp -rn = recursive, never overwrite. Portable across GNU/BSD cp.
  cp -rn "$PREV_STATIC/." "$APP_DIR/.next/static/" || true
fi

# Update Caddy if the committed Caddyfile changed on disk.
if [[ -f "$APP_DIR/Caddyfile" ]]; then
  if ! cmp -s "$APP_DIR/Caddyfile" /etc/caddy/Caddyfile 2>/dev/null; then
    echo "==> Caddyfile changed — copying and reloading Caddy"
    sudo cp "$APP_DIR/Caddyfile" /etc/caddy/Caddyfile
    sudo caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  fi
fi

# ── Rolling reload ───────────────────────────────────────────────────
# `pm2 reload` in cluster mode:
#   - starts a fresh worker with the new build
#   - waits for it to listen on PORT
#   - sends SIGINT to the old worker and waits up to kill_timeout
#     (7.2M ms = 2h, per ecosystem.config.js) for it to finish serving
#     any in-flight requests (e.g. a 4GB upload still streaming).
# At least one worker is always accepting traffic. No dropped uploads.
echo "==> pm2 reload $PM2_APP"
pm2 reload "$PM2_APP" --update-env

# Health check
echo "==> Waiting for health check"
for attempt in {1..12}; do
  sleep 2
  status="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || true)"
  if [[ "$status" == "200" ]]; then
    echo "==> Healthy ($status)"
    exit 0
  fi
  echo "    attempt $attempt: $status"
done

echo "!! Health check failed"
pm2 logs "$PM2_APP" --lines 50 --nostream
exit 1
