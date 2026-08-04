using PokeOracle.Application.DTOs;

namespace PokeOracle.Application.Interfaces;

/// <summary>
/// Catálogo servido desde los archivos de datos del proyecto.
/// </summary>
/// <remarks>
/// Cubre dos necesidades. Los movimientos no existen en PokéAPI con los valores
/// y las traducciones que usa el simulador, así que su única fuente es local.
/// Los Pokémon sí vienen de PokéAPI, pero se mantiene una copia local como
/// respaldo para que la aplicación siga siendo usable sin conexión, aunque en
/// ese caso se quede sin sprites.
/// </remarks>
public interface ILocalDataCatalog
{
    IReadOnlyList<MoveCatalogEntryDto> GetMoves();

    /// <summary>Pokémon de Kanto sin imágenes, para usar cuando PokéAPI no responde.</summary>
    IReadOnlyList<PokemonCatalogEntryDto> GetPokemon();
}
