# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source code and build the application
COPY . .
RUN pnpm run build

# Production stage with Nginx
FROM oven/bun:debian

WORKDIR /app

# Copy built application and dependencies
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN apt -y update
RUN apt -y install python3 python3-pip git
RUN bun install

# Expose port for SSR server
EXPOSE 3000

# Start the SSR server with bun
CMD ["bun", "run", "start"]
