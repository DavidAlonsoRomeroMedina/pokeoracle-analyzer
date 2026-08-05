using PokeOracle.Application.DTOs;

namespace PokeOracle.Application.Interfaces;

/// <summary>
/// Catálogo de Pokémon servido desde la base local (SQLite).
/// Tras el seeding inicial ya no se consulta PokéAPI en tiempo de petición.
/// </summary>
public interface IPokemonExternalService
{
    Task<IReadOnlyList<PokemonSummaryDto>> GetAllPokemonAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PokemonCatalogEntryDto>> GetPokemonWithStatsAsync(CancellationToken cancellationToken = default);

    Task<PokemonDetailDto?> GetPokemonAsync(int pokedexNumber, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AbilityDto>> GetAbilitiesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GameItemDto>> GetItemsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MoveCatalogEntryDto>> GetMovesAsync(CancellationToken cancellationToken = default);
}
