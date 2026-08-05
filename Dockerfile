# =============================================================================
# PokeOracle — imagen de producción (.NET 10 + SQLite + SPA en wwwroot)
# =============================================================================
# Build:
#   docker build -t pokeoracle .
# Run (persiste la DB para no re-seedear en cada reinicio):
#   docker run --rm -p 8080:8080 -v pokeoracle-data:/data pokeoracle
# =============================================================================

FROM node:22-alpine AS frontend
WORKDIR /src
COPY pokeoracle-assistant/package.json pokeoracle-assistant/package-lock.json* ./pokeoracle-assistant/
WORKDIR /src/pokeoracle-assistant
RUN npm ci || npm install
COPY pokeoracle-assistant/ ./
# Emite la SPA en ../PokeOracle-Backend/PokeOracle.WebApi/wwwroot
RUN npm run build:dotnet

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY PokeOracle-Backend/ ./PokeOracle-Backend/
COPY --from=frontend /src/PokeOracle-Backend/PokeOracle.WebApi/wwwroot ./PokeOracle-Backend/PokeOracle.WebApi/wwwroot
RUN dotnet restore PokeOracle-Backend/PokeOracle.WebApi/PokeOracle.WebApi.csproj
RUN dotnet publish PokeOracle-Backend/PokeOracle.WebApi/PokeOracle.WebApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__PokeOracle="Data Source=/data/pokeoracle.db"
ENV PokeApi__PokemonCount=1025
ENV PokeApi__MaxConcurrentRequests=6
ENV PokeApi__RequestTimeoutSeconds=60

RUN mkdir -p /data
VOLUME ["/data"]

COPY --from=build /app/publish .
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
