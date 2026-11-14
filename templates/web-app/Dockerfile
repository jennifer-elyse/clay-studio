# syntax=docker/dockerfile:1.6

ARG NODE_IMAGE=node:22-alpine3.23

FROM ${NODE_IMAGE} AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build client assets
RUN npm run build
RUN test -f client/dist/index.html && test -d client/dist/assets


# --- Runtime image ---
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Apply Alpine security updates, including fixes released after the base image was published.
RUN apk upgrade --no-cache

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
	&& npm cache clean --force \
	&& rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Copy built client and the Express server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server

EXPOSE 8080
CMD ["node", "server/index.js"]
