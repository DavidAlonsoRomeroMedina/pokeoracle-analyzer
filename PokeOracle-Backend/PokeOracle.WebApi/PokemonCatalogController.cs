using Microsoft.AspNetCore.Mvc;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;
using PokeOracle.Infrastructure.PokeApi;

namespace PokeOracle.WebApi.Controllers;

/// <summary>
/// Catálogo visual de Generación 1 alimentado desde PokéAPI: sprites, habilidades
/// y objetos de Kanto listos para pintar en el cliente.
/// </summary>
/// <remarks>
/// La primera llamada descarga el catálogo desde PokéAPI y puede tardar unos
/// segundos; a partir de ahí se sirve desde memoria.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PokemonCatalogController : ControllerBase
{
    private readonly IPokemonExternalService _catalog;
    private readonly ILogger<PokemonCatalogController> _logger;

    public PokemonCatalogController(IPokemonExternalService catalog, ILogger<PokemonCatalogController> logger)
    {
        _catalog = catalog;
        _logger = logger;
    }

    /// <summary>Los 151 Pokémon de Kanto con sprite e ilustración oficial.</summary>
    [HttpGet("pokemon")]
    [ProducesResponseType(typeof(IReadOnlyList<PokemonSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPokemon(CancellationToken cancellationToken)
    {
        try
        {
            var pokemon = await _catalog.GetGenerationOnePokemonAsync(cancellationToken);
            return Ok(pokemon);
        }
        catch (HttpRequestException ex)
        {
            return PokeApiUnavailable(ex);
        }
    }

    /// <summary>
    /// Ficha completa de un Pokémon de Kanto, con sprites, habilidades y estadísticas base.
    /// </summary>
    /// <param name="pokedexNumber">Número de Pokédex, del 1 al 151.</param>
    [HttpGet("pokemon/{pokedexNumber:int}")]
    [ProducesResponseType(typeof(PokemonDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPokemonDetail(int pokedexNumber, CancellationToken cancellationToken)
    {
        if (!PokeApiHttpClient.IsGenerationOne(pokedexNumber))
        {
            return BadRequest(
                $"PokeOracle solo cubre la Generación 1: el número de Pokédex debe estar entre 1 y {PokeApiOptions.FirstGenerationPokemonCount}.");
        }

        try
        {
            var pokemon = await _catalog.GetPokemonAsync(pokedexNumber, cancellationToken);

            return pokemon is null
                ? NotFound($"No se encontró el Pokémon número {pokedexNumber}.")
                : Ok(pokemon);
        }
        catch (HttpRequestException ex)
        {
            return PokeApiUnavailable(ex);
        }
    }

    /// <summary>Habilidades que PokéAPI asigna a los 151 Pokémon de Kanto, sin duplicados.</summary>
    [HttpGet("abilities")]
    [ProducesResponseType(typeof(IReadOnlyList<AbilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetAbilities(CancellationToken cancellationToken)
    {
        try
        {
            var abilities = await _catalog.GetGenerationOneAbilitiesAsync(cancellationToken);
            return Ok(abilities);
        }
        catch (HttpRequestException ex)
        {
            return PokeApiUnavailable(ex);
        }
    }

    /// <summary>
    /// Objetos introducidos en la Generación 1, con su sprite.
    /// </summary>
    /// <remarks>
    /// PokéAPI no expone objetos por generación, así que la primera llamada inspecciona
    /// el catálogo de objetos para aislar los de Kanto y tarda notablemente más que el resto.
    /// </remarks>
    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<GameItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        try
        {
            var items = await _catalog.GetGenerationOneItemsAsync(cancellationToken);
            return Ok(items);
        }
        catch (HttpRequestException ex)
        {
            return PokeApiUnavailable(ex);
        }
    }

    private IActionResult PokeApiUnavailable(HttpRequestException exception)
    {
        _logger.LogError(exception, "No se pudo contactar con PokéAPI.");

        return StatusCode(
            StatusCodes.Status503ServiceUnavailable,
            "No se pudo contactar con PokéAPI. Revisa tu conexión e inténtalo de nuevo.");
    }
}
