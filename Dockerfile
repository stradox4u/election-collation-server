# Build for development

FROM node:18 AS dev
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

FROM node:18-alpine3.17 AS production
RUN apk add --no-cache tini
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

