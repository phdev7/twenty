# ===========================================================================
# Dependency stages
# ===========================================================================

FROM node:24.18.0-alpine3.23@sha256:595398b0081eacda8e1c4c5b97b76cd1020e4d58a8ebcb4843b9bca1e79e7436 AS front-deps

WORKDIR /app

COPY ./package.json ./yarn.lock ./.yarnrc.yml ./tsconfig.base.json ./nx.json /app/
COPY ./.yarn/releases /app/.yarn/releases
COPY ./.yarn/patches /app/.yarn/patches

COPY ./packages/diex-ui/package.json /app/packages/diex-ui/
COPY ./packages/diex-shared/package.json /app/packages/diex-shared/
COPY ./packages/diex-front/package.json /app/packages/diex-front/
COPY ./packages/diex-front-component-renderer/package.json /app/packages/diex-front-component-renderer/
COPY ./packages/diex-sdk/package.json /app/packages/diex-sdk/
COPY ./packages/diex-client-sdk/package.json /app/packages/diex-client-sdk/

RUN yarn workspaces focus diex diex-front diex-front-component-renderer diex-ui diex-shared diex-sdk diex-client-sdk && yarn cache clean && npx nx reset


FROM node:24.18.0-alpine3.23@sha256:595398b0081eacda8e1c4c5b97b76cd1020e4d58a8ebcb4843b9bca1e79e7436 AS server-deps

WORKDIR /app

COPY ./package.json ./yarn.lock ./.yarnrc.yml ./tsconfig.base.json ./nx.json /app/
COPY ./.yarn/releases /app/.yarn/releases
COPY ./.yarn/patches /app/.yarn/patches

COPY ./packages/diex-emails/package.json /app/packages/diex-emails/
COPY ./packages/diex-server/package.json /app/packages/diex-server/
COPY ./packages/diex-server/patches /app/packages/diex-server/patches
COPY ./packages/diex-shared/package.json /app/packages/diex-shared/
COPY ./packages/diex-client-sdk/package.json /app/packages/diex-client-sdk/

RUN yarn workspaces focus diex diex-server diex-emails diex-shared diex-client-sdk && yarn cache clean && npx nx reset


FROM server-deps AS diex-server-build

COPY ./packages/diex-emails /app/packages/diex-emails
COPY ./packages/diex-shared /app/packages/diex-shared
COPY ./packages/diex-client-sdk /app/packages/diex-client-sdk
COPY ./packages/diex-server /app/packages/diex-server

RUN npx nx run diex-server:lingui:extract && \
    npx nx run diex-server:lingui:compile && \
    npx nx run diex-emails:lingui:extract && \
    npx nx run diex-emails:lingui:compile

RUN npx nx run diex-server:build

# Clean server build output (type declarations and compiled tests are not needed at runtime;
# source maps are kept because diex-infra extracts them from the image for Sentry uploads)
RUN find /app/packages/diex-server/dist -name '*.d.ts' -delete \
 && rm -rf /app/packages/diex-server/dist/packages/diex-server/test

RUN yarn workspaces focus --production diex-emails diex-shared diex-client-sdk diex-server


FROM front-deps AS diex-front-build

COPY ./packages/diex-front /app/packages/diex-front
COPY ./packages/diex-front-component-renderer /app/packages/diex-front-component-renderer
COPY ./packages/diex-ui /app/packages/diex-ui
COPY ./packages/diex-shared /app/packages/diex-shared
COPY ./packages/diex-sdk /app/packages/diex-sdk
COPY ./packages/diex-client-sdk /app/packages/diex-client-sdk
RUN npx nx run diex-front:lingui:extract && \
    npx nx run diex-front:lingui:compile
# To skip the memory-intensive frontend build, pre-build on the host:
#   npx nx build diex-front
# The check below will use packages/diex-front/build/ if it already exists.
RUN if [ -d /app/packages/diex-front/build ]; then \
      echo "Using pre-built frontend from host"; \
    else \
      NODE_OPTIONS="--max-old-space-size=4096" npx nx build diex-front; \
    fi


# ===========================================================================
# Target: diex-server (server only, no frontend)
#   docker build --target diex-server -f packages/diex-docker/diex/Dockerfile .
# ===========================================================================

FROM node:24.18.0-alpine3.23@sha256:595398b0081eacda8e1c4c5b97b76cd1020e4d58a8ebcb4843b9bca1e79e7436 AS diex-server

# Force the patched Alpine OpenSSL libs (base bakes 3.5.6-r0; repo ships
# 3.5.7-r0). Node bundles its own OpenSSL, but psql/curl link these system
# libs, so the upgrade hardens runtime TLS and clears the scanner.
RUN apk add --no-cache \
    'curl>=8.20.0-r0' \
    'nghttp2-libs>=1.69.0-r0' \
    'libcrypto3>=3.5.7-r0' \
    'libssl3>=3.5.7-r0' \
    'postgresql18-client>=18.4-r0' \
    jq

