#!/bin/sh
set -eu

# Render / Railway / App Runner suelen inyectar PORT.
if [ -n "${PORT:-}" ]; then
  export ASPNETCORE_URLS="http://+:${PORT}"
fi

# Asegura el directorio de la base SQLite.
DB_PATH="${ConnectionStrings__PokeOracle:-Data Source=/data/pokeoracle.db}"
DB_FILE=$(printf '%s' "$DB_PATH" | sed 's/[Dd]ata [Ss]ource=//')
DB_DIR=$(dirname "$DB_FILE")
mkdir -p "$DB_DIR"

echo "PokeOracle escuchando en ${ASPNETCORE_URLS}"
echo "SQLite: ${DB_FILE}"
echo "El primer arranque descarga ~1025 Pokémon desde PokéAPI en segundo plano."
echo "Consulta GET /api/catalog/status hasta que ready=true."

exec dotnet PokeOracle.WebApi.dll
