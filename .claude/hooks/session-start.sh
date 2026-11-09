#!/bin/bash
# Cloud sessions only: make sure Node meets Astro's minimum, then install deps
# so `npm run check` / `npm run build` work from the first prompt.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Astro refuses to run below the version in package.json "engines". Cloud images
# can lag behind, so install exactly that minimum version when the system Node is
# older (or missing). Pinned and checksum-verified, so every session gets the same Node.
required=$(grep -oE '"node"[[:space:]]*:[[:space:]]*">=[[:space:]]*[0-9]+\.[0-9]+\.[0-9]+' package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+$')
older_than_required() { [ "$(printf '%s\n%s\n' "$required" "$1" | sort -V | head -1)" != "$required" ]; }

current=$(node -p "process.versions.node" 2>/dev/null || echo 0)
if older_than_required "$current"; then
  case "$(uname -m)" in
    x86_64) arch=x64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *) echo "session-start: unsupported architecture $(uname -m)" >&2; exit 1 ;;
  esac
  dir="$HOME/.cache/mango-node/v$required-$arch"
  if [ ! -x "$dir/bin/node" ]; then
    tarball="node-v$required-linux-$arch.tar.xz"
    tmp=$(mktemp -d)
    curl -fsSL -o "$tmp/$tarball" "https://nodejs.org/dist/v$required/$tarball"
    curl -fsSL -o "$tmp/SHASUMS256.txt" "https://nodejs.org/dist/v$required/SHASUMS256.txt"
    (cd "$tmp" && grep " $tarball\$" SHASUMS256.txt | sha256sum --check --status)
    rm -rf "$dir" && mkdir -p "$dir"
    tar -xJf "$tmp/$tarball" -C "$dir" --strip-components=1
    rm -rf "$tmp"
  fi
  export PATH="$dir/bin:$PATH"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PATH=\"$dir/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  fi
fi

# Run the install only if a listed file (or the Node version) has changed since the install last succeeded
hashes=node_modules/.session-start.sha256
node_stamp=node_modules/.session-start.node
if ! sha256sum --check --status "$hashes" 2>/dev/null || [ "$(cat "$node_stamp" 2>/dev/null)" != "$(node -v)" ]; then
  # Delete the old hashes first, so a failed install runs again next time
  rm -f "$hashes"
  # npm ci, not npm install: it never rewrites package-lock.json (npm versions disagree on its format)
  npm ci --no-audit --no-fund
  node -v > "$node_stamp"
  sha256sum .claude/hooks/session-start.sh package.json package-lock.json 2>/dev/null > "$hashes" || rm -f "$hashes"
fi
