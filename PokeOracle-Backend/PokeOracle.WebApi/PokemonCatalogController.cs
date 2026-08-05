using Microsoft.AspNetCore.Mvc;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;

namespace PokeOracle.WebApi.Controllers;

/// <summary>
/// Catálogo enriquecido (sprites, habilidades, objetos) servido desde SQLite.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PokemonCatalogController : ControllerBase
{
    private readonly IPokemonExternalService _catalog;
    private readonly ICatalogSeedStatus _seedStatus;
    private readonly ILogger<PokemonCatalogController> _logger;

    public PokemonCatalogController(
        IPokemonExternalService catalog,
        ICatalogSeedStatus seedStatus,
        ILogger<PokemonCatalogController> logger)
    {
        _catalog = catalog;
        _seedStatus = seedStatus;
        _logger = logger;
    }

    [HttpGet("pokemon")]
    [ProducesResponseType(typeof(IReadOnlyList<PokemonSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPokemon(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();

        try
        {
            return Ok(await _catalog.GetAllPokemonAsync(cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leyendo el catálogo SQLite.");
            return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
        }
    }

    [HttpGet("pokemon/{pokedexNumber:int}")]
    [ProducesResponseType(typeof(PokemonDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPokemonDetail(int pokedexNumber, CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();

        var pokemon = await _catalog.GetPokemonAsync(pokedexNumber, cancellationToken);
        return pokemon is null
            ? NotFound($"No se encontró el Pokémon número {pokedexNumber}.")
            : Ok(pokemon);
    }

    [HttpGet("abilities")]
    [ProducesResponseType(typeof(IReadOnlyList<AbilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetAbilities(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();
        return Ok(await _catalog.GetAbilitiesAsync(cancellationToken));
    }

    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<GameItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();
        return Ok(await _catalog.GetItemsAsync(cancellationToken));
    }

    private ObjectResult CatalogNotReady() => StatusCode(
        StatusCodes.Status503ServiceUnavailable,
        new
        {
            ready = false,
            running = _seedStatus.IsRunning,
            failed = _seedStatus.HasFailed,
            message = _seedStatus.Message,
            progressPercent = Math.Round(_seedStatus.ProgressPercent, 1)
        });
}
