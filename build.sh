#!/usr/bin/env bash
[ -z "$DEBUG" ] || set -x
set -eo pipefail

[ "$PLATFORMS" != "all" ] || PLATFORMS="linux/amd64,linux/arm64/v8"

if [ -z "$PLATFORMS" ]; then
  ./imagetest/build-docker-buildx.sh
else
  for P in ${PLATFORMS//,/ }; do
    echo "=> Build and test for platform $P"
    BUILDX_ARGS="$BUILDX_ARGS --platform=$P" ./imagetest/build-docker-buildx.sh
  done
fi

# TODO run integration tests on local state
# [ "$ITEST" = "false"] || (cd examples; yarn test)
