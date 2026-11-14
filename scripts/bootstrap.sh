#!/bin/bash
# Uses Node.js 26 with npm. Downloads the official archive when either is missing.
# The install rule matches needsRuntimeInstall in launch-plan.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION="$(tr -d '[:space:]' < "$ROOT/scripts/node-version.txt")"
PIN_BARE="${VERSION#v}"
PIN_MAJOR="${PIN_BARE%%.*}"
RUNTIME="$ROOT/.clay/runtime/node"

node_version() {
  "$1" -p "process.versions.node" 2>/dev/null || true
}

npm_beside() {
  local npm="$1"
  [ -n "$npm" ] && [ -x "$npm" ] || return 1
  PATH="$(dirname "$npm"):${PATH:-}" "$npm" --version >/dev/null 2>&1
}

# private=yes requires the pinned patch. Otherwise the pinned major plus a sibling npm is enough.
usable() {
  local exe="$1" private="$2" ver npm
  [ -x "$exe" ] || return 1
  ver="$(node_version "$exe")"
  [ -n "$ver" ] || return 1
  npm="$(dirname "$exe")/npm"
  if [ "$private" = "yes" ]; then
    [ "$ver" = "$PIN_BARE" ] || return 1
  else
    [ "${ver%%.*}" = "$PIN_MAJOR" ] || return 1
  fi
  npm_beside "$npm"
}

pick_node() {
  local candidate
  if usable "$RUNTIME/bin/node" yes; then
    printf '%s\n' "$RUNTIME/bin/node"
    return 0
  fi
  for candidate in "$(command -v node 2>/dev/null || true)" /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -n "$candidate" ] && usable "$candidate" no; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

install_reason() {
  local exe ver npm
  exe="$(command -v node 2>/dev/null || true)"
  ver=""
  if [ -n "$exe" ] && [ -x "$exe" ]; then
    ver="$(node_version "$exe")"
  fi
  npm=""
  if [ -n "$exe" ]; then
    npm="$(dirname "$exe")/npm"
  fi
  if [ -z "$ver" ]; then
    echo "Node.js ${PIN_MAJOR} is not installed. Downloading it with npm. This happens once."
  elif [ "${ver%%.*}" = "$PIN_MAJOR" ] && ! npm_beside "$npm"; then
    echo "Node.js ${ver} is installed, and npm is not. Downloading Node.js ${VERSION}, which includes npm."
  else
    echo "Clay Studio uses Node.js ${PIN_MAJOR}. Downloading ${VERSION} with npm. This happens once."
  fi
}

install_node() {
  local os arch url tmp name sums expected actual
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
  name="node-${VERSION}-${os}-${arch}"
  url="https://nodejs.org/dist/${VERSION}/${name}.tar.gz"
  install_reason
  tmp="$(mktemp -d)"
  curl -fL --retry 3 --retry-delay 2 -# -o "$tmp/node.tar.gz" "$url"
  echo "Checking the download…"
  sums="$(curl -fsSL --retry 3 --retry-delay 2 "https://nodejs.org/dist/${VERSION}/SHASUMS256.txt")"
  expected="$(printf '%s\n' "$sums" | awk -v file="${name}.tar.gz" '$2 == file { print $1; exit }')"
  actual="$(shasum -a 256 "$tmp/node.tar.gz" | awk '{ print $1 }')"
  if [ -z "$expected" ] || [ "$actual" != "$expected" ]; then
    echo "The Node.js download did not match its checksum."
    rm -rf "$tmp"
    exit 1
  fi
  tar -xzf "$tmp/node.tar.gz" -C "$tmp"
  mkdir -p "$ROOT/.clay/runtime"
  rm -rf "$RUNTIME"
  mv "$tmp/${name}" "$RUNTIME"
  rm -rf "$tmp"
  if ! usable "$RUNTIME/bin/node" yes; then
    echo "Node.js ${VERSION} installed, but npm did not start."
    exit 1
  fi
}

echo "Clay Studio"
NODE="$(pick_node || true)"
if [ -z "$NODE" ]; then
  install_node
  NODE="$RUNTIME/bin/node"
fi

NPM="$(dirname "$NODE")/npm"
echo "Using Node.js $(node_version "$NODE") and npm $("$NPM" --version)."
echo ""

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
