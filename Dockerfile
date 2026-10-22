# Node 24 LTS. Keep both stages on 24.22.1 or later: it fixes the Brotli
# decoder vulnerability CVE-2026-111497.

# Build for development

FROM node:24.22.1-trixie AS dev
WORKDIR /app
COPY package*.json ./

RUN apt-get update
RUN apt-get -y install \
    cmake

RUN npm ci --quiet
COPY . .

RUN npm run build

RUN npx prisma generate
COPY . ./

# Build for production
# Migrations and seeding run in Railway's pre-deploy command (see railway.json),
# where the database is reachable over the private network.

FROM node:24.22.1-alpine3.24 AS production
# Prisma 5 can't detect OpenSSL 3 on this Alpine release without the openssl
# CLI, and falls back to an OpenSSL 1.1 engine that fails to load
RUN apk add --no-cache tini openssl
WORKDIR /app
COPY package*.json ./

RUN npm ci --quiet

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 80

# tini runs as PID 1 and forwards SIGTERM to node (npm would not), and node
# not being PID 1 means it exits once Nest finishes its shutdown hooks
CMD ["/sbin/tini", "--", "node", "dist/main"]

