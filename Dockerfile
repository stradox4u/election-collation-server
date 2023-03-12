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

# ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
# ENV PATH=$PATH:/home/node/.npm-global/bin

# RUN mkdir /app
# RUN chown -R node:node /app

# USER node

# WORKDIR /app
# COPY --chown=node:node package*.json ./
# COPY --chown=node:node wait-for-it.sh ./


# FROM base as production

# RUN npm install
# COPY . .