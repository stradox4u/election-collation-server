# stage 1 building the code
FROM node:18 AS base
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

FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./

RUN npm install --silent
COPY . .
RUN npm run build

FROM node:18-alpine as production
WORKDIR /app
COPY --from=buid /app/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["npm", "run", "start:prod"]