#!/bin/bash
cd "$(dirname "$0")"
osascript -e 'display notification "The first open installs Node.js 26 and npm if they are missing." with title "Clay Studio"' >/dev/null 2>&1 || true
exec /bin/bash "./scripts/bootstrap.sh"
