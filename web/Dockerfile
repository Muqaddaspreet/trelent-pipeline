# Use Bun official image
FROM oven/bun:1 AS base

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy all files from project
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Build the Next.js application
ENV NODE_ENV=production
RUN bun run build

# Copy production dependencies and source code into final image
FROM base AS release
# Install curl for healthchecks in release stage
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy built application
COPY --from=prerelease /app/.next ./.next
COPY --from=prerelease /app/public ./public
COPY --from=prerelease /app/package.json ./package.json
COPY --from=prerelease /app/next.config.ts* ./
COPY --from=prerelease /app/tsconfig.json ./

# Copy production node_modules
COPY --from=install /temp/prod/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]

