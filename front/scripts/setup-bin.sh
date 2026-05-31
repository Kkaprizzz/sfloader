#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$DIR/resources/bin"
mkdir -p "$BIN_DIR"

echo "Скачиваю yt-dlp (linux) -> $BIN_DIR/yt-dlp"
curl -L --fail -o "$BIN_DIR/yt-dlp" \
  https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux
chmod +x "$BIN_DIR/yt-dlp"

echo "Готово:"
"$BIN_DIR/yt-dlp" --version
