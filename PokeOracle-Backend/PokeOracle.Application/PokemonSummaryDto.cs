namespace PokeOracle.Application.DTOs;

/// <summary>
/// Entrada de catálogo pensada para pintar una rejilla de Pokémon en el cliente.
/// </summary>
public class PokemonSummaryDto
{
    public int PokedexNumber { get; set; }

    /// <summary>Identificador de PokéAPI en minúsculas, por ejemplo "bulbasaur".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Nombre listo para mostrar, por ejemplo "Bulbasaur".</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Sprite frontal por defecto (<c>sprites.front_default</c>).</summary>
    public string? SpriteUrl { get; set; }

    /// <summary>Ilustración oficial en alta resolución, útil para vistas de detalle.</summary>
    public string? ArtworkUrl { get; set; }

    public List<string> Types { get; set; } = new();
}
