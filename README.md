<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Init version dependencies

1. NestJS: 9.0.0
2. Typescript: 4.7.4
3. Postgres: 14.3
4. NodeJS: 17.3.0
5. Npm: 8.5.2

# Init BQE-APP-BACKEND locally

1. Clone Project ```git clone https://github.com/andresfgp/nest-postgres-new-shop.git```
2. Install dependencies: ```yarn install```
3. Make sure your Node.js and npm versions are up to init versions
4. Clone file ```.env.template``` and rename it to ```.env```
5. In this file ```.env``` set up the local environment variables 
6. Start the database
```
docker-compose up -d
```
7. Start the server:  ```yarn start:dev```
8. Local backend server must run on: `localhost:3001`

# Branches
1. Master (Production) ```git checkout master```
2. dev (testing) ```git checkout dev```

# Production

1. All the changes you do on MASTER branch will be automatically deploy to production
2. Web Server and the Database are deploy in ```https://render.com/``` connected with github
