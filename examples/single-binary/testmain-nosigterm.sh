#!/bin/sh

trap '' SIGTERM

echo "in testmain-nosigterm at $0"

count=0
while true; do
  count=$((count+1))
  echo "testmain-nosigterm wait $count for replacement at $0, ignoring SIGTERM"
  sleep 3
done
