# Election Collation Server

An HTTP and WebSocket API for collating Nigerian election results. It holds the electoral geography (states, LGAs, wards and polling units), accepts per-polling-unit results with a photo of the result sheet, and pushes updated per-party totals to connected clients.

Stack:

- NestJS 9 on Express, TypeScript
- Prisma 5 with PostgreSQL
- Socket.IO (through `@nestjs/websockets`) for live vote totals
- AWS S3 (`@aws-sdk/client-s3`) for result-sheet images
- `nestjs-seeder` for loading the reference data
- Jest and Supertest for tests

## Prerequisites

- Node.js 18. Both Dockerfile stages use Node 18 (`node:18` and `node:18-alpine3.17`). Node 20 also works for local development.
- npm. Install with `npm ci` so you get the versions in `package-lock.json`.
- A PostgreSQL database. These instructions were checked with PostgreSQL 15 and 16. docker-compose uses the untagged `postgres` image.
- Docker with Compose v2, if you want to use `docker-compose.yml`.
- An S3 bucket and credentials, but only for submitting results (`POST /api/v1/results`). Everything else runs with placeholder AWS values.

## Configuration

All configuration comes from environment variables. Locally, copy the example file:

```bash
cp .env.example .env
```

Create `.env` before you run `npm ci` or `npx prisma generate`. The generated Prisma client only loads `.env` by itself if the file existed when the client was generated. Without that, scripts that use the client outside Nest, such as `npm run seed:prod` (`node dist/seeder`), fail with `Environment variable not found: DATABASE_URL`. If that happens, run `npx prisma generate` again. The app itself loads `.env` through `@nestjs/config`, and the Prisma CLI loads it on its own.

| Variable | Read by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Prisma (`prisma/schema.prisma`): the app, seeders, migrations and e2e tests | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/collation?schema=public`. This is the only database setting the code reads. |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `docker-compose.yml` only | Passed to the `collation_db` container as `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`, which create the database on first start. The application code does not read them. |
| `DB_HOST` | Nothing | Unused. The `seed:refresh` script sets `DB_HOST=localhost`, but no code reads it. You can leave it blank. |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `src/aws-s3/aws-s3.service.ts` | Region and credentials for the S3 client. |
| `AWS_BUCKET_NAME` | `src/aws-s3/aws-s3.service.ts` | Bucket that result-sheet images are uploaded to. Uploads set `ACL: 'public-read'`, so the bucket must have ACLs enabled. |
| `RESULT_IMAGES_FOLDER` | `src/unit-result/unit-result.service.ts` | Key prefix for uploaded images. The object key is `<RESULT_IMAGES_FOLDER><uuid>.<ext>`, so include the trailing slash, e.g. `results/`. |
| `RESULT_IMAGES_PATH_PREFIX` | `src/unit-result/unit-result.service.ts` | Prepended to the object key to build the URL stored on the result, e.g. `https://<bucket>.s3.<region>.amazonaws.com/`. |
| `APP_FRONTEND_URL` | `src/main.ts` (HTTP CORS), `src/events/events.gateway.ts` (Socket.IO CORS) | The one origin allowed to call the API from a browser, e.g. `http://localhost:5173`. Responses to other origins get no `Access-Control-Allow-Origin` header. |
| `PORT` | `src/main.ts` | Port for HTTP and Socket.IO. If unset, the app listens on 80. Locally, set something like `3000`, because port 80 usually needs root. With docker-compose it must be `8000`. |

### Values that must agree under docker-compose

- The user, password and database name in `DATABASE_URL` must match `DB_USER`, `DB_PASSWORD` and `DB_NAME`. Compose creates the database from the `DB_*` values and the app connects with `DATABASE_URL`.
- The host in `DATABASE_URL` depends on where the client runs. Use `collation_db:5432` (the compose service name) for the app inside compose. Use `localhost:5432` for commands run on your machine against the compose database.
- `PORT` must be `8000`, because compose publishes `8000:8000`.

Example `.env` for docker-compose:

```dotenv
DB_HOST=
DB_USER=collation
DB_PASSWORD=change-me
DB_NAME=collation
DATABASE_URL=postgresql://collation:change-me@collation_db:5432/collation?schema=public
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=placeholder
AWS_SECRET_ACCESS_KEY=placeholder
AWS_BUCKET_NAME=placeholder
RESULT_IMAGES_FOLDER=results/
RESULT_IMAGES_PATH_PREFIX=https://placeholder.s3.eu-west-1.amazonaws.com/
APP_FRONTEND_URL=http://localhost:5173
PORT=8000
```

