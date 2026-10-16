#!/usr/bin/env bash
# Render resume.html to assets/Warren-Wong-Resume.pdf (2 x A4) with headless Chrome.
# Usage: scripts/build-resume-pdf.sh   (run from anywhere; needs Google Chrome + python3)
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
command -v google-chrome >/dev/null 2>&1 && CHROME="${CHROME_BIN:-google-chrome}"
PORT="${PORT:-4199}"

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=6000 \
  --print-to-pdf=assets/Warren-Wong-Resume.pdf \
  "http://localhost:$PORT/resume.html"

echo "Wrote assets/Warren-Wong-Resume.pdf"