COPY ./packages/diex-docker/diex/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
WORKDIR /app/packages/diex-server

ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production

# Workspace root config
COPY --chown=1000 --from=diex-server-build /app/package.json /app/yarn.lock /app/.yarnrc.yml /app/
COPY --chown=1000 --from=diex-server-build /app/tsconfig.base.json /app/nx.json /app/
COPY --chown=1000 --from=diex-server-build /app/.yarn /app/.yarn
COPY --chown=1000 --from=diex-server-build /app/node_modules /app/node_modules

# Server package (compiled dist + package.json only, no src/)
COPY --chown=1000 --from=diex-server-build /app/packages/diex-server/package.json /app/packages/diex-server/
COPY --chown=1000 --from=diex-server-build /app/packages/diex-server/dist /app/packages/diex-server/dist
COPY --chown=1000 --from=diex-server-build /app/packages/diex-server/patches /app/packages/diex-server/patches

# Workspace packages (dist + package.json; node_modules symlinks resolve to these)
COPY --chown=1000 --from=diex-server-build /app/packages/diex-shared/package.json /app/packages/diex-shared/
COPY --chown=1000 --from=diex-server-build /app/packages/diex-shared/dist /app/packages/diex-shared/dist
COPY --chown=1000 --from=diex-server-build /app/packages/diex-emails/package.json /app/packages/diex-emails/
COPY --chown=1000 --from=diex-server-build /app/packages/diex-emails/dist /app/packages/diex-emails/dist
COPY --chown=1000 --from=diex-server-build /app/packages/diex-client-sdk/package.json /app/packages/diex-client-sdk/
COPY --chown=1000 --from=diex-server-build /app/packages/diex-client-sdk/dist /app/packages/diex-client-sdk/dist
LABEL org.opencontainers.image.source=https://github.com/phdev7/twenty
LABEL org.opencontainers.image.description="Diex CRM server image (server only)."

# Remove unused, unpatchable components the scanner flags (none are executed at
# runtime, and none can be fixed by upgrading our deps or Node):
#  - the bundled npm CLI: the app uses yarn via corepack and never invokes npm,
#    and npm's bundled ip-address has no patched release;
#  - example/ apps vendored inside dependencies, e.g. passport-microsoft's
#    example/login ships a package-lock.json for an old Express demo
#    (body-parser, ejs, express, ...) that is never installed or run.
#  - the Node dev headers: only node-gyp needs them and native addons are
#    compiled in the build stages; their vendored openssl/opensslv.h is what
#    scanners fingerprint whenever OpenSSL patches ahead of Node releases.
# The pinned node:24.18.0-alpine base carries every 24.17.0 security fix
# (OpenSSL 3.5.7, CVE-2026-48930) plus the fix for the http.Agent keep-alive
# regression (nodejs/node#64004) that flooded prod with false "Premature close"
# fetch failures on 24.17.0 (see #22671/#22673). Do not pin 24.17.0 again.
# Keep the base current when Node ships 24.x security releases — the scanner
# flags the statically-linked node binary itself.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/include/node && \
    find /app/node_modules -type d -name example -prune -exec rm -rf {} +

RUN mkdir -p /app/.local-storage /app/packages/diex-server/.local-storage && \
    chown 1000:1000 /app/.local-storage /app/packages/diex-server/.local-storage

USER 1000

CMD ["node", "dist/main"]
ENTRYPOINT ["/app/entrypoint.sh"]


# ===========================================================================
# Target: diex-server-aws (server only + aws-cli, no frontend)
#   docker build --target diex-server-aws -f packages/diex-docker/diex/Dockerfile .
# ===========================================================================

FROM diex-server AS diex-server-aws

USER root
RUN apk add --no-cache aws-cli
USER 1000


# ===========================================================================
# Target: diex (server + frontend)
#   docker build --target diex -f packages/diex-docker/diex/Dockerfile .
# ===========================================================================

FROM diex-server AS diex

COPY --chown=1000 --from=diex-front-build /app/packages/diex-front/build /app/packages/diex-server/dist/front

LABEL org.opencontainers.image.description="Diex CRM image with backend and frontend."


# ===========================================================================
# Target: diex-aws (server + frontend + aws-cli)
#   docker build --target diex-aws -f packages/diex-docker/diex/Dockerfile .
# ===========================================================================

FROM diex AS diex-aws

USER root
RUN apk add --no-cache aws-cli
USER 1000


# ===========================================================================
# Target: diex-app-dev (all-in-one with Postgres + Redis)
#   docker build --target diex-app-dev -f packages/diex-docker/diex/Dockerfile .
# ===========================================================================

FROM alpine:3.20 AS s6-fetch
ARG S6_OVERLAY_VERSION=3.2.0.2
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then echo "aarch64" > /tmp/s6arch; \
    else echo "x86_64" > /tmp/s6arch; fi
