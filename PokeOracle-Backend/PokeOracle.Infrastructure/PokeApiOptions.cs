namespace PokeOracle.Infrastructure.PokeApi;

/// <summary>
/// Configuración del cliente de PokéAPI usado solo durante el seeding inicial.
/// En runtime las peticiones se sirven desde SQLite.
/// </summary>
public sealed class PokeApiOptions
{
    public const string SectionName = "PokeApi";
    public const string HttpClientName = "PokeApi";

    /// <summary>Pokémon nacionales a descargar (Gen 1–9 actuales ≈ 1025).</summary>
    public int PokemonCount { get; set; } = 1025;

    public string BaseAddress { get; set; } = "https://pokeapi.co/api/v2/";

    public string UserAgent { get; set; } = "PokeOracle/2.0 (+https://github.com/DavidAlonsoRomeroMedina/pokeoracle-analyzer)";

    /// <summary>Timeout por petición HTTP durante el seeding (PokéAPI a veces es lenta).</summary>
    public int RequestTimeoutSeconds { get; set; } = 60;

    public int MaxConcurrentRequests { get; set; } = 6;

    public int MaxAttempts { get; set; } = 5;

    public int RetryBaseDelayMilliseconds { get; set; } = 500;

    /// <summary>Cuántos Pokémon guardar por lote en SQLite.</summary>
    public int PokemonSaveBatchSize { get; set; } = 40;

    /// <summary>
    /// Máximo de objetos a descargar. 0 = todo el catálogo (más lento).
    /// 800 cubre held items y consumibles habituales sin alargar demasiado el primer arranque.
    /// </summary>
    public int ItemScanLimit { get; set; } = 800;

    /// <summary>Máximo de movimientos a descargar desde PokéAPI (0 = todos).</summary>
    public int MoveScanLimit { get; set; } = 0;
}
