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

FROM node:18-alpine3.17 AS build
WORKDIR /app
COPY package*.json ./

RUN npm ci --quiet

COPY . .
RUN npx prisma migrate deploy

# Next 2 lines are needed only on initial deployment to seed db
# RUN npx prisma generate
# RUN npx prisma db seed
RUN npm run build

# Deploy built image

FROM node:18-alpine3.17 AS production
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY . .

EXPOSE 80

CMD ["npm", "run", "start:prod"]

