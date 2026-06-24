
## Proyecto Primer Parcial

- Nombre - Frida Julieta González Mena
- Projecto - PetRadar 
- Materia - Programación Georeferencial
- Profesor - Juan de Dios Frausto

## Description

API REST en NestJS para registrar mascotas perdidas y encontradas.  
Cuando registras una mascota encontrada, se busca automáticamente en `lost_pets` dentro de un radio de **500m** usando PostGIS (`ST_DWithin(...::geography, 500)`) y se envía un correo con los datos + mapa estático de Mapbox.

## Project setup

```bash
$ npm install
```

## Requisitos para probar

- **Docker Desktop** (recomendado) para levantar PostGIS rápido, o un Postgres con extensión **PostGIS**.
- **Node.js** (ya lo tienes si corre Nest).

## Levantar PostGIS (con Docker)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

La DB quedará en `localhost:5432` con:

- user: `postgres`
- pass: `postgres`
- db: `petradar`

## Configurar variables de entorno

1) Copia el ejemplo:

```bash
copy .env.example .env
```

2) Edita `.env` y pon tus credenciales SMTP + `MAPBOX_ACCESS_TOKEN`.

Notas:
- Si **no** configuras SMTP, la API igual funciona, pero **no enviará correos** (lo omite).
- El mapa en el correo requiere `MAPBOX_ACCESS_TOKEN`.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Probar endpoints (PowerShell)

### 1) Registrar mascota perdida

```powershell
$body = @{
  name="Firulais"
  species="perro"
  breed="mestizo"
  color="café"
  size="mediano"
  description="Collar rojo"
  photo_url=$null
  owner_name="Juan Pérez"
  owner_email="dueno@ejemplo.com"
  owner_phone="555-000-111"
  lat=25.6866
  lng=-100.3161
  address="Centro, Monterrey"
  lost_date="2026-03-16T18:00:00.000Z"
  is_active=$true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/lost-pets" -ContentType "application/json" -Body $body
```

### 2) Registrar mascota encontrada (dispara búsqueda + correo)

Pon un punto cerca (a <500m) del anterior:

```powershell
$body = @{
  species="perro"
  breed="mestizo"
  color="café"
  size="mediano"
  description="Perro tranquilo, parece perdido"
  photo_url=$null
  finder_name="María"
  finder_email="encontro@ejemplo.com"
  finder_phone="555-222-333"
  lat=25.6870
  lng=-100.3157
  address="A 2 calles del centro"
  found_date="2026-03-16T19:00:00.000Z"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/found-pets" -ContentType "application/json" -Body $body
```

La respuesta incluye:
- `foundPet`: el registro creado
- `matches_notified`: cuántos dueños fueron notificados (si SMTP está configurado)

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).
