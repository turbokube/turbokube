#!/usr/bin/env bash
[ -z "$DEBUG" ] || set -x
set -eo pipefail

[ -n "$PLATFORMS" ] || PLATFORMS="linux/amd64,linux/arm64/v8"
[ -n "$PLATFORM" ] || PLATFORM="--platform=$PLATFORMS"
# [ -z "$REGISTRY" ] || PREFIX="$REGISTRY/"
# [ -n "$NOPUSH" ] || BUILDX_PUSH="--push"

if [ "$TEST_PLATFORMS" != "all" ]; then
  # Test on buildplatform
  ./imagetest/build-docker-buildx.sh
else
  for P in ${PLATFORMS//,/ }; do
    echo "=> Build and test for platform $P"
    BUILDX_ARGS="$BUILDX_ARGS --platform=$P" ./imagetest/build-docker-buildx.sh
  done
fi

BUILDX_ARGS="$BUILDX_ARGS --platform=linux/amd64" ./imagetest/build-docker-buildx.sh
# Build multiarch
[ "$BUILD" = "false" ] || BUILDX_ARGS="$BUILDX_ARGS $PLATFORM $BUOILDX_PUSH" TEST=false ./imagetest/build-docker-buildx.sh

# TODO run integration tests on local state
# [ "$ITEST" = "false"] || (cd examples; yarn test)
