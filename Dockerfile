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
WORKDIR /app
COPY package*.json ./

RUN npm ci --quiet

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 80

# Run node directly (not via npm) so it receives SIGTERM and shuts down cleanly
CMD ["node", "dist/main"]

