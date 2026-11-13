#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Storage lifecycle rule — the backstop on bytes at rest.
#
# The cleanup job deletes objects when a transfer expires. If that job
# breaks, nothing else notices and storage grows forever at ~$0.02 per
# GB-month. This rule makes the bucket itself enforce an upper bound.
#
# Everything the app writes lives under `transfers/` — final objects,
# and the `.compose-NNNN` scratch objects multipart assembly creates.
# The longest product expiry is 60 days (BUSINESS), so a 90-day delete
# can only ever catch objects the cleanup job failed to remove.
#
# This is a safety net, not the mechanism: a transfer that expires on
# day 7 must still be deleted on day 7 by the cleanup job, or users
# would keep downloading past expiry.
#
# Usage:
#   bash scripts/set-storage-lifecycle.sh [bucket] [project]
# ─────────────────────────────────────────────────────────
set -euo pipefail

BUCKET="${1:-naijatransfer.firebasestorage.app}"
PROJECT="${2:-naijatransfer}"
TMP="$(mktemp -t lifecycle)"
trap 'rm -f "$TMP"' EXIT

cat > "$TMP" <<'JSON'
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 90,
          "matchesPrefix": ["transfers/"]
        }
      }
    ]
  }
}
JSON

echo "Applying lifecycle rule to gs://$BUCKET …"
gcloud storage buckets update "gs://$BUCKET" \
  --project "$PROJECT" \
  --lifecycle-file="$TMP"

echo
echo "Current rules:"
gcloud storage buckets describe "gs://$BUCKET" --project "$PROJECT" \
  --format="yaml(lifecycle)"
