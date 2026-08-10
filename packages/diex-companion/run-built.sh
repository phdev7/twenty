#!/bin/sh

set -e

echo "==> Packaging Diex Desktop..."
SKIP_SIGN=1 npx electron-forge package

echo "==> Ad-hoc signing Diex.app..."
codesign --force --deep --sign - out/Diex-darwin-arm64/Diex.app

echo "==> Starting local server..."
node src/server.js &
SERVER_PID=$!

trap "echo '==> Stopping server...'; kill $SERVER_PID 2>/dev/null" EXIT INT TERM

echo "==> Launching Diex.app..."
./out/Diex-darwin-arm64/Diex.app/Contents/MacOS/Diex
