# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY *.env* ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source code and build the application
COPY . .
RUN pnpm run build
# Production stage with Nginx
FROM node:24-alpine

WORKDIR /app

# Copy built application and dependencies
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY --from=build /app/*.env* ./
RUN npm install -g pnpm && pnpm install
# Expose port for SSR server
EXPOSE 3000

# Start the SSR server with bun
CMD ["pnpm", "run", "start"]
