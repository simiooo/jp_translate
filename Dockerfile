# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
RUN npm i -g bun

# Copy source code and build the application
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["bun", "run", "start"]
# Production stage with Nginx
# FROM node:22-alpine

# WORKDIR /app

# # Copy built application and dependencies
# # COPY --from=build /app/build ./build
# COPY --from=build /app/package*.json ./
# RUN curl https://get.volta.sh | bash
# RUN volta install node@22.5.1
# RUN volta install pnpmp@10
# RUN volta install bun
# # Expose port for SSR server
# EXPOSE 3000

# # Start the SSR server with bun
# CMD ["bun", "run", "start"]
