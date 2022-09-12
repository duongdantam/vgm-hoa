# FY player

Fuyin player

## Set up

`yarn`

## Dev

- Browser (localhost:4200)

  - `yarn start`

- Electron

  - `yarn start.electron.fy`

## Build

- Android

  - `yarn prepare.ionic.fy.android`

- IOS

  - `yarn prepare.ionic.fy.ios`

- MacOS

  - `yarn build.electron.fy.mac`

- Windows

  - `yarn build.electron.fy.windows`

- Linux

  - `yarn build.electron.fy.linux`

## Open native SDK builder

- Android

  - `yarn open.ionic.fy.android`

- IOS

  - `yarn open.ionic.fy.ios`

## Host website in docker

- Build image and run in background

  - `docker-compose up -d`

## Host website in docker with dokku

- Create dokku apps

  - `dokku apps:create fy`

- Add git remote to dokku

  - `git remote add dokku dokku@<your_server_IP_or_Domain>:fy`

- Deploy

  - `git push dokku main:master`

- Your app is available at

  - `<your_server_IP_or_Domain>:<your_app_port>`
