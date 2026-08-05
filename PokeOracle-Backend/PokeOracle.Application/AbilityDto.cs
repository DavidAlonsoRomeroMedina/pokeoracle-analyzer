namespace PokeOracle.Application.DTOs;

/// <summary>
/// Habilidad asignada a uno o varios de los 151 Pokémon de Kanto.
/// </summary>
/// <remarks>
/// Las habilidades son una mecánica introducida en la Generación 3, así que el
/// recurso <c>/generation/1</c> de PokéAPI devuelve una lista vacía. Estas son
/// las habilidades que PokéAPI asigna hoy a los Pokémon de Kanto.
/// </remarks>
public class AbilityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Nombre en español cuando PokéAPI lo publica; si no, el nombre en inglés.</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Descripción corta del efecto. PokéAPI solo publica este texto en inglés,
    /// por lo que no se traduce.
    /// </summary>
    public string? ShortEffect { get; set; }

    /// <summary>Pokémon de Kanto que tienen esta habilidad.</summary>
    public List<string> PokemonNames { get; set; } = new();
}
