#!/usr/bin/env bash
[ -z "$DEBUG" ] || set -x
set -eo pipefail

TARGETS=$(find imagetest -name \*.yaml | cut -d/ -f2 | sort | uniq)

PASSED=""
FAILED=""

[ "$CLEAN" = "false" ] || [ "$BUILD" = "false" ] || [ ! -d imagetest/builds ] \
  || rm -rf imagetest/builds

for TARGET in $TARGETS; do
  [ -z "$BUILD_SUBSET" ] || [[ "$TARGET" =~ $BUILD_SUBSET ]] || {
    echo "=> $TARGET ignored through BUILD_SUBSET=$BUILD_SUBSET"
    continue
  }
  NAME=ghcr.io/turbokube/$TARGET
  OCI=imagetest/builds/$TARGET
  [ "$BUILD" = "false" ] || {
    echo "=> Building $TARGET ..."
    docker buildx build $BUILDX_ARGS --target=$TARGET --output \
      type=oci,name=$NAME,dest=$OCI,tar=false,compression=uncompressed,buildinfo-attrs=true .
  }
  [ "$TEST" = "false" ] || {
    echo "=> container-structure-test $TARGET ..."
    container-structure-test test --image-from-oci-layout $OCI -c imagetest/$TARGET/*.yaml \
      && PASSED="$PASSED $TARGET" \
      || FAILED="$FAILED $TARGET"
  }
done

echo "=> Passed:" && echo "$PASSED"
[ -n "$FAILED" ] || exit 0
echo "=> Failed:" && echo "$FAILED"
exit 1
