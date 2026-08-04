namespace PokeOracle.Application.DTOs;

/// <summary>
/// Objeto introducido en la Generación 1, con su sprite para el cliente.
/// </summary>
public class GameItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Nombre en español cuando PokéAPI lo publica; si no, el nombre en inglés.</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Sprite del objeto (<c>sprites.default</c>).</summary>
    public string? SpriteUrl { get; set; }

    /// <summary>Categoría de PokéAPI, por ejemplo "standard-balls" o "healing".</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Precio en tienda. PokéAPI lo omite en algunos objetos.</summary>
    public int? Cost { get; set; }

    /// <summary>
    /// Descripción corta del efecto. PokéAPI solo publica este texto en inglés,
    /// por lo que no se traduce.
    /// </summary>
    public string? ShortEffect { get; set; }
}
