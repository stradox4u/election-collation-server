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
FROM node:18-alpine3.17 as build
WORKDIR /app
COPY package*.json ./

RUN npm install --silent
COPY . .
RUN npm run build

FROM node:18-alpine3.17 as production
WORKDIR /app
COPY --from=buid /app/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["npm", "run", "start:prod"]

