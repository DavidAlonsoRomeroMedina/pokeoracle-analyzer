using Microsoft.AspNetCore.Mvc;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;

namespace PokeOracle.WebApi.Controllers;

/// <summary>
/// Catálogos que consume el cliente web para construir equipos.
/// </summary>
/// <remarks>
/// Los Pokémon salen de PokéAPI para que lleguen con sprites y estadísticas base
/// reales. Si PokéAPI no responde se sirve la copia local, que deja la aplicación
/// utilizable aunque sin imágenes.
/// </remarks>
[ApiController]
[Route("api/catalog")]
[Produces("application/json")]
public class CatalogController : ControllerBase
{
    private readonly IPokemonExternalService _pokeApi;
    private readonly ILocalDataCatalog _localCatalog;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(
        IPokemonExternalService pokeApi,
        ILocalDataCatalog localCatalog,
        ILogger<CatalogController> logger)
    {
        _pokeApi = pokeApi;
        _localCatalog = localCatalog;
        _logger = logger;
    }

    /// <summary>Los 151 Pokémon de Kanto con estadísticas base y sprites.</summary>
    [HttpGet("pokemon")]
    [ProducesResponseType(typeof(IReadOnlyList<PokemonCatalogEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPokemon(CancellationToken cancellationToken)
    {
        try
        {
            var pokemon = await _pokeApi.GetGenerationOnePokemonWithStatsAsync(cancellationToken);
            return Ok(pokemon);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "PokéAPI no respondió; se sirve el catálogo local sin sprites.");
            return Ok(_localCatalog.GetPokemon());
        }
    }

    /// <summary>Movimientos disponibles, con sus valores de combate en español.</summary>
    [HttpGet("moves")]
    [ProducesResponseType(typeof(IReadOnlyList<MoveCatalogEntryDto>), StatusCodes.Status200OK)]
    public IActionResult GetMoves() => Ok(_localCatalog.GetMoves());

    /// <summary>Nombres de las habilidades de los Pokémon de Kanto.</summary>
    [HttpGet("abilities")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAbilities(CancellationToken cancellationToken)
    {
        try
        {
            var abilities = await _pokeApi.GetGenerationOneAbilitiesAsync(cancellationToken);
            return Ok(abilities.Select(a => a.DisplayName).ToList());
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "PokéAPI no respondió al pedir habilidades.");
            return Ok(Array.Empty<string>());
        }
    }

    /// <summary>Nombres de los objetos introducidos en la Generación 1.</summary>
    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        try
        {
            var items = await _pokeApi.GetGenerationOneItemsAsync(cancellationToken);
            return Ok(items.Select(i => i.DisplayName).ToList());
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "PokéAPI no respondió al pedir objetos.");
            return Ok(Array.Empty<string>());
        }
    }
}
