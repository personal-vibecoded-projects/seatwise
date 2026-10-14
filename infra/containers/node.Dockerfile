FROM node:24.14.1-bookworm-slim@sha256:b506e7321f176aae77317f99d67a24b272c1f09f1d10f1761f2773447d8da26c
WORKDIR /app
RUN npm install --global pnpm@10.34.5
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build && chown -R node:node /app
USER node
CMD ["node", "dist/apps/api/src/main.js"]
