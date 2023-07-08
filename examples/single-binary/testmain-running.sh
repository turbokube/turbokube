#!/bin/sh
echo "in testmain-running at $0"

count=0
while true; do
  count=$((count+1))
  echo "testmain-running wait $count for replacement at $0"
  sleep .2
done
