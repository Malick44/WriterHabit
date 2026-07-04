#!/usr/bin/env bash
# Upload a repacked Supertonic archive (from repack-supertonic-voices.sh) to
# Supabase storage and print the public URL for catalog.ts.
#
# Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.supabase-admin at
# the repo root (same convention as scripts/supabase-admin.mjs).
#
# Usage: scripts/tts/upload-supertonic-archive.sh <archive.tar.bz2>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BUCKET="tts-models"

ARCHIVE="${1:?usage: upload-supertonic-archive.sh <archive.tar.bz2>}"
if [[ ! -f "${ARCHIVE}" ]]; then
  echo "ERROR: no such file: ${ARCHIVE}" >&2
  exit 1
fi

ENV_FILE="${REPO_ROOT}/.env.supabase-admin"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi
: "${SUPABASE_URL:?SUPABASE_URL not set (expected in .env.supabase-admin)}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY not set}"

AUTH=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}")
NAME="$(basename "${ARCHIVE}")"

echo "==> Ensuring public bucket \"${BUCKET}\" exists"
create_status=$(curl -s -o /tmp/bucket-create.json -w "%{http_code}" -X POST \
  "${SUPABASE_URL}/storage/v1/bucket" \
  "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"id\":\"${BUCKET}\",\"name\":\"${BUCKET}\",\"public\":true}")
if [[ "${create_status}" != "200" && "${create_status}" != "409" ]]; then
  # 409 = already exists; anything else is a real failure.
  if ! grep -qi "already" /tmp/bucket-create.json; then
    echo "ERROR: bucket creation failed (HTTP ${create_status}):" >&2
    cat /tmp/bucket-create.json >&2
    exit 1
  fi
fi

echo "==> Uploading ${NAME} ($(du -h "${ARCHIVE}" | cut -f1)) — this can take a while"
upload_status=$(curl -s -o /tmp/upload-result.json -w "%{http_code}" -X POST \
  "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${NAME}" \
  "${AUTH[@]}" \
  -H "Content-Type: application/octet-stream" \
  -H "x-upsert: true" \
  --data-binary "@${ARCHIVE}")
if [[ "${upload_status}" != "200" ]]; then
  echo "ERROR: upload failed (HTTP ${upload_status}):" >&2
  cat /tmp/upload-result.json >&2
  echo "" >&2
  echo "Hint: the project-level storage upload limit (Dashboard → Settings →" >&2
  echo "Storage) must be at least the archive size (~123 MB)." >&2
  exit 1
fi

PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${NAME}"
SIZE_BYTES=$(stat -f%z "${ARCHIVE}" 2>/dev/null || stat -c%s "${ARCHIVE}")

echo ""
echo "Uploaded ✓"
echo "  Public URL: ${PUBLIC_URL}"
echo "  sizeBytes:  ${SIZE_BYTES}"
echo ""
echo "Update apps/mobile/src/services/speech/sherpa/catalog.ts:"
echo "  archiveUrl: \"${PUBLIC_URL}\","
echo "  sizeBytes: ${SIZE_BYTES},"
