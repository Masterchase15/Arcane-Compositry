# Runs the Arcane Compositry companion site. See docs/DEPLOYING.md.

# 1. Build the React front end (web/) into dist/.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.ts tsconfig.json components.json ./
COPY web ./web
COPY shared ./shared
RUN npm run build

# 2. The server itself: only Node's built-in modules, plus the built site.
FROM node:24-alpine
WORKDIR /app
COPY package.json server.js ./
COPY server ./server
COPY shared ./shared
COPY data ./data
COPY scripts ./scripts
COPY --from=build /app/dist ./dist
# Accounts and characters live in /app/storage. Mount a persistent volume there
# (Railway: add a volume at /app/storage; docker run: -v arcane-data:/app/storage)
# so they survive rebuilds. No VOLUME line: Railway does not allow it.
ENV STORAGE_DIR=/app/storage
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
