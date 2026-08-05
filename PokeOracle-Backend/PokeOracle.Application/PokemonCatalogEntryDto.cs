namespace PokeOracle.Application.DTOs;

/// <summary>
/// Entrada del catálogo que consume el cliente web para rellenar equipos.
/// </summary>
/// <remarks>
/// Mantiene los mismos nombres de campo que el catálogo que la interfaz ya
/// consumía, y añade el número de Pokédex y las imágenes para poder mostrar
/// los sprites.
/// </remarks>
public class PokemonCatalogEntryDto
{
    public int PokedexNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> Types { get; set; } = new();

    public int Hp { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }

    public string? SpriteUrl { get; set; }
    public string? ArtworkUrl { get; set; }
}
