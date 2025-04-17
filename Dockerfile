# syntax=docker.io/docker/dockerfile:1.5.2

# Welcome to the source of _all_ turbokube published container images
# Using a monodockerfile to reduce the need for scripting around builds
# and still support arbitrary DAG based builders

# Please read https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/reference.md#copy---link

# todo: marks a layer that hasn't been developed yet
FROM scratch as todo

# base-target-root:
FROM --platform=$TARGETPLATFORM ubuntu:24.04@sha256:1e622c5f073b4f6bfad6632f2616c7f59ef256e96fe78bf6a595d1dc4376ac02 \
  as base-target-root
LABEL org.opencontainers.image.source="https://github.com/turbokube/turbokube"
WORKDIR /app

# base-build-root:
FROM --platform=$BUILDPLATFORM ubuntu:24.04@sha256:1e622c5f073b4f6bfad6632f2616c7f59ef256e96fe78bf6a595d1dc4376ac02 \
  as base-build-root
LABEL org.opencontainers.image.source="https://github.com/turbokube/turbokube"
WORKDIR /workspace

# base-target:
FROM --platform=$TARGETPLATFORM base-target-root as base-target
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# base-build:
FROM --platform=$BUILDPLATFORM base-build-root as base-build
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# base-build-gcc-root: keeps build deps for use in layers that build stuff
FROM --platform=$BUILDPLATFORM base-build-root as base-build-gcc-root
RUN set -ex; \
  export DEBIAN_FRONTEND=noninteractive; \
  runDeps=' \
    libc6 \
  '; \
  buildDeps=' \
    curl ca-certificates \
    gcc \
    g++ \
    libc-dev \
    make \
  '; \
  apt-get update && apt-get install -y $runDeps $buildDeps --no-install-recommends; \
  \
  rm -rf /var/lib/apt/lists; \
  rm -rf /var/log/dpkg.log /var/log/alternatives.log /var/log/apt /root/.gnupg

# base-target-gcc-root: for use in target images that need gcc, with some specific JNI dependencies as mandrel is the most likely usage
FROM --platform=$TARGETPLATFORM base-target-root as base-target-gcc-root
RUN set -ex; \
  export DEBIAN_FRONTEND=noninteractive; \
  runDeps=' \
    libc6 \
    libsnappy1v5 libsnappy-jni liblz4-1 liblz4-jni libzstd1 libfreetype6 \
    curl ca-certificates \
    gcc \
    g++ \
    libc-dev \
    make \
    zlib1g-dev libsnappy-dev liblz4-dev libzstd-dev libfreetype6-dev \
  '; \
  apt-get update && apt-get install -y $runDeps $buildDeps --no-install-recommends; \
  \
  rm -rf /var/lib/apt/lists; \
  rm -rf /var/log/dpkg.log /var/log/alternatives.log /var/log/apt /root/.gnupg

