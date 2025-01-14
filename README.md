# Intual

RAG-as-a-Service.

## Direct Dependencies

> :warning: **If you use the devcontainer, these dependencies are preinstalled.**

- AWS CLI V2: `brew install awscli`
- AWS CDK: `npm i -g aws-cdk`
- Docker
- [Doppler](https://docs.doppler.com/docs/install-cli)
- Go 1.22: `brew install go`
- [golang-migrate](https://github.com/golang-migrate/migrate): `brew install golang-migrate`
- [sqlc](https://sqlc.dev/): `brew install sqlc`

## Initial Setup

1. Open the repository in a devcontainer so all your tools are installed
2. Create your own AWS IAM development role, then run `aws configure [--profile your_profile]`.
3. Run `doppler login`
4. Run the below commands to spin up your development infrastructure
5. The mock script tells you what's next. You must run the frontend and API separately, so 3 total terminals.

```
python3 mock.py --name your_name [--profile your_profile]
```

You can tear down the docker-compose stack by running `docker compose -f scripts/docker-compose.mock.yml down` .

## Developing Locally

### Instructions

The frontend and API are run outside docker containers, but the local infra layer is a docker-compose stack. This is because `fly.io` doesn't actually use Docker under the hood, otherwise this whole project could be one docker-compose file.

Therefore, you have to run all 3 independently:

| Layer    | Command                         | Port(s)                     |
| -------- | ------------------------------- | --------------------------- |
| frontend | `doppler run -- npm run dev`    | `:3000`                     |
| api      | `doppler run -- go run main.go` | `:8080`                     |
| infra    | `python3 ./mock.py`             | `:5432` , `:6333` , `:6334` |

The `infra` layer runs Postgres & Qdrant locally. All environment variables are handled by Doppler, and are directly injected into the frontend and backend.

### Data Model

The API generates Go models based on the database schema. Therefore, the mock script has 3 jobs:

1. Initialize all databases
2. Apply migrations
3. Generate Go data models

This makes it easy for the backend to automatically have the correct relationships modeled based on the SQL schema specified in `migrations` . However, this **must** be generated before running the api (which is what `mock.py` does).

**This code is not committed.** Not committing this code reduces the likelihood of it being changed manually and having your changes destroyed when it's inevitably regenerated.

### Local Postgres, Qdrant

The infra layer is mocked locally using `docker-compose` .

- Postgres: DB on `:5432`
- Qdrant: DB on `:6333`, UI on `:6334` (unsecured in dev)

The `mock.py` script automatically applies all migrations.

## Going to Prod

TODO
