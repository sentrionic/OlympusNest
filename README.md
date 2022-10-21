# OlympusNest

OlympusNest is a backend for the [OlympusBlog](https://github.com/sentrionic/OlympusBlog) using [NestJS](https://nestjs.com/).

## Stack

- [MikroORM](https://mikro-orm.io/) as the DB ORM
- [Sharp](https://github.com/lovell/sharp) for image resizing
- [Yup](https://github.com/jquense/yup) for validation

## Getting started

1. Clone this repository
2. Install Postgres and Redis.
   ```bash
   $ docker run --name postgres -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres:alpine
   $ docker run --name redis -d -p 6379:6379 redis:alpine redis-server --save 60 1
   ```
3. Create the DB
   ```bash
   $ docker exec -it postgres createdb --username=root --owner=root blog
   ```
4. Run `yarn` to install all the dependencies
5. Rename `.env.example` to `.env`
   and fill out the values. AWS is only required if you want file upload,
   Gmail if you want to send reset emails.
6. Run `yarn start:dev`.
7. Go to `localhost:4000` for a list of all the endpoints.
