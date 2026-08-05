namespace PokeOracle.Infrastructure.Persistence.Entities;

/// <summary>Pokémon persistido en SQLite (catálogo nacional completo).</summary>
public class PokemonEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>Tipos serializados como JSON, p. ej. ["Grass","Poison"].</summary>
    public string TypesJson { get; set; } = "[]";
    public int Hp { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }
    public string? SpriteUrl { get; set; }
    public string? ArtworkUrl { get; set; }
    public string? ShinySpriteUrl { get; set; }
    public string? BackSpriteUrl { get; set; }
    public int Height { get; set; }
    public int Weight { get; set; }

    public List<PokemonAbilityLink> AbilityLinks { get; set; } = new();
}

public class AbilityEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ShortEffect { get; set; }

    public List<PokemonAbilityLink> PokemonLinks { get; set; } = new();
}

public class PokemonAbilityLink
{
    public int PokemonId { get; set; }
    public PokemonEntity Pokemon { get; set; } = null!;
    public int AbilityId { get; set; }
    public AbilityEntity Ability { get; set; } = null!;
    public int Slot { get; set; }
    public bool IsHidden { get; set; }
}

public class MoveEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = "Physical";
    public int Power { get; set; }
    public int Accuracy { get; set; }
    public int Pp { get; set; }
    public string? ShortEffect { get; set; }
    public int StatusChance { get; set; }
    public string StatusEffect { get; set; } = "None";
    public bool IsFixedDamage { get; set; }
    public int FixedDamageValue { get; set; }
}

public class ItemEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? SpriteUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Cost { get; set; }
    public string? ShortEffect { get; set; }
}

/// <summary>Metadatos del seeding: evita re-descargar PokéAPI si el catálogo ya está listo.</summary>
public class CatalogMetaEntity
{
    public int Id { get; set; } = 1;
    public bool SeedCompleted { get; set; }
    public DateTimeOffset? SeedCompletedAt { get; set; }
    public int PokemonCount { get; set; }
    public int AbilityCount { get; set; }
    public int MoveCount { get; set; }
    public int ItemCount { get; set; }
    public string? LastError { get; set; }
}
