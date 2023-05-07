# Welcome to the source of _all_ turbokube published container images
# Using a monodockerfile to reduce the need for scripting around builds
# and still support arbitrary DAG based builders

# Please read https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/reference.md#copy---link

# todo: marks a layer that hasn't been developed yet
FROM scratch as todo

# base-target-root:
FROM --platform=$TARGETPLATFORM ubuntu:23.04 as base-target-root
LABEL org.opencontainers.image.source="https://github.com/turbokube/turbokube"
WORKDIR /app

# base-build-root:
FROM --platform=$BUILDPLATFORM ubuntu:23.04 as base-build-root
LABEL org.opencontainers.image.source="https://github.com/turbokube/turbokube"
WORKDIR /workspace

# base-target:
FROM base-target-root as base-target
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# base-build:
FROM base-build-root as base-build
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# bin-watchexec: /usr/local/bin/watchexec from github.com/watchexec/watchexec
FROM --platform=$TARGETPLATFORM base-build-root as bin-watchexec
ARG watchexecVersion=1.22.2
RUN set -ex; \
  export DEBIAN_FRONTEND=noninteractive; \
  runDeps=' \
    libc6 \
  '; \
  buildDeps=' \
    curl ca-certificates \
    xz-utils \
  '; \
  apt-get update && apt-get install -y $runDeps $buildDeps --no-install-recommends; \
  \
  mkdir /opt/watchexec; cd /opt/watchexec; \
  export arch=$(uname -m); \
  curl -o watchexec.tar.xz -sLSf \
     "https://github.com/watchexec/watchexec/releases/download/v${watchexecVersion}/watchexec-${watchexecVersion}-$arch-unknown-linux-gnu.tar.xz"; \
  tar -xvJf watchexec.tar.xz --strip-components=1; \
  mv watchexec /usr/local/bin/watchexec; \
  rm -r /opt/watchexec; \
  \
  [ -z "$buildDeps" ] || apt-get purge -y --auto-remove $buildDeps; \
  rm -rf /var/lib/apt/lists/*; \
  rm -rf /var/log/apt /var/log/dpkg.log /var/log/alternatives.log /root/.gnupg;

FROM --platform=$BUILDPLATFORM base-build-root as bin-stub
RUN set -e; \
  mkdir /app; \
  echo '#!/bin/sh' > /app/stub; \
  echo 'echo "Waiting for replacement at $0"' >> /app/stub; \
  chmod a+x /app/stub;

# static-watch: Watchexec image for static binary
# Currently stub bin is a shell script so we can't run entirely distroless
# FROM --platform=$TARGETPLATFORM gcr.io/distroless/static-debian11 as static-watch
# Wrong/missing glibc for watchexec?
# FROM --platform=$TARGETPLATFORM cgr.dev/chainguard/busybox as static-watch
# Missing sh, possibly useful with a rust stub bin
# FROM --platform=$TARGETPLATFORM cgr.dev/chainguard/glibc-dynamic as static-watch
FROM --platform=$TARGETPLATFORM base-target as static-watch
COPY --from=bin-watchexec --link /usr/local/bin/watchexec /usr/local/bin/
COPY --from=bin-stub /app/stub /app/main
ENTRYPOINT [ "/usr/local/bin/watchexec", \
  "--print-events", \
  "--debounce=500", \
  "--shell=none", \
  "--watch=/app/main", \
  "--", \
  "/app/main" ]

# nodejs: Base nodejs image
FROM --platform=$TARGETPLATFORM node:18.16-bullseye-slim as nodejs

# nodejs-watchexec: Quite opinionated js source/bundle watch
FROM --platform=$TARGETPLATFORM base-target as nodejs-watchexec
COPY --from=nodejs --link /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=nodejs --link /usr/local/bin/node /usr/local/bin/
COPY --from=bin-watchexec --link /usr/local/bin/watchexec /usr/local/bin/
ENTRYPOINT [ "/usr/local/bin/watchexec", \
  "--print-events", \
  "--debounce=500", \
  "--shell=none", \
  "--watch=/app", \
  "-r", \
  "--", \
  "/usr/local/bin/node" ]
# sourcemaps can be surprisingly slow for some apps
# CMD [ "--enable-source-maps", "./main.js" ]
CMD [ "./main.js" ]
COPY --chown=nonroot:nogroup nodejs/watchexec/main-wait.js main.js

# jre17: Java runtime base
FROM --platform=$TARGETPLATFORM base-target as jre17
COPY --from=eclipse-temurin:17.0.6_10-jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_VERSION=jdk-17.0.6+10 \
  PATH=/opt/java/openjdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# jdk17: Java development base
FROM todo

# bin-maven: Maven to
FROM todo
