#!/usr/bin/env bash
[ -z "$DEBUG" ] || set -x
set -eo pipefail

[ -n "$PLATFORMS" ] || PLATFORMS="linux/amd64,linux/arm64/v8"
[ -n "$PLATFORM" ] || PLATFORM="--platform=$PLATFORMS"
# [ -z "$REGISTRY" ] || PREFIX="$REGISTRY/"
# [ -n "$NOPUSH" ] || BUILDX_PUSH="--push"

# Test on buildplatform
./imagetest/build-docker-buildx.sh
# Build multiarch
BUILDX_ARGS="$PLATFORM $BUOILDX_PUSH" TEST=false ./imagetest/build-docker-buildx.sh
