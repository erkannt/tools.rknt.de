#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "→ Building app..."
pnpm build

echo "→ Starting static server..."
rm -rf /tmp/rituals-e2e
mkdir -p /tmp/rituals-e2e/rituals
cp -r dist/* /tmp/rituals-e2e/rituals/
cd /tmp/rituals-e2e
python3 -m http.server 8080 > /tmp/rituals-e2e.log 2>&1 &
SERVER_PID=$!
cd "$REPO_DIR"

cleanup() {
  echo "→ Cleaning up..."
  kill "$SERVER_PID" 2>/dev/null || true
  uvx rodney stop --local 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server to be ready
for i in {1..30}; do
  if curl -s -o /dev/null http://127.0.0.1:8080/rituals/; then
    break
  fi
  sleep 0.5
done

echo "→ Starting Rodney..."
uvx rodney start --local

echo "→ Opening app..."
uvx rodney open http://127.0.0.1:8080/rituals/

echo "→ Clearing localStorage..."
uvx rodney js 'localStorage.clear()'
uvx rodney reload

echo "→ Creating ritual with timer..."
uvx rodney click '.actions a:last-child'
uvx rodney wait '#name-input'
uvx rodney input '#name-input' 'Timer Test'
uvx rodney js $'(function(el){ el.value="step 1\\nstep 2 3"; el.dispatchEvent(new Event("input",{bubbles:true})); return el.value })(document.querySelector("#text"))'
uvx rodney click 'button[type="submit"]'

echo "→ Opening ritual view..."
uvx rodney click '.rituals-button-list a'

echo "→ Patching AudioContext to detect oscillator creation..."
uvx rodney js $'(function(){ var proto=AudioContext.prototype; var origOsc=proto.createOscillator; window.oscCreated=false; proto.createOscillator=function(){ window.oscCreated=true; return origOsc.call(this); }; return "patched" })()'

echo "→ Checking first checkbox to start countdown..."
uvx rodney click '#cb-0'

echo "→ Verifying countdown bar started..."
WIDTH=$(uvx rodney js 'document.querySelector(".countdown-bar").style.width')
if [ "$WIDTH" != "100%" ]; then
  echo "✗ Countdown bar did not start (width: $WIDTH)"
  exit 1
fi

echo "→ Waiting for countdown to finish..."
uvx rodney sleep 4

echo "→ Asserting audio was played..."
uvx rodney assert 'window.oscCreated'
echo "✓ Countdown audio test passed"

echo "→ Testing share flow..."
uvx rodney click 'nav a:first-child'
uvx rodney click '.actions a:first-child'
uvx rodney click '.rituals-checkbox-list input'
uvx rodney click 'button'
TITLE=$(uvx rodney text 'h1')
if ! echo "$TITLE" | grep -q 'sharable link copied to clipboard'; then
  echo "✗ Share flow failed. Got title: $TITLE"
  exit 1
fi
echo "✓ Share flow test passed"

echo ""
echo "All E2E tests passed!"
