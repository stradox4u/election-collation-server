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

FROM node:18-alpine3.17 AS Build
WORKDIR /app
COPY package*.json ./

RUN npm install --silent
COPY . .
RUN npm run build

# Deploy built image

FROM node:18-alpine3.17 AS production
WORKDIR /app
COPY --from=Build /app/package*.json ./
RUN npm install --omit=dev
COPY --from=Build /app/dist ./dist

RUN npx prisma migrate deploy --schema=prisma/schema.prisma
RUN npm run seed:prod

EXPOSE 80

CMD ["npm", "run", "start:prod"]

