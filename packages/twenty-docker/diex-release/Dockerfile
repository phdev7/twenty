# Deploy-only Dockerfile. The real image is built in CI by
# .github/workflows/cd-diex-native-image.yaml and published to GHCR.
#
# Coolify cannot point an existing git-backed application at a registry image:
# the "Docker Image" build pack is only selectable when the application is
# first created, and the update endpoint rejects it. Building the monorepo on
# the VPS is not an option either, since the frontend bundle exhausts memory
# there and the build is killed. So the application keeps the Dockerfile build
# pack and this file turns the build into a pull of the image CI already made.
#
# DIEX_IMAGE is supplied by Coolify as a build argument from the build-time
# environment variable of the same name, so a release only needs that variable
# changed. The default below is a floor, not the deployed version.
ARG DIEX_IMAGE=ghcr.io/phdev7/twenty-diex:6f320b6d1d

FROM ${DIEX_IMAGE}
