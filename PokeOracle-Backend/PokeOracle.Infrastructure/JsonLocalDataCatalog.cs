using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;

namespace PokeOracle.Infrastructure.Data;

/// <summary>
/// Lee los catálogos locales desde la carpeta <c>Data</c>, que se copia junto al
/// ensamblado al compilar.
/// </summary>
public sealed class JsonLocalDataCatalog : ILocalDataCatalog
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly ILogger<JsonLocalDataCatalog> _logger;
    private readonly Lazy<IReadOnlyList<MoveCatalogEntryDto>> _moves;
    private readonly Lazy<IReadOnlyList<PokemonCatalogEntryDto>> _pokemon;

    public JsonLocalDataCatalog(ILogger<JsonLocalDataCatalog> logger)
    {
        _logger = logger;
        _moves = new Lazy<IReadOnlyList<MoveCatalogEntryDto>>(
            () => Load<MoveCatalogEntryDto>("moves_data.json"),
            LazyThreadSafetyMode.ExecutionAndPublication);
        _pokemon = new Lazy<IReadOnlyList<PokemonCatalogEntryDto>>(
            LoadPokemon,
            LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public IReadOnlyList<MoveCatalogEntryDto> GetMoves() => _moves.Value;

    public IReadOnlyList<PokemonCatalogEntryDto> GetPokemon() => _pokemon.Value;

    private IReadOnlyList<PokemonCatalogEntryDto> LoadPokemon()
    {
        var seeds = Load<LocalPokemonSeed>("pokemon_data.json");

        // El archivo local no trae número de Pokédex: va ordenado por Kanto, así que
        // la posición sirve como número mientras no haya sprites que correlacionar.
        return seeds
            .Select((seed, index) => new PokemonCatalogEntryDto
            {
                PokedexNumber = index + 1,
                Name = seed.Name,
                Types = seed.Types,
                Hp = seed.Hp,
                Attack = seed.Attack,
                Defense = seed.Defense,
                SpAttack = seed.SpAttack,
                SpDefense = seed.SpDefense,
                Speed = seed.Speed
            })
            .ToList();
    }

    private IReadOnlyList<T> Load<T>(string fileName)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", fileName);

        if (!File.Exists(path))
        {
            _logger.LogWarning("No se encontró el catálogo local {Path}.", path);
            return Array.Empty<T>();
        }

        try
        {
            var items = JsonSerializer.Deserialize<List<T>>(File.ReadAllText(path), JsonOptions);
            _logger.LogInformation("Catálogo local {File} cargado: {Count} elementos.", fileName, items?.Count ?? 0);
            return items ?? (IReadOnlyList<T>)Array.Empty<T>();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "El catálogo local {Path} no es JSON válido.", path);
            return Array.Empty<T>();
        }
    }

    private sealed class LocalPokemonSeed
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Types { get; set; } = new();
        public int Hp { get; set; }
        public int Attack { get; set; }
        public int Defense { get; set; }
        public int SpAttack { get; set; }
        public int SpDefense { get; set; }
        public int Speed { get; set; }
    }
}