## Running locally with npm

You need a PostgreSQL database. If you don't have one, a throwaway container works (port 5433 avoids clashing with a local Postgres):

```bash
docker run -d --name collation-pg \
  -e POSTGRES_USER=collation -e POSTGRES_PASSWORD=collation -e POSTGRES_DB=collation \
  -p 5433:5432 postgres:16-alpine
```

Set `DATABASE_URL=postgresql://collation:collation@localhost:5433/collation?schema=public` and `PORT=3000` in `.env`, then:

```bash
npm ci                      # installs dependencies and generates the Prisma client
npx prisma generate         # regenerate explicitly (needed after schema or Prisma changes)
npx prisma migrate deploy   # apply prisma/migrations
npx prisma db seed          # load reference data, about 40 seconds on an empty database
npm run start:dev           # watch mode
```

Check that it is up:

```bash
curl http://localhost:3000/api/v1            # Hello World!
curl http://localhost:3000/api/v1/election   # the seeded Presidential election
```

Other ways to start it:

| Script | Command |
| --- | --- |
| `npm start` | `nest start` |
| `npm run start:dev` | `nest start --watch` |
| `npm run start:debug` | `nest start --debug --watch` |
| `npm run start:prod` | `node dist/main` (run `npm run build` first) |

If you change `prisma/schema.prisma`, create a migration with `npx prisma migrate dev --name <change>` instead of using `prisma db push`. Production only applies migrations.

## Running with docker-compose

`docker-compose.yml` defines three services. None of them runs without a profile, so a plain `docker compose up` starts nothing.

