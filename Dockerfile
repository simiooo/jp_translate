# Build stage
FROM oven/bun AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY * ./
COPY pnpm-lock.yaml ./


# Copy source code and build the application
COPY . .
RUN bun install -g pnpm
RUN pnpm install

# RUN bun install --production
RUN bun run build


# FROM oven/bun

# WORKDIR /app
# COPY --from=builder /app/package*.json ./
# COPY --from=builder /app/build ./
# COPY --from=builder /app/node_modules ./

EXPOSE 3000

CMD ["bun", "run", "start"]
