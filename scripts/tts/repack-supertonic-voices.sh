#!/usr/bin/env bash
# Repack the sherpa-onnx Supertonic-3 archive with a rebuilt voice.bin.
#
# Downloads the official k2-fsa release archive and the 10 stock voice-style
# JSONs (F1–F5, M1–M5) from HuggingFace, merges in any custom styles from
# scripts/tts/custom-voice-styles/, packs them with the official
# generate_voices_bin.py (vendored), swaps voice.bin inside the archive, and
# re-compresses it for hosting.
#
# Speaker ids are assigned by ALPHABETICAL filename order. Stock files are
# F1.json … M5.json (sid 0–9); custom styles are copied with a "Z-" prefix so
# they always sort after the stock set (sid 10+), keeping the app's existing
# speakerId mapping stable.
#
# Usage:
#   scripts/tts/repack-supertonic-voices.sh            # stock 10 voices only
#   scripts/tts/repack-supertonic-voices.sh --verify   # + byte-compare rebuilt
#                                                        voice.bin vs original
#
# Requires: bash, curl, tar (bzip2 support), python3 with numpy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${SCRIPT_DIR}/.work"
CUSTOM_STYLES_DIR="${SCRIPT_DIR}/custom-voice-styles"
OUT_DIR="${SCRIPT_DIR}/dist"

MODEL_ID="sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
ARCHIVE_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/${MODEL_ID}.tar.bz2"
HF_STYLES_BASE="https://huggingface.co/Supertone/supertonic-3/resolve/main/voice_styles"
STOCK_STYLES=(F1 F2 F3 F4 F5 M1 M2 M3 M4 M5)

VERIFY=0
if [[ "${1:-}" == "--verify" ]]; then
  VERIFY=1
fi

mkdir -p "${WORK_DIR}/styles" "${OUT_DIR}"

# 1. Official archive (cached across runs).
ARCHIVE_PATH="${WORK_DIR}/${MODEL_ID}.tar.bz2"
if [[ ! -f "${ARCHIVE_PATH}" ]]; then
  echo "==> Downloading official archive (~123 MB)"
  curl -fL --progress-bar "${ARCHIVE_URL}" -o "${ARCHIVE_PATH}"
else
  echo "==> Using cached archive ${ARCHIVE_PATH}"
fi

# 2. Stock voice-style JSONs (cached across runs).
echo "==> Fetching stock voice styles"
for style in "${STOCK_STYLES[@]}"; do
  target="${WORK_DIR}/styles/${style}.json"
  if [[ ! -f "${target}" ]]; then
    curl -fsSL "${HF_STYLES_BASE}/${style}.json" -o "${target}"
    echo "    ${style}.json downloaded"
  fi
done

# 3. Assemble the merge directory: stock + custom (custom sorts last via Z-).
MERGE_DIR="${WORK_DIR}/merge"
rm -rf "${MERGE_DIR}"
mkdir -p "${MERGE_DIR}"
cp "${WORK_DIR}/styles/"*.json "${MERGE_DIR}/"

CUSTOM_COUNT=0
if [[ -d "${CUSTOM_STYLES_DIR}" ]]; then
  while IFS= read -r -d '' style_file; do
    base="$(basename "${style_file}")"
    cp "${style_file}" "${MERGE_DIR}/Z-${base}"
    CUSTOM_COUNT=$((CUSTOM_COUNT + 1))
  done < <(find "${CUSTOM_STYLES_DIR}" -name '*.json' -print0 | sort -z)
fi

# 4. Pack voice.bin with the official (vendored) script.
echo "==> Building voice.bin ($((10 + CUSTOM_COUNT)) voices)"
NEW_VOICE_BIN="${WORK_DIR}/voice.bin"
python3 "${SCRIPT_DIR}/vendor/generate_voices_bin.py" "${MERGE_DIR}" "${NEW_VOICE_BIN}"

# 5. Extract the archive, swap voice.bin, re-compress.
EXTRACT_DIR="${WORK_DIR}/extract"
rm -rf "${EXTRACT_DIR}"
mkdir -p "${EXTRACT_DIR}"
echo "==> Extracting official archive"
tar -xjf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"

MODEL_DIR="${EXTRACT_DIR}/$(ls "${EXTRACT_DIR}")"
if [[ ! -f "${MODEL_DIR}/voice.bin" ]]; then
  echo "ERROR: voice.bin not found in extracted archive" >&2
  exit 1
fi

if [[ "${VERIFY}" == "1" ]]; then
  echo "==> Verifying rebuilt voice.bin against the shipped one"
  python3 "${SCRIPT_DIR}/verify_voices_bin.py" "${NEW_VOICE_BIN}" "${MODEL_DIR}/voice.bin"
else
  python3 "${SCRIPT_DIR}/verify_voices_bin.py" "${NEW_VOICE_BIN}"
fi

cp "${NEW_VOICE_BIN}" "${MODEL_DIR}/voice.bin"

SUFFIX="writerhabit-$((10 + CUSTOM_COUNT))v"
OUT_ARCHIVE="${OUT_DIR}/${MODEL_ID}-${SUFFIX}.tar.bz2"
echo "==> Repacking → ${OUT_ARCHIVE}"
tar -cjf "${OUT_ARCHIVE}" -C "${EXTRACT_DIR}" "$(basename "${MODEL_DIR}")"

# 6. Report the sid table so catalog.ts speakerId edits are unambiguous.
echo ""
echo "Speaker id table (alphabetical merge order):"
sid=0
for f in $(ls "${MERGE_DIR}" | sort); do
  echo "  sid ${sid} → ${f%.json}"
  sid=$((sid + 1))
done
echo ""
echo "Done: $(du -h "${OUT_ARCHIVE}" | cut -f1) $(basename "${OUT_ARCHIVE}")"
echo "Next: host this archive (e.g. Supabase storage), then update"
echo "      apps/mobile/src/services/speech/sherpa/catalog.ts →"
echo "      archiveUrl, sizeBytes ($(stat -f%z "${OUT_ARCHIVE}") bytes), and id"
echo "      (bump the id so already-installed devices re-download)."
