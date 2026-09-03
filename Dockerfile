# --- Stage 1: install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# --- Stage 2: build the app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 3: run the app ---
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user inside the container. This container is already
# isolated from your host machine, but if that isolation were ever
# breached (a bug in Docker, a container escape), a non-root process
# limits what it could do even then. Belt and suspenders.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
