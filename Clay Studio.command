#!/bin/bash
cd "$(dirname "$0")"
osascript -e 'display notification "The first open can take a few minutes." with title "Clay Studio"' >/dev/null 2>&1 || true
exec /bin/bash "./scripts/bootstrap.sh"
