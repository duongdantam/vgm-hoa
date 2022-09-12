# FY Redis Cache

## Install

- `npm install`

## Start

- `yarn start api`

## Build

- `yarn build.api`

## Dockerize

- Edit docker-compose-api.yml

  - `yarn docker.api`

## Deploy with dokku

- Create dokku apps

  - `dokku apps:create <APP_NAME>`

- Map port

  - `dokku proxy:ports-add <APP_NAME> http:3333:3333`

- Check ipfs-node and redis's internal IP

  - `dokku network:report <IPFS_NODE_NAME>`
  - `dokku redis:info <REDIS_SERVICE_NAME>`

- Set enviroment variables

  - `dokku config:set`

```
DOKKU_DOCKERFILE_PORTS:   3333/tcp
DOKKU_PROXY_PORT_MAP:     http:3333:3333
IPFS_GATEWAY:             http://<IPFS_GATEWAY_INTERNAL_IP>:<IPFS_INTERNAL_PORT>
REDIS_CACHE_EXPIRE_TIME:  300
REDIS_URL:                redis://:<REDIS_PASSWORD>@<REDIS_INTERNAL_NETWORK_IP>:<REDIS_PORT>
```

- Deploy docker container from image

  - `dokku git:from-image <APP_NAME> <IMAGE_NAME>`
