#!/bin/bash
# Finds a Node 20+ binary, downloading the pinned one into .clay/runtime on first use.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION="$(tr -d '[:space:]' < "$ROOT/scripts/node-version.txt")"
RUNTIME="$ROOT/.clay/runtime/node"

version_ok() {
  [ -x "$1" ] || return 1
  "$1" -e "const major = Number(process.versions.node.split('.')[0]); process.exit(major >= 20 ? 0 : 1)"
}

pick_node() {
  local candidate
  for candidate in "$RUNTIME/bin/node" "$(command -v node 2>/dev/null || true)" /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -n "$candidate" ] && version_ok "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

install_node() {
  local os arch url tmp
  os="$(uname -s)"
  case "$os" in
    Darwin) os="darwin" ;;
    Linux) os="linux" ;;
    *)
      echo "On Windows, double-click Clay Studio.bat."
      exit 1
      ;;
  esac
  arch="$(uname -m)"
  case "$arch" in
    arm64 | aarch64) arch="arm64" ;;
    x86_64) arch="x64" ;;
    *)
      echo "This computer's chip ($arch) is not supported."
      exit 1
      ;;
  esac
  url="https://nodejs.org/dist/${VERSION}/node-${VERSION}-${os}-${arch}.tar.gz"
  echo "Downloading Node ${VERSION}. This happens once."
  tmp="$(mktemp -d)"
  curl -fL --retry 3 --retry-delay 2 -o "$tmp/node.tar.gz" "$url"
  mkdir -p "$ROOT/.clay/runtime"
  rm -rf "$RUNTIME"
  tar -xzf "$tmp/node.tar.gz" -C "$tmp"
  mv "$tmp/node-${VERSION}-${os}-${arch}" "$RUNTIME"
  rm -rf "$tmp"
}

NODE="$(pick_node || true)"
if [ -z "$NODE" ]; then
  install_node
  NODE="$RUNTIME/bin/node"
fi

export PATH="$(dirname "$NODE"):${PATH:-}"
"$NODE" "$ROOT/scripts/launch.js" "$@"
status=$?
if [ "$status" -ne 0 ]; then
  echo ""
  echo "Clay Studio did not start."
  if [ -t 0 ]; then
    read -r -p "Press Return to close..."
  fi
fi
exit "$status"
