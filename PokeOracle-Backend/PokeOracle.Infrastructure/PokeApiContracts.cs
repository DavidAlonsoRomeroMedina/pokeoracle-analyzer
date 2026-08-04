using System.Text.Json.Serialization;

namespace PokeOracle.Infrastructure.PokeApi;

// Estos tipos reflejan literalmente el JSON de PokéAPI y son internos a propósito:
// la forma de la API externa no debe filtrarse hacia Application ni Domain.
// Todas las propiedades son anulables porque PokéAPI omite campos según el recurso
// (por ejemplo, "potion" no trae "cost" mientras que "master-ball" sí).

internal sealed record NamedApiResource
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("url")]
    public string? Url { get; init; }
}

internal sealed record ResourceListResponse
{
    [JsonPropertyName("count")]
    public int Count { get; init; }

    [JsonPropertyName("results")]
    public List<NamedApiResource>? Results { get; init; }
}

internal sealed record LocalizedName
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("language")]
    public NamedApiResource? Language { get; init; }
}

internal sealed record EffectEntry
{
    [JsonPropertyName("short_effect")]
    public string? ShortEffect { get; init; }

    [JsonPropertyName("effect")]
    public string? Effect { get; init; }

    [JsonPropertyName("language")]
    public NamedApiResource? Language { get; init; }
}

internal sealed record PokemonResponse
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("height")]
    public int Height { get; init; }

    [JsonPropertyName("weight")]
    public int Weight { get; init; }

    [JsonPropertyName("sprites")]
    public PokemonSprites? Sprites { get; init; }

    [JsonPropertyName("types")]
    public List<PokemonTypeSlot>? Types { get; init; }

    [JsonPropertyName("abilities")]
    public List<PokemonAbilitySlot>? Abilities { get; init; }

    [JsonPropertyName("stats")]
    public List<PokemonStatSlot>? Stats { get; init; }
}

internal sealed record PokemonSprites
{
    [JsonPropertyName("front_default")]
    public string? FrontDefault { get; init; }

    [JsonPropertyName("front_shiny")]
    public string? FrontShiny { get; init; }

    [JsonPropertyName("back_default")]
    public string? BackDefault { get; init; }

    [JsonPropertyName("other")]
    public OtherSprites? Other { get; init; }
}

internal sealed record OtherSprites
{
    [JsonPropertyName("official-artwork")]
    public ArtworkSprites? OfficialArtwork { get; init; }
}

internal sealed record ArtworkSprites
{
    [JsonPropertyName("front_default")]
    public string? FrontDefault { get; init; }
}

internal sealed record PokemonTypeSlot
{
    [JsonPropertyName("slot")]
    public int Slot { get; init; }

    [JsonPropertyName("type")]
    public NamedApiResource? Type { get; init; }
}

internal sealed record PokemonAbilitySlot
{
    [JsonPropertyName("slot")]
    public int Slot { get; init; }

    [JsonPropertyName("is_hidden")]
    public bool IsHidden { get; init; }

    [JsonPropertyName("ability")]
    public NamedApiResource? Ability { get; init; }
}

internal sealed record PokemonStatSlot
{
    [JsonPropertyName("base_stat")]
    public int BaseStat { get; init; }

    [JsonPropertyName("stat")]
    public NamedApiResource? Stat { get; init; }
}

internal sealed record AbilityResponse
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("names")]
    public List<LocalizedName>? Names { get; init; }

    [JsonPropertyName("effect_entries")]
    public List<EffectEntry>? EffectEntries { get; init; }
}

internal sealed record ItemResponse
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("cost")]
    public int? Cost { get; init; }

    [JsonPropertyName("category")]
    public NamedApiResource? Category { get; init; }

    [JsonPropertyName("sprites")]
    public ItemSprites? Sprites { get; init; }

    [JsonPropertyName("names")]
    public List<LocalizedName>? Names { get; init; }

    [JsonPropertyName("effect_entries")]
    public List<EffectEntry>? EffectEntries { get; init; }

    /// <summary>Única fuente fiable para saber en qué generación aparece el objeto.</summary>
    [JsonPropertyName("game_indices")]
    public List<ItemGameIndex>? GameIndices { get; init; }
}

internal sealed record ItemSprites
{
    [JsonPropertyName("default")]
    public string? Default { get; init; }
}

internal sealed record ItemGameIndex
{
    [JsonPropertyName("generation")]
    public NamedApiResource? Generation { get; init; }
}
