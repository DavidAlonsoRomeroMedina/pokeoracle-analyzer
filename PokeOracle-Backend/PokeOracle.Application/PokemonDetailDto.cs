namespace PokeOracle.Application.DTOs;

/// <summary>
/// Ficha completa de un Pokémon de Kanto, con todos los sprites disponibles y
/// las estadísticas base reales tomadas de PokéAPI.
/// </summary>
public class PokemonDetailDto
{
    public int PokedexNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    public string? SpriteUrl { get; set; }
    public string? ShinySpriteUrl { get; set; }
    public string? BackSpriteUrl { get; set; }
    public string? ArtworkUrl { get; set; }

    public List<string> Types { get; set; } = new();
    public List<PokemonAbilityDto> Abilities { get; set; } = new();
    public PokemonBaseStatsDto BaseStats { get; set; } = new();

    /// <summary>Altura en decímetros, tal como la publica PokéAPI.</summary>
    public int Height { get; set; }

    /// <summary>Peso en hectogramos, tal como lo publica PokéAPI.</summary>
    public int Weight { get; set; }
}

public class PokemonAbilityDto
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
    public int Slot { get; set; }
}

public class PokemonBaseStatsDto
{
    public int Hp { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpecialAttack { get; set; }
    public int SpecialDefense { get; set; }
    public int Speed { get; set; }
}
