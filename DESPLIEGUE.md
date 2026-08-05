# Despliegue de PokeOracle en Render (listo para hoy)

## Opción A — Blueprint (recomendado, 2 minutos de clic)

1. Abre: [New Blueprint on Render](https://dashboard.render.com/select-repo?type=blueprint)
2. Conecta el repo **DavidAlonsoRomeroMedina/pokeoracle-analyzer**
3. Rama: `cursor/sqlite-seed-cloud-deploy-b208` (o `main` cuando merges el PR)
4. Render detectará `render.yaml` → **Apply**
5. Espera a que el deploy quede **Live**
6. Abre tu URL HTTPS (tipo `https://pokeoracle-xxxx.onrender.com`)
7. Comprueba el seeding:

```bash
curl -s https://TU-URL.onrender.com/api/catalog/status
```

Cuando veas `"ready": true`, la app ya sirve los ~1025 Pokémon desde SQLite.

> El primer seeding tarda **varios minutos**. La web responde antes; el catálogo completa en segundo plano.
> El disco en `/data` evita repetir la descarga en el siguiente reinicio.

## Opción B — Web Service manual

1. Render → **New** → **Web Service** → este repo
2. Ajustes:
   - **Runtime**: Docker
   - **Branch**: `cursor/sqlite-seed-cloud-deploy-b208`
   - **Dockerfile path**: `./Dockerfile`
   - **Health Check Path**: `/api/catalog/status`
3. **Disk** (Starter o superior): mount path `/data`, 1 GB
4. Variables de entorno:

| Variable | Valor |
|----------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__PokeOracle` | `Data Source=/data/pokeoracle.db` |
| `PokeApi__PokemonCount` | `1025` |
| `PokeApi__MaxConcurrentRequests` | `6` |

5. **Create Web Service**

## Plan free (sin disco)

Puedes desplegar en **free**, pero:
- No hay disco persistente → al dormirse/reiniciar se vuelve a seedear
- Quita el bloque `disk` de `render.yaml` o no añadas Disk en el dashboard
- Pon `ConnectionStrings__PokeOracle` = `Data Source=/tmp/pokeoracle.db`

Para la presentación, **Starter + disco de 1 GB** es lo fiable.

## Probar en local con Docker

```bash
docker build -t pokeoracle .
docker run --rm -p 8080:8080 -v pokeoracle-data:/data pokeoracle
```

- App: http://localhost:8080  
- Estado: http://localhost:8080/api/catalog/status  

## Desarrollo local sin Docker

```bash
cd PokeOracle-Backend/PokeOracle.WebApi
dotnet run
```

## Checklist del día de la demo

1. Deploy Live en Render  
2. `GET /api/catalog/status` → `"ready": true`  
3. Abre la URL pública en el proyector / móviles  
4. (Opcional) Envíate un ping cada ~10 min si usas free, para que no se duerma  

## Notas

- Render inyecta `PORT`; el `docker-entrypoint.sh` lo respeta.
- Tras el seeding, **no** se llama a PokéAPI en las peticiones normales.
- Si el seeding falla a mitad, reinicia el servicio: continúa con lo que falte.
