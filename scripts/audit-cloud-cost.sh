#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Cloud cost audit — run after every backend change.
#
# The single most common cause of a surprise Google Cloud bill is a
# Cloud Run service (or a gen2 / Firebase v2 function) left with
# min-instances >= 1. One warm 2 vCPU / 2 GB instance bills roughly
# $25–40 a month doing nothing at all, which is several times the
# Hetzner VM this migration exists to cancel.
#
# Usage:
#   bash scripts/audit-cloud-cost.sh [project] [account]
#
# The account matters: project `naijatransfer` belongs to
# kodefoundryatelier@gmail.com, not the gcloud default. Without it every
# check returns "not accessible" and the audit looks clean when it is
# simply blind.
#
#   bash scripts/audit-cloud-cost.sh naijatransfer kodefoundryatelier@gmail.com
#
# Exits non-zero if anything is billing while idle.
# ─────────────────────────────────────────────────────────
set -uo pipefail

PROJECT="${1:-naijatransfer}"
ACCOUNT="${2:-}"
GC=(gcloud --project "$PROJECT")
[ -n "$ACCOUNT" ] && GC+=(--account "$ACCOUNT")

FINDINGS=0

echo "── Cloud cost audit: $PROJECT ───────────────────────"

# ── Cloud Run services (App Hosting backends show up here too) ──────
echo
echo "Cloud Run services:"
services=$("${GC[@]}" run services list --format="value(metadata.name,metadata.labels.cloud\.googleapis\.com/location)" 2>/dev/null)
if [ -z "$services" ]; then
  echo "  (none, or the Cloud Run API is not enabled / not accessible)"
else
  while read -r name region; do
    [ -z "$name" ] && continue
    min=$("${GC[@]}" run services describe "$name" --region "$region" \
      --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])" 2>/dev/null)
    max=$("${GC[@]}" run services describe "$name" --region "$region" \
      --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])" 2>/dev/null)
    min=${min:-0}
    if [ "$min" -gt 0 ] 2>/dev/null; then
      echo "  ✗ $name ($region): min-instances=$min — BILLING WHILE IDLE"
      echo "      fix: gcloud run services update $name --region $region --min-instances=0 --project $PROJECT"
      FINDINGS=$((FINDINGS + 1))
    else
      echo "  ✓ $name ($region): scales to zero (max=${max:-unset})"
    fi
    if [ -z "$max" ]; then
      echo "      note: no maxInstances cap — a traffic spike has no ceiling"
      FINDINGS=$((FINDINGS + 1))
    fi
  done <<< "$services"
fi

# ── Cloud Functions (gen2 are Cloud Run under the hood) ─────────────
echo
echo "Cloud Functions (gen2):"
fns=$("${GC[@]}" functions list --format="value(name,serviceConfig.minInstanceCount)" 2>/dev/null)
if [ -z "$fns" ]; then
  echo "  (none, or the API is not enabled / not accessible)"
else
  while read -r name min; do
    [ -z "$name" ] && continue
    min=${min:-0}
    if [ "$min" -gt 0 ] 2>/dev/null; then
      echo "  ✗ $name: minInstances=$min — BILLING WHILE IDLE"
      FINDINGS=$((FINDINGS + 1))
    else
      echo "  ✓ $(basename "$name"): scales to zero"
    fi
  done <<< "$fns"
fi

# ── Storage: lifecycle rules are the backstop on stored bytes ───────
echo
echo "Storage lifecycle:"
for bucket in $("${GC[@]}" storage buckets list --format="value(name)" 2>/dev/null); do
  rules=$("${GC[@]}" storage buckets describe "gs://$bucket" \
    --format="value(lifecycle.rule)" 2>/dev/null)
  if [ -z "$rules" ] || [ "$rules" = "[]" ]; then
    echo "  ✗ gs://$bucket: no lifecycle rule — expired objects accrue forever"
    echo "      fix: bash scripts/set-storage-lifecycle.sh $bucket"
    FINDINGS=$((FINDINGS + 1))
  else
    echo "  ✓ gs://$bucket: lifecycle rule present"
  fi
done

# ── Budget alerts notify; they do not cap ───────────────────────────
echo
echo "Reminder: a billing budget only SENDS ALERTS. It does not stop"
echo "spend. The real caps in this project are maxInstances (compute),"
echo "the storage lifecycle rule (bytes at rest), and"
echo "EGRESS_BUDGET_GB_MONTH in src/lib/egress.ts (bandwidth)."

echo
if [ "$FINDINGS" -gt 0 ]; then
  echo "── $FINDINGS finding(s) — fix before leaving this running ──"
  exit 1
fi
echo "── Clean: nothing bills while idle ──"
