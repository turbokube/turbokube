# syntax=docker/dockerfile:1.4

FROM --platform=$TARGETPLATFORM ubuntu:22.04@sha256:67211c14fa74f070d27cc59d69a7fa9aeff8e28ea118ef3babc295a0428a6d21 \
  as base
FROM --platform=$TARGETPLATFORM node:18.15.0-bullseye-slim@sha256:7d67f2765f8d1b13f3833001bebbc6513581ef3f300aa4b1019a0b6dff2c0b25 \
  as node

FROM --platform=$TARGETPLATFORM base as base-node-watchexec-release
COPY --from=node --link /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node --link /usr/local/bin/node /usr/local/bin/

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

ENTRYPOINT [ "/usr/local/bin/watchexec", \
  "--print-events", \
  "--debounce=500", \
  "--shell=none", \
  "--watch=/app", \
  "-r", \
  "--", \
  "/usr/local/bin/node" ]

RUN grep 'nonroot:x:65532' /etc/passwd || \
  echo 'nonroot:x:65532:65534:nonroot:/home/nonroot:/usr/sbin/nologin' >> /etc/passwd && \
  mkdir -p /home/nonroot && touch /home/nonroot/.bash_history && chown -R 65532:65534 /home/nonroot
USER nonroot:nogroup

# Opinionated main location, easily overridden but note the watch path above
WORKDIR /app
CMD [ "--enable-source-maps", "./main.js" ]
COPY --chown=nonroot:nogroup main-wait.js main.js
