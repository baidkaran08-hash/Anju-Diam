#!/bin/bash
# Anju Diam — double-click this file to start the site.
cd "$(dirname "$0")" || exit 1
echo "Starting Anju Diam on http://localhost:3000"
echo "Leave this window open. Press Ctrl-C to stop."
echo
if [ ! -d node_modules ]; then npm install; fi
if [ ! -f prisma/dev.db ]; then npm run db:push && npm run db:seed; fi
if [ ! -d .next ]; then npm run build; fi
open http://localhost:3000 2>/dev/null &
exec npm run start -- -p 3000