RUN S6_ARCH=$(cat /tmp/s6arch) && \
    wget -O /tmp/s6-overlay-noarch.tar.xz \
      "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz" && \
    wget -O /tmp/s6-overlay-noarch.tar.xz.sha256 \
      "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz.sha256" && \
    wget -O /tmp/s6-overlay-arch.tar.xz \
      "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" && \
    wget -O /tmp/s6-overlay-arch.tar.xz.sha256 \
      "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-${S6_ARCH}.tar.xz.sha256" && \
    cd /tmp && \
    NOARCH_SUM=$(awk '{print $1}' s6-overlay-noarch.tar.xz.sha256) && \
    ARCH_SUM=$(awk '{print $1}' s6-overlay-arch.tar.xz.sha256) && \
    echo "$NOARCH_SUM  s6-overlay-noarch.tar.xz" | sha256sum -c - && \
    echo "$ARCH_SUM  s6-overlay-arch.tar.xz" | sha256sum -c -

FROM node:24.18.0-alpine3.23@sha256:595398b0081eacda8e1c4c5b97b76cd1020e4d58a8ebcb4843b9bca1e79e7436 AS diex-app-dev

# s6-overlay
COPY --from=s6-fetch /tmp/s6-overlay-noarch.tar.xz /tmp/
COPY --from=s6-fetch /tmp/s6-overlay-arch.tar.xz /tmp/
RUN tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-arch.tar.xz \
 && rm /tmp/s6-overlay-*.tar.xz

# See diex-server above: patched Alpine OpenSSL libs (psql/curl/redis link
# these system libs; Node bundles its own).
RUN apk add --no-cache \
    postgresql18 postgresql18-contrib \
    redis \
    'libcrypto3>=3.5.7-r0' \
    'libssl3>=3.5.7-r0' \
    'curl>=8.20.0-r0' jq su-exec

# Workspace root config
COPY --from=diex-server-build /app/package.json /app/yarn.lock /app/.yarnrc.yml /app/
COPY --from=diex-server-build /app/tsconfig.base.json /app/nx.json /app/
COPY --from=diex-server-build /app/.yarn /app/.yarn
COPY --from=diex-server-build /app/node_modules /app/node_modules

# Server package (compiled dist + package.json only, no src/)
COPY --from=diex-server-build /app/packages/diex-server/package.json /app/packages/diex-server/
COPY --from=diex-server-build /app/packages/diex-server/dist /app/packages/diex-server/dist
COPY --from=diex-server-build /app/packages/diex-server/patches /app/packages/diex-server/patches

# Workspace packages (dist + package.json; node_modules symlinks resolve to these)
COPY --from=diex-server-build /app/packages/diex-shared/package.json /app/packages/diex-shared/
COPY --from=diex-server-build /app/packages/diex-shared/dist /app/packages/diex-shared/dist
COPY --from=diex-server-build /app/packages/diex-emails/package.json /app/packages/diex-emails/
COPY --from=diex-server-build /app/packages/diex-emails/dist /app/packages/diex-emails/dist
COPY --from=diex-server-build /app/packages/diex-client-sdk/package.json /app/packages/diex-client-sdk/
COPY --from=diex-server-build /app/packages/diex-client-sdk/dist /app/packages/diex-client-sdk/dist
# Frontend static build
COPY --from=diex-front-build /app/packages/diex-front/build /app/packages/diex-server/dist/front

# Source maps are not needed in the dev image (no Sentry). Node dev headers are
# dropped for the same scanner-hygiene reasons as in diex-server above.
RUN find /app/packages/diex-server/dist -name '*.js.map' -delete \
 && rm -rf /usr/local/include/node

# s6 service definitions
COPY packages/diex-docker/diex-app-dev/rootfs/ /

RUN mkdir -p /data/postgres /data/redis /app/packages/diex-server/.local-storage \
 && chown -R postgres:postgres /data/postgres \
 && chown 1000:1000 /data/redis /app/packages/diex-server/.local-storage

ARG APP_VERSION=0.0.0

ENV S6_KEEP_ENV=1
ENV PG_DATABASE_URL=postgres://diex:diex@localhost:5432/default \
    SERVER_URL=http://localhost:2020 \
    REDIS_URL=redis://localhost:6379 \
    STORAGE_TYPE=local \
    APP_SECRET=diex-app-dev-secret-not-for-production \
    APP_VERSION=$APP_VERSION \
    NODE_ENV=development \
    NODE_PORT=2020 \
    DISABLE_DB_MIGRATIONS=true \
    DISABLE_CRON_JOBS_REGISTRATION=true \
    IS_BILLING_ENABLED=false \
    SIGN_IN_PREFILLED=true \
    APPLICATION_LOG_DRIVER=CONSOLE

EXPOSE 2020
VOLUME ["/data/postgres", "/app/packages/diex-server/.local-storage"]

LABEL org.opencontainers.image.source=https://github.com/phdev7/twenty
LABEL org.opencontainers.image.description="All-in-one Diex CRM image for local development. Includes PostgreSQL, Redis, server, and worker."

ENTRYPOINT ["/init"]
