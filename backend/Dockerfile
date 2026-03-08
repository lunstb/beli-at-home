FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy migrations
COPY src/database/migrations ./dist/database/migrations

# Create data directory
RUN mkdir -p /app/data /app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
