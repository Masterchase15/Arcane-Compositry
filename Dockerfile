# Runs the Arcane Compositry companion site. See docs/DEPLOYING.md.
FROM node:24-alpine
WORKDIR /app
COPY package.json server.js ./
COPY server ./server
COPY data ./data
COPY public ./public
COPY scripts ./scripts
# Accounts and characters live in /app/storage. Mount a persistent volume there
# (Railway: add a volume at /app/storage; docker run: -v arcane-data:/app/storage)
# so they survive rebuilds. No VOLUME line: Railway does not allow it.
ENV STORAGE_DIR=/app/storage
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
