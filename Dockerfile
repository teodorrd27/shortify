# Build stage
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-alpine

# Guard against CVE-2024-21538 -- https://nvd.nist.gov/vuln/detail/CVE-2024-21538
RUN npm install -g npm@10.9.0 && \
  npm uninstall -g cross-spawn && \
  npm cache clean --force && \
  find /usr/local/lib/node_modules -name "cross-spawn" -type d -exec rm -rf {} + && \
  npm i -g cross-spawn@7.0.5 --force && \
  npm config set save-exact=true && \
  npm config set legacy-peer-deps=true
# Guard against CVE-2024-21538

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port your app runs on
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
