#!/bin/sh

trap '' SIGTERM

while true; do echo "Waiting for replacement at $0, ignoring SIGTERM" && sleep 3; done
