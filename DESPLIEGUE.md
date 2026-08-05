# Despliegue de PokeOracle en la nube

PokeOracle arranca como API .NET + SPA, con **SQLite** como base local.
En el **primer arranque** un `HostedService` descarga ~1025 Pokémon (y habilidades / movimientos / objetos) desde PokéAPI **en segundo plano**. Mientras tanto la API responde `503` en el catálogo y expone el progreso en:

```http
GET /api/catalog/status
```

Cuando `ready` sea `true`, todas las peticiones se sirven **solo desde SQLite** (ya no se llama a PokéAPI en runtime).

## Requisitos

- Docker instalado (local) **o** cuenta en [Render](https://render.com) / [Railway](https://railway.app) / AWS App Runner
- La primera descarga puede tardar **varios minutos**; monta un volumen persistente para no repetirla

## 1) Probar en local con Docker

```bash
docker build -t pokeoracle .
docker run --rm -p 8080:8080 -v pokeoracle-data:/data pokeoracle
```

Abre:

- App: http://localhost:8080
- Estado del seeding: http://localhost:8080/api/catalog/status
- Swagger (si `ASPNETCORE_ENVIRONMENT=Development`): http://localhost:8080/swagger

## 2) Render (recomendado para hoy)

1. Sube este repo a GitHub (ya lo tienes).
2. En Render → **New** → **Web Service** → conecta el repo.
3. Ajustes:
   - **Runtime**: Docker
   - **Dockerfile path**: `Dockerfile` (raíz)
   - **Health check path**: `/api/catalog/status` (o `/` cuando el seeding termine)
4. **Disk** (importante): añade un persistent disk montado en `/data` (1 GB basta).
5. Variables de entorno (opcionales; ya hay defaults en el `Dockerfile`):

| Variable | Valor sugerido |
|----------|----------------|
| `ConnectionStrings__PokeOracle` | `Data Source=/data/pokeoracle.db` |
| `PokeApi__PokemonCount` | `1025` |
| `PokeApi__MaxConcurrentRequests` | `6` |

6. Deploy. Espera a que `/api/catalog/status` diga `"ready": true`.
7. Comparte la URL HTTPS pública de Render (tipo `https://pokeoracle-xxxx.onrender.com`).

> Nota: en el plan gratuito Render puede “dormir” el servicio. El disco persistente evita re-seedear al despertar.

## 3) Railway

1. **New Project** → Deploy from GitHub repo.
2. Railway detecta el `Dockerfile`.
3. Añade un **Volume** montado en `/data`.
4. Variable `PORT` la inyecta Railway; el `docker-entrypoint.sh` la respeta.
5. Abre la URL generada y espera el seeding.

## 4) AWS App Runner

1. Empuja la imagen a ECR:

```bash
aws ecr create-repository --repository-name pokeoracle
docker tag pokeoracle:latest <account>.dkr.ecr.<region>.amazonaws.com/pokeoracle:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/pokeoracle:latest
```

2. App Runner → Create service → Container registry → esa imagen.
3. Puerto: `8080`.
4. Monta almacenamiento EFS o, si no, acepta que cada instancia nueva reseedea (más lento). Para la demo de hoy, **Render/Railway con disco** es más simple.

## Comprobar que todo va bien

```bash
curl -s https://TU-URL/api/catalog/status
curl -s https://TU-URL/api/catalog/pokemon | head
```

Debes ver ~1025 entradas con `spriteUrl` / stats.

## Desarrollo local sin Docker

```bash
cd PokeOracle-Backend/PokeOracle.WebApi
dotnet run
```

La base queda en `PokeOracle-Backend/PokeOracle.WebApi/Data/pokeoracle.db` (gitignored).

## Notas de diseño

- **No** uses binding forzado a `0.0.0.0:5110` ni scripts QR/LAN: en la nube el host inyecta `PORT` y HTTPS termina en el proxy.
- Si el seeding falla a mitad, reinicia el servicio: el seeder **continúa** con los Pokémon que falten.
- Baja `PokeApi__MaxConcurrentRequests` si PokéAPI te rate-limita.
