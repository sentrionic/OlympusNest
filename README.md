# OlympusNest

OlympusNest is a backend for the [OlympusBlog](https://github.com/sentrionic/OlympusBlog) using [NestJS](https://nestjs.com/).

## Stack

- [MikroORM](https://mikro-orm.io/) as the DB ORM
- [Sharp](https://github.com/lovell/sharp) for image resizing
- [Yup](https://github.com/jquense/yup) for validation

## Getting started

1. Clone this repository
2. Install Postgres and Redis.
3. Run `yarn` to install all the dependencies
4. Rename `.env.example` to `.env`
   and fill out the values. AWS is only required if you want file upload,
   GMail if you want to send reset emails.
5. Run `yarn start:dev`.
6. Go to `localhost:4000` for a list of all the endpoints.