| Service | Profiles | What it runs | Host port |
| --- | --- | --- | --- |
| `collation_db` | `dev`, `prod` | `postgres` image, data in the `collation_data` volume | 5432 |
| `collation_server` | `dev`, `prod` | Dockerfile `dev` stage, then `npx prisma generate && npm run start:dev` | 8000 |
| `db_seeder` | `seed` | Does not work, see [Known issues](#known-issues) | 8000 |

The `dev` and `prod` profiles start the same two services. Both run the server in watch mode from the `dev` stage. Compose never uses the Dockerfile's `production` stage, which is what Railway builds.

`collation_server` bind-mounts the repository at `/app` and your host `node_modules` at `/app/node_modules`, so the container uses the host's installed packages. Run `npm ci` on the host first. Without a populated `node_modules`, there is no local Prisma CLI: `npx prisma generate` downloads the latest Prisma instead, fails, and the container restarts in a loop.

The containers don't apply migrations or seed data. Do that with `exec` once the stack is up:

```bash
cp .env.example .env        # fill it in as in the example above
npm ci
docker compose --profile dev up --build -d
docker compose exec collation_server npx prisma migrate deploy
docker compose exec collation_server npx prisma db seed
curl http://localhost:8000/api/v1/election
```

You can also run Prisma commands from the host against the compose database by pointing `DATABASE_URL` at `localhost:5432`.

Logs and teardown:

```bash
docker compose logs -f collation_server
docker compose --profile dev down        # keeps the database volume
docker compose --profile dev down -v     # also deletes the database volume
```

Host ports 5432 and 8000 must be free.

## Seeding

`src/seeder.ts` runs these seeders in order:

| Seeder | Source | Result |
| --- | --- | --- |
| `PollingUnitSeeder` | `cleanedPUs.json` | 176,611 polling units |
| `WardSeeder` | `statesAndLgas.json`, `allWards.json` | 37 states, 774 LGAs, 8,809 wards |
| `PartySeeder` | List hard-coded in `src/seeders/party.seeder.ts` | 18 political parties |
| `PresidentialElectionSeeder` | Data seeded above | One `Presidential` election dated 2023-02-25, linked to polling units and all parties |

Each seeder skips itself if its table already has at least one row, so running the seed again does nothing and takes about 2 seconds. The check is only for whether a row exists. If a seed run is interrupted partway, re-running it will not finish the job; empty the affected tables first.

Which command to use:

| Command | What it does | Use it for |
| --- | --- | --- |
| `npx prisma db seed` | Runs `ts-node src/seeder.ts` (the `prisma.seed` entry in `package.json`) | Local development, after `npx prisma migrate deploy` |
| `npm run seed:prod` | `node dist/seeder` | Built code. Needs `npm run build` first. |
| `npm run migrate:deploy` | `prisma migrate deploy && npm run seed:prod` | The Railway pre-deploy command. Also works locally after `npm run build`. |
| `npm run seed` | `npx prisma db push && ts-node src/seeder` | Avoid on a new database. `db push` creates the tables without migration history, and a later `prisma migrate deploy` fails with error `P3005` ("The database schema is not empty"). On a database that is already migrated, the push is a no-op. |
| `npm run seed:refresh` | `ts-node src/seeder --refresh` | Same as seeding normally. `--refresh` calls each seeder's `drop()`, but they are all empty, so nothing is cleared. |

## Tests

```bash
npm test             # unit tests (src/**/*.spec.ts), no database needed
npm run test:e2e     # e2e tests (test/*.e2e-spec.ts)
npm run test:cov     # unit tests with coverage
```

The e2e suite boots the full `AppModule`, and `PrismaService` connects on startup. `DATABASE_URL` must therefore point at a reachable PostgreSQL, or the suite fails with `Can't reach database server`. The current test only requests `GET /`, but apply migrations to the test database anyway so that tests which query tables will work. Use a separate database for this. A `DATABASE_URL` set in the shell takes precedence over `.env`:

```bash
DATABASE_URL="postgresql://collation:collation@localhost:5433/collation_test?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://collation:collation@localhost:5433/collation_test?schema=public" npm run test:e2e
```

Lint and format: `npm run lint` runs ESLint with `--fix`, and `npm run format` runs Prettier with `--write`. Both rewrite files.

## API

- Every HTTP route is under the global prefix `api/v1`, e.g. `http://localhost:3000/api/v1/election`.
- The app listens on `PORT`, or on 80 if `PORT` is unset.
- CORS allows only `APP_FRONTEND_URL`, with credentials and methods GET, PUT, PATCH, POST and DELETE. Responses to any other origin carry no `Access-Control-Allow-Origin` header, so a browser frontend must be served from exactly that origin.

Routes, from the controllers in `src/`:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1` | Returns `Hello World!`. Useful as a smoke check. |
| GET | `/api/v1/election?type=<electionType>` | Lists elections with their parties. `type` (e.g. `Presidential`) is optional. |
| POST | `/api/v1/election` | Creates an election from `electionType`, `electionDate` and `electionArea`. `electionArea` is a list of `state-lga-ward` codes in the zero-padded form stored on polling units (e.g. `01-10-01`); leave off trailing parts to cover a whole state or LGA. The new election is linked to the matching polling units and all parties. |
| GET | `/api/v1/election/results?elId=<electionId>` | Total votes per party in that election, counting only its own results. Parties with no results yet show `0`. Returns 400 if `elId` is missing and 404 if no election has that id. |
| GET | `/api/v1/parties/:electionId` | Parties attached to an election. |
| GET | `/api/v1/pollingunits?key=<key>` | With no `key`, all states. `key=<state>` returns a state with its LGAs, `<state>-<lga>` an LGA with its wards, and `<state>-<lga>-<ward>` that ward's polling units. Keys are numeric ids, e.g. `1-10-1`. |
| POST | `/api/v1/results` | Submits a polling-unit result as `multipart/form-data`: `resultImage` (jpg, jpeg or png, up to 5 MB), `pollingunitId`, `electionId`, and `partyResults`, repeated once per party, each a JSON string such as `{"partyId":1,"votes":120}`. Uploads the image to S3, saves the result together with its party votes in one transaction, then broadcasts new totals. If the save fails, neither the result nor any of its votes is stored. |

Socket.IO is served on the same port at the default path `/socket.io/`, outside the `api/v1` prefix. Its CORS origin is also `APP_FRONTEND_URL`. After each successful `POST /api/v1/results`, the server emits `voteCountsUpdated` to all clients with the same per-party totals that `/election/results` returns. A client `events` message is echoed back.

## Deployment on Railway

The service deploys from the Dockerfile, as configured in `railway.json`:

```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": { "preDeployCommand": ["npm run migrate:deploy"] }
}
```

How a deploy runs:

1. **Build.** Railway builds the Dockerfile's final `production` stage (`node:18-alpine3.17`), which runs `npm ci`, `npx prisma generate` and `npm run build`. The build doesn't touch the database and needs no `DATABASE_URL`. `.dockerignore` keeps `node_modules`, `.env` and `dist` out of the build context.
2. **Pre-deploy.** Railway runs `npm run migrate:deploy` in a container from the built image, with the service's variables and access to the private network. That runs `prisma migrate deploy`, then the seeder (`node dist/seeder`). On a database that is already populated this takes a few seconds: `No pending migrations to apply.`, and every seeder skips. If this step fails, the new deployment does not start.
3. **Start.** The container runs `CMD ["/sbin/tini", "--", "node", "dist/main"]`. `tini` is PID 1 and passes SIGTERM on to node when Railway stops the container. `app.enableShutdownHooks()` then closes the HTTP server and disconnects Prisma, and the process exits. If the Railway service has a custom start command (for example `npm run start:prod`), remove it so the Dockerfile `CMD` applies. With npm as PID 1 the app never receives SIGTERM, so the container is killed (exit code 137).

Service variables:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`. Replace `Postgres` with the name of your database service. This reference resolves to the private `*.railway.internal` URL, which the pre-deploy step and the app can both reach. Don't use the public URL (`DATABASE_PUBLIC_URL`): traffic through the public proxy incurs egress fees.
- `APP_FRONTEND_URL`, the `AWS_*` variables, `RESULT_IMAGES_FOLDER` and `RESULT_IMAGES_PATH_PREFIX`, as described in [Configuration](#configuration).
- `PORT` is optional. The app listens on `PORT` if it is set and on 80 (the port the Dockerfile `EXPOSE`s) otherwise. Make sure Railway routes traffic to the same port.
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` are not needed.

### Trying the production image locally

This mirrors the Railway flow against a local database on a Docker network:

```bash
docker network create collation-net
docker run -d --name collation-pg --network collation-net \
  -e POSTGRES_USER=collation -e POSTGRES_PASSWORD=collation -e POSTGRES_DB=collation postgres:16-alpine

docker build -t collation-server .     # no database needed

# the pre-deploy step
docker run --rm --network collation-net \
  -e DATABASE_URL="postgresql://collation:collation@collation-pg:5432/collation?schema=public" \
  collation-server npm run migrate:deploy

# the app, on its default port 80
docker run -d --name collation-app --network collation-net -p 8090:80 \
  -e DATABASE_URL="postgresql://collation:collation@collation-pg:5432/collation?schema=public" \
  -e APP_FRONTEND_URL=http://localhost:5173 \
  collation-server

curl http://localhost:8090/api/v1/election
docker stop collation-app    # exits at once with code 143 (SIGTERM, after the shutdown hooks run)
```

Remove everything afterwards (`-v` also deletes the Postgres container's data volume):

```bash
docker rm -f -v collation-app collation-pg
docker network rm collation-net
docker rmi collation-server
```

## After pulling a Prisma upgrade

Run:

```bash
npm ci
npx prisma generate
```

If the client in `node_modules/.prisma/client` was not regenerated for the installed `@prisma/client`, the app fails on startup with `@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.` Run `npx prisma generate` after any change to `prisma/schema.prisma` too. The Docker image runs `prisma generate` during its build, and the compose server runs it on every start.

## Known issues

- **The compose `seed` profile does not work.** `docker compose --profile seed up` fails with `service "db_seeder" depends on undefined service "collation_db"`, because `collation_db` is not in that profile. Even with `--profile dev` added, the build fails with `target stage "base" could not be found`, because the Dockerfile has only `dev` and `production` stages. The service's `command` is also commented out. Seed with `docker compose exec collation_server npx prisma db seed` instead, as shown above.
- **`POST /api/v1/results` returns 500 for an unknown `partyId`.** The foreign-key error isn't turned into a client error. Nothing is saved to the database, but the result-sheet image has already been uploaded to S3, so it stays there with nothing pointing to it.

## Project layout

```text
src/main.ts            bootstrap: global prefix, CORS, validation, port
src/app.module.ts      root module
src/election/          election routes and totals
src/party/             parties per election
src/polling-unit/      state, LGA, ward and polling-unit lookup
src/unit-result/       result submission (S3 upload, Socket.IO broadcast)
src/events/            Socket.IO gateway
src/aws-s3/            S3 client
src/prisma/            PrismaService
src/seeder.ts          seeder entry point
src/seeders/           individual seeders
prisma/                schema and migrations
*.json (repo root)     seed data: cleanedPUs.json, statesAndLgas.json, allWards.json
```
