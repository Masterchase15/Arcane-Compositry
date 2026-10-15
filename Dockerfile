# Runs the Arcane Compositry companion site. See docs/DEPLOYING.md.
FROM node:24-alpine
WORKDIR /app
COPY package.json server.js ./
COPY server ./server
COPY data ./data
COPY public ./public
COPY scripts ./scripts
# Accounts and characters live here - mount a volume on it so they survive rebuilds.
VOLUME /app/storage
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
