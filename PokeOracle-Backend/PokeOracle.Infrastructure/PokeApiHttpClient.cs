using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;

namespace PokeOracle.Infrastructure.PokeApi;

/// <summary>
/// Cliente de PokéAPI restringido a Generación 1.
/// </summary>
/// <remarks>
/// Se registra como singleton porque el catálogo de Kanto es inmutable: una vez
/// descargado se cachea en memoria para el resto de la vida del proceso. Por eso
/// toma <see cref="IHttpClientFactory"/> en lugar de un <see cref="HttpClient"/>
/// directo, que quedaría anclado a un handler que nunca se recicla.
/// </remarks>
public sealed class PokeApiHttpClient : IPokemonExternalService
{
    private const string GenerationOne = "generation-i";
    private const string SpanishLanguage = "es";
    private const string EnglishLanguage = "en";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly PokeApiOptions _options;
    private readonly ILogger<PokeApiHttpClient> _logger;

    private readonly AsyncCache<IReadOnlyList<PokemonDetailDto>> _pokemonCache = new();
    private readonly AsyncCache<IReadOnlyList<AbilityDto>> _abilitiesCache = new();
    private readonly AsyncCache<IReadOnlyList<GameItemDto>> _itemsCache = new();

    public PokeApiHttpClient(
        IHttpClientFactory httpClientFactory,
        PokeApiOptions options,
        ILogger<PokeApiHttpClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PokemonSummaryDto>> GetGenerationOnePokemonAsync(CancellationToken cancellationToken = default)
    {
        var detail = await GetAllGenerationOneDetailsAsync(cancellationToken).ConfigureAwait(false);

        return detail
            .Select(p => new PokemonSummaryDto
            {
                PokedexNumber = p.PokedexNumber,
                Name = p.Name,
                DisplayName = p.DisplayName,
                SpriteUrl = p.SpriteUrl,
                ArtworkUrl = p.ArtworkUrl,
                Types = p.Types
            })
            .ToList();
    }

    public async Task<IReadOnlyList<PokemonCatalogEntryDto>> GetGenerationOnePokemonWithStatsAsync(CancellationToken cancellationToken = default)
    {
        var detail = await GetAllGenerationOneDetailsAsync(cancellationToken).ConfigureAwait(false);

        return detail
            .Select(p => new PokemonCatalogEntryDto
            {
                PokedexNumber = p.PokedexNumber,
                Name = p.DisplayName,
                Types = p.Types,
                Hp = p.BaseStats.Hp,
                Attack = p.BaseStats.Attack,
                Defense = p.BaseStats.Defense,
                SpAttack = p.BaseStats.SpecialAttack,
                SpDefense = p.BaseStats.SpecialDefense,
                Speed = p.BaseStats.Speed,
                SpriteUrl = p.SpriteUrl,
                ArtworkUrl = p.ArtworkUrl
            })
            .ToList();
    }

    public async Task<PokemonDetailDto?> GetPokemonAsync(int pokedexNumber, CancellationToken cancellationToken = default)
    {
        if (!IsGenerationOne(pokedexNumber))
        {
            return null;
        }

        var detail = await GetAllGenerationOneDetailsAsync(cancellationToken).ConfigureAwait(false);
        return detail.FirstOrDefault(p => p.PokedexNumber == pokedexNumber);
    }

    public Task<IReadOnlyList<AbilityDto>> GetGenerationOneAbilitiesAsync(CancellationToken cancellationToken = default) =>
        _abilitiesCache.GetAsync(BuildAbilityCatalogAsync, cancellationToken);

    public Task<IReadOnlyList<GameItemDto>> GetGenerationOneItemsAsync(CancellationToken cancellationToken = default) =>
        _itemsCache.GetAsync(BuildItemCatalogAsync, cancellationToken);

    /// <summary>Comprueba que un número de Pokédex pertenece a Kanto.</summary>
    public static bool IsGenerationOne(int pokedexNumber) =>
        pokedexNumber >= 1 && pokedexNumber <= PokeApiOptions.FirstGenerationPokemonCount;

    private Task<IReadOnlyList<PokemonDetailDto>> GetAllGenerationOneDetailsAsync(CancellationToken cancellationToken) =>
        _pokemonCache.GetAsync(BuildPokemonCatalogAsync, cancellationToken);

    private async Task<IReadOnlyList<PokemonDetailDto>> BuildPokemonCatalogAsync(CancellationToken cancellationToken)
    {
        // El propio limit=151 de PokéAPI garantiza que no entren Pokémon posteriores a Kanto.
        var index = await GetJsonAsync<ResourceListResponse>(
            $"pokemon?limit={PokeApiOptions.FirstGenerationPokemonCount}",
            cancellationToken).ConfigureAwait(false);

        var entries = index?.Results ?? new List<NamedApiResource>();
        _logger.LogInformation("PokéAPI: descargando {Count} Pokémon de Kanto.", entries.Count);

        var detail = await MapWithConcurrencyAsync(
            entries,
            (entry, ct) => GetJsonAsync<PokemonResponse>(entry.Url ?? string.Empty, ct),
            cancellationToken).ConfigureAwait(false);

        var catalog = detail
            .Where(p => IsGenerationOne(p.Id))
            .Select(MapPokemon)
            .OrderBy(p => p.PokedexNumber)
            .ToList();

        _logger.LogInformation("PokéAPI: catálogo de Kanto listo con {Count} Pokémon.", catalog.Count);
        return catalog;
    }

    private async Task<IReadOnlyList<AbilityDto>> BuildAbilityCatalogAsync(CancellationToken cancellationToken)
    {
        var pokemon = await GetAllGenerationOneDetailsAsync(cancellationToken).ConfigureAwait(false);

        // Un mismo poder aparece en muchos Pokémon, así que se consulta una sola vez por habilidad.
        var owners = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        foreach (var mon in pokemon)
        {
            foreach (var ability in mon.Abilities)
            {
                if (!owners.TryGetValue(ability.Name, out var list))
                {
                    list = new List<string>();
                    owners[ability.Name] = list;
                }
                list.Add(mon.DisplayName);
            }
        }

        _logger.LogInformation("PokéAPI: descargando {Count} habilidades de los Pokémon de Kanto.", owners.Count);

        var responses = await MapWithConcurrencyAsync(
            owners.Keys.ToList(),
            (name, ct) => GetJsonAsync<AbilityResponse>($"ability/{name}", ct),
            cancellationToken).ConfigureAwait(false);

        return responses
            .Select(a => new AbilityDto
            {
                Id = a.Id,
                Name = a.Name ?? string.Empty,
                DisplayName = PickLocalizedName(a.Names, a.Name),
                ShortEffect = PickEnglishShortEffect(a.EffectEntries),
                PokemonNames = owners.TryGetValue(a.Name ?? string.Empty, out var names)
                    ? names.OrderBy(n => n, StringComparer.OrdinalIgnoreCase).ToList()
                    : new List<string>()
            })
            .OrderBy(a => a.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task<IReadOnlyList<GameItemDto>> BuildItemCatalogAsync(CancellationToken cancellationToken)
    {
        var scanLimit = _options.ItemScanLimit;
        if (scanLimit <= 0)
        {
            var index = await GetJsonAsync<ResourceListResponse>("item?limit=1", cancellationToken).ConfigureAwait(false);
            scanLimit = index?.Count ?? 0;
        }

        _logger.LogInformation("PokéAPI: inspeccionando {Count} objetos para aislar los de Generación 1.", scanLimit);

        var ids = Enumerable.Range(1, scanLimit).ToList();
        var responses = await MapWithConcurrencyAsync(
            ids,
            (id, ct) => GetJsonAsync<ItemResponse>($"item/{id}", ct),
            cancellationToken).ConfigureAwait(false);

        var catalog = responses
            .Where(IsGenerationOneItem)
            .Select(item => new GameItemDto
            {
                Id = item.Id,
                Name = item.Name ?? string.Empty,
                DisplayName = PickLocalizedName(item.Names, item.Name),
                SpriteUrl = item.Sprites?.Default,
                Category = item.Category?.Name ?? string.Empty,
                Cost = item.Cost,
                ShortEffect = PickEnglishShortEffect(item.EffectEntries)
            })
            .OrderBy(i => i.Id)
            .ToList();

        _logger.LogInformation("PokéAPI: {Count} objetos de Generación 1 encontrados.", catalog.Count);
        return catalog;
    }

    /// <summary>
    /// Un objeto pertenece a Generación 1 si aparece indexado en los juegos de esa
    /// generación. Es el único dato que PokéAPI expone al respecto.
    /// </summary>
    private static bool IsGenerationOneItem(ItemResponse item) =>
        item.GameIndices?.Any(g => string.Equals(g.Generation?.Name, GenerationOne, StringComparison.OrdinalIgnoreCase)) == true;

    private static PokemonDetailDto MapPokemon(PokemonResponse response)
    {
        var stats = response.Stats ?? new List<PokemonStatSlot>();

        return new PokemonDetailDto
        {
            PokedexNumber = response.Id,
            Name = response.Name ?? string.Empty,
            DisplayName = Humanize(response.Name),
            SpriteUrl = response.Sprites?.FrontDefault,
            ShinySpriteUrl = response.Sprites?.FrontShiny,
            BackSpriteUrl = response.Sprites?.BackDefault,
            ArtworkUrl = response.Sprites?.Other?.OfficialArtwork?.FrontDefault,
            Height = response.Height,
            Weight = response.Weight,
            Types = (response.Types ?? new List<PokemonTypeSlot>())
                .OrderBy(t => t.Slot)
                .Select(t => Humanize(t.Type?.Name))
                .Where(t => t.Length > 0)
                .ToList(),
            Abilities = (response.Abilities ?? new List<PokemonAbilitySlot>())
                .OrderBy(a => a.Slot)
                .Where(a => !string.IsNullOrWhiteSpace(a.Ability?.Name))
                .Select(a => new PokemonAbilityDto
                {
                    Name = a.Ability!.Name!,
                    DisplayName = Humanize(a.Ability.Name),
                    IsHidden = a.IsHidden,
                    Slot = a.Slot
                })
                .ToList(),
            BaseStats = new PokemonBaseStatsDto
            {
                Hp = FindStat(stats, "hp"),
                Attack = FindStat(stats, "attack"),
                Defense = FindStat(stats, "defense"),
                SpecialAttack = FindStat(stats, "special-attack"),
                SpecialDefense = FindStat(stats, "special-defense"),
                Speed = FindStat(stats, "speed")
            }
        };
    }

    private static int FindStat(List<PokemonStatSlot> stats, string statName) =>
        stats.FirstOrDefault(s => string.Equals(s.Stat?.Name, statName, StringComparison.OrdinalIgnoreCase))?.BaseStat ?? 0;

    private static string PickLocalizedName(List<LocalizedName>? names, string? fallbackSlug)
    {
        var spanish = names?.FirstOrDefault(n =>
            string.Equals(n.Language?.Name, SpanishLanguage, StringComparison.OrdinalIgnoreCase))?.Name;

        return !string.IsNullOrWhiteSpace(spanish) ? spanish : Humanize(fallbackSlug);
    }

    // PokéAPI solo publica short_effect en inglés, incluso cuando el nombre sí está traducido.
    private static string? PickEnglishShortEffect(List<EffectEntry>? entries) =>
        entries?.FirstOrDefault(e =>
            string.Equals(e.Language?.Name, EnglishLanguage, StringComparison.OrdinalIgnoreCase))?.ShortEffect;

    private static string Humanize(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return string.Empty;
        }

        var words = slug
            .Split('-', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => char.ToUpperInvariant(word[0]) + word[1..]);

        return string.Join(' ', words);
    }

    private async Task<List<TResult>> MapWithConcurrencyAsync<TSource, TResult>(
        IReadOnlyList<TSource> sources,
        Func<TSource, CancellationToken, Task<TResult?>> selector,
        CancellationToken cancellationToken)
        where TResult : class
    {
        using var throttle = new SemaphoreSlim(Math.Max(1, _options.MaxConcurrentRequests));

        var tasks = sources.Select(async source =>
        {
            await throttle.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                return await selector(source, cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                throttle.Release();
            }
        });

        var results = await Task.WhenAll(tasks).ConfigureAwait(false);

        return results.Where(r => r is not null).Select(r => r!).ToList();
    }

    /// <summary>
    /// Realiza una petición GET con reintento exponencial. Devuelve <c>null</c> ante un
    /// 404, que es esperable al recorrer ids de objetos con huecos.
    /// </summary>
    private async Task<T?> GetJsonAsync<T>(string requestUri, CancellationToken cancellationToken)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(requestUri))
        {
            return null;
        }

        var maxAttempts = Math.Max(1, _options.MaxAttempts);

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                var client = _httpClientFactory.CreateClient(PokeApiOptions.HttpClientName);

                using var response = await client.GetAsync(requestUri, cancellationToken).ConfigureAwait(false);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                response.EnsureSuccessStatusCode();

                return await response.Content
                    .ReadFromJsonAsync<T>(JsonOptions, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (attempt < maxAttempts && IsTransient(ex) && !cancellationToken.IsCancellationRequested)
            {
                var delay = TimeSpan.FromMilliseconds(_options.RetryBaseDelayMilliseconds * Math.Pow(2, attempt - 1));
                _logger.LogWarning(
                    "PokéAPI: fallo al pedir {RequestUri} (intento {Attempt}/{MaxAttempts}): {Message}. Reintentando en {Delay}ms.",
                    requestUri, attempt, maxAttempts, ex.Message, delay.TotalMilliseconds);

                await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
            }
        }
    }

    private static bool IsTransient(Exception exception) =>
        exception is HttpRequestException or TaskCanceledException or JsonException;

    /// <summary>
    /// Cachea el resultado de una descarga costosa y garantiza que varias peticiones
    /// concurrentes no disparen el mismo trabajo más de una vez. Si la descarga falla,
    /// no se cachea nada y el siguiente intento vuelve a probar.
    /// </summary>
    private sealed class AsyncCache<T> where T : class
    {
        private readonly SemaphoreSlim _gate = new(1, 1);
        private T? _value;

        public async Task<T> GetAsync(Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken)
        {
            var cached = Volatile.Read(ref _value);
            if (cached is not null)
            {
                return cached;
            }

            await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                cached = Volatile.Read(ref _value);
                if (cached is not null)
                {
                    return cached;
                }

                var created = await factory(cancellationToken).ConfigureAwait(false);
                Volatile.Write(ref _value, created);
                return created;
            }
            finally
            {
                _gate.Release();
            }
        }
    }
}
