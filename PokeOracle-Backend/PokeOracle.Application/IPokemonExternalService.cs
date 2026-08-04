using PokeOracle.Application.DTOs;

namespace PokeOracle.Application.Interfaces;

/// <summary>
/// Acceso al catálogo externo de Pokémon (PokéAPI), restringido a Generación 1.
/// Las implementaciones deben garantizar que nunca se devuelvan datos de
/// generaciones posteriores, ya que PokeOracle simula combates de Kanto.
/// </summary>
public interface IPokemonExternalService
{
    /// <summary>Los 151 Pokémon de Kanto con su sprite frontal para mostrar en el cliente.</summary>
    Task<IReadOnlyList<PokemonSummaryDto>> GetGenerationOnePokemonAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ficha completa de un Pokémon de Kanto. Devuelve <c>null</c> si el número
    /// de Pokédex está fuera del rango 1-151.
    /// </summary>
    Task<PokemonDetailDto?> GetPokemonAsync(int pokedexNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Habilidades que PokéAPI asigna a los 151 Pokémon de Kanto, sin duplicados.
    /// </summary>
    Task<IReadOnlyList<AbilityDto>> GetGenerationOneAbilitiesAsync(CancellationToken cancellationToken = default);

    /// <summary>Objetos introducidos en la Generación 1.</summary>
    Task<IReadOnlyList<GameItemDto>> GetGenerationOneItemsAsync(CancellationToken cancellationToken = default);
}
