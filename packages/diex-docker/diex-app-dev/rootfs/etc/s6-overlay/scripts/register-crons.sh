#!/bin/sh
set -e

echo "==> START Registering cron jobs"

cd /app/packages/diex-server
yarn command:prod cron:register:all

echo "==> DONE"