# base-target-gcc:
FROM --platform=$TARGETPLATFORM base-target-gcc-root as base-target-gcc
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# base-build-gcc:
FROM --platform=$BUILDPLATFORM base-build-gcc-root as base-build-gcc
RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# bin-watchexec: /usr/local/bin/watchexec from github.com/watchexec/watchexec
FROM --platform=$TARGETPLATFORM base-build-root as bin-watchexec
ARG TARGETARCH
ARG watchexecVersion=2.3.0
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
  arch=$TARGETARCH; \
  [ "$arch" != "arm64" ] || arch=aarch64; \
  [ "$arch" != "amd64" ] || arch=x86_64; \
  curl -o watchexec.tar.xz -sLSf \
     "https://github.com/watchexec/watchexec/releases/download/v${watchexecVersion}/watchexec-${watchexecVersion}-$arch-unknown-linux-gnu.tar.xz"; \
  tar -xvJf watchexec.tar.xz --strip-components=1; \
  mv watchexec /usr/local/bin/watchexec; \
  # was used to debug uname -m surprises: echo "version=${watchexecVersion} arch=${arch} TARGETARCH=${TARGETARCH}" > /usr/local/bin/watchexec.info; \
  rm -r /opt/watchexec; \
  \
  [ -z "$buildDeps" ] || apt-get purge -y --auto-remove $buildDeps; \
  rm -rf /var/lib/apt/lists/*; \
  rm -rf /var/log/apt /var/log/dpkg.log /var/log/alternatives.log /root/.gnupg;

FROM --platform=$BUILDPLATFORM base-build-root as bin-stub
RUN set -e; \
  mkdir /app; \
  echo '#!/bin/sh' > /app/stub; \
  echo 'while true; do echo "Waiting for replacement at $0" && sleep 3; done' >> /app/stub; \
  chmod 774 /app/stub;

# static-watch: Watchexec image for static binary
# Currently stub bin is a shell script so we can't run entirely distroless
# FROM --platform=$TARGETPLATFORM gcr.io/distroless/static-debian11 as static-watch
# Wrong/missing glibc for watchexec?
# FROM --platform=$TARGETPLATFORM cgr.dev/chainguard/busybox as static-watch
# Missing sh, possibly useful with a rust stub bin
# FROM --platform=$TARGETPLATFORM cgr.dev/chainguard/glibc-dynamic as static-watch
FROM --platform=$TARGETPLATFORM base-target as static-watch
COPY --from=bin-watchexec --link --chown=0:0 /usr/local/bin/watchexec /usr/local/bin/
COPY --from=bin-stub --link --chown=65532:65534 /app/stub /app/main
ENTRYPOINT [ "/usr/local/bin/watchexec", \
  "--print-events", \
  "--debounce=500", \
  "--restart", \
  "--stop-timeout=25", \
  "--shell=none", \
  "--watch=/app", \
  "--" ]
CMD [ "/app/main" ]

# nodejs-dist: Upstream nodejs
FROM --platform=$TARGETPLATFORM node:22.14.0-bookworm-slim@sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b \
  as nodejs-dist

# nodejs: Base nodejs image
FROM --platform=$TARGETPLATFORM base-target as nodejs
COPY --from=nodejs-dist --link /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=nodejs-dist --link /usr/local/bin/node /usr/local/bin/
ENTRYPOINT [ "/usr/local/bin/node" ]
# sourcemaps can be surprisingly slow for some apps
# CMD [ "--enable-source-maps", "./main.js" ]
CMD [ "./main.js" ]

# nodejs-watch: Quite opinionated js source/bundle watch
FROM --platform=$TARGETPLATFORM nodejs as nodejs-watch
COPY --from=bin-watchexec --link --chown=0:0 /usr/local/bin/watchexec* /usr/local/bin/
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

# jre21: Java runtime base
FROM --platform=$TARGETPLATFORM base-target as jre21
COPY --from=eclipse-temurin:21.0.6_7-jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_VERSION=jdk-21.0.6+7 \
  PATH=/opt/java/openjdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# jre21-watch:
FROM --platform=$TARGETPLATFORM jre21 as jre21-watch
COPY --from=bin-watchexec --link --chown=0:0 /usr/local/bin/watchexec /usr/local/bin/
ENTRYPOINT [ "/usr/local/bin/watchexec", \
  "--print-events", \
  "--debounce=2000", \
  "--shell=none", \
  "--watch=/app", \
  "-r", \
  "--postpone", \
  "--", \
  "java", \
  "-jar", \
  "quarkus-run.jar" ]

# install-mandrel:
FROM --platform=$TARGETPLATFORM base-target-gcc-root as install-mandrel
ARG TARGETARCH
ENV MANDREL_JAVA_VERSION=java21 \
  MANDREL_VERSION=23.1.6.0-Final \
  JAVA_VERSION=jdk-21.0.6+7 \
  JAVA_HOME=/usr/share/mandrel \
  PATH=/usr/share/mandrel/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN set -ex; \
  ARCH=$TARGETARCH; \
  [ "$TARGETARCH" != "arm64" ] || ARCH=aarch64; \
  MANDREL_DIST=mandrel-$MANDREL_JAVA_VERSION-linux-$ARCH-$MANDREL_VERSION.tar.gz; \
  MANDREL_DIST_URL=https://github.com/graalvm/mandrel/releases/download/mandrel-$MANDREL_VERSION/$MANDREL_DIST; \
  MANDREL_DIST_SHA256=$(curl -sLSf "$MANDREL_DIST_URL.sha256"); \
  [ -n "$MANDREL_DIST_SHA256" ]; \
  cd /usr/share; \
  curl -o $MANDREL_DIST -sLSf $MANDREL_DIST_URL; \
  echo "$MANDREL_DIST_SHA256" | sha256sum -c -; \
  mkdir ./mandrel; \
  cat $MANDREL_DIST | tar xzf - --strip-components=1 -C ./mandrel; \
  rm $MANDREL_DIST;
RUN rm -v /usr/share/mandrel/lib/src.zip

# jdk21-maven:
FROM --platform=$TARGETPLATFORM maven:3.9-eclipse-temurin-21@sha256:887820a8941cc4e1bf011ec758e50acd8073bfe6046e8d9489e29ed38914e795 \
  as jdk21-maven
RUN mkdir -p /home/nonroot/.m2

# jdk21: Java development base, geared towards Quarkus
FROM --platform=$TARGETPLATFORM base-target-gcc as jdk21
COPY --from=jdk21-maven --link /usr/share/maven /usr/share/maven
COPY --from=jdk21-maven --link --chown=65532:65534 /home/nonroot/.m2 /home/nonroot/.m2
COPY --from=install-mandrel --link /usr/share/mandrel /usr/share/mandrel
ENV JAVA_VERSION=jdk-21.0.6+7 \
  JAVA_HOME=/usr/share/mandrel \
  PATH=/usr/share/mandrel/bin:/usr/share/maven/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
VOLUME ["/home/nonroot/.m2/repository"]
