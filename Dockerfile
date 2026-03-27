# syntax = docker/dockerfile:1.4

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.13
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="SvelteKit"

# SvelteKit app lives here
WORKDIR /app

# Throw-away build stage to reduce size of final image
FROM base AS build

# Set production environment
ENV NODE_ENV="production"

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY .npmrc package-lock.json package.json ./
RUN npm ci --include=dev --ignore-scripts

# Copy application code
COPY . .

# Set environment variables
ARG PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME
ENV PUBLIC_SENTRY_DSN=${PUBLIC_SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME=${PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME}
ENV DATABASE_URL="postgres://postgres:test@localhost/database"
ENV STRIPE_SECRET_KEY="TESTBUILDKEY"
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install ca-certificates so SSL works properly inside the container (required for Sentry source map uploads)
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Default to production; override with --build-arg NODE_ENV=staging at deploy time
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "./build/index.js" ]
