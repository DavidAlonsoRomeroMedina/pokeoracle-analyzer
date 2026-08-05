using Microsoft.AspNetCore.Mvc;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;

namespace PokeOracle.WebApi.Controllers;

/// <summary>
/// Catálogos que consume el cliente web. Tras el seeding, todo sale de SQLite.
/// </summary>
[ApiController]
[Route("api/catalog")]
[Produces("application/json")]
public class CatalogController : ControllerBase
{
    private readonly IPokemonExternalService _catalog;
    private readonly ILocalDataCatalog _localCatalog;
    private readonly ICatalogSeedStatus _seedStatus;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(
        IPokemonExternalService catalog,
        ILocalDataCatalog localCatalog,
        ICatalogSeedStatus seedStatus,
        ILogger<CatalogController> logger)
    {
        _catalog = catalog;
        _localCatalog = localCatalog;
        _seedStatus = seedStatus;
        _logger = logger;
    }

    /// <summary>Estado del seeding del catálogo (útil en el primer arranque en la nube).</summary>
    [HttpGet("status")]
    public IActionResult GetStatus() => Ok(new
    {
        ready = _seedStatus.IsReady,
        running = _seedStatus.IsRunning,
        failed = _seedStatus.HasFailed,
        message = _seedStatus.Message,
        pokemonLoaded = _seedStatus.PokemonLoaded,
        pokemonTarget = _seedStatus.PokemonTarget,
        progressPercent = Math.Round(_seedStatus.ProgressPercent, 1)
    });

    [HttpGet("pokemon")]
    [ProducesResponseType(typeof(IReadOnlyList<PokemonCatalogEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPokemon(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady)
        {
            return CatalogNotReady();
        }

        try
        {
            return Ok(await _catalog.GetPokemonWithStatsAsync(cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leyendo Pokémon desde SQLite; se usa respaldo local.");
            return Ok(_localCatalog.GetPokemon());
        }
    }

    [HttpGet("moves")]
    [ProducesResponseType(typeof(IReadOnlyList<MoveCatalogEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMoves(CancellationToken cancellationToken)
    {
        if (_seedStatus.IsReady)
        {
            try
            {
                return Ok(await _catalog.GetMovesAsync(cancellationToken));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudieron leer movimientos de SQLite; respaldo local.");
            }
        }

        return Ok(_localCatalog.GetMoves());
    }

    [HttpGet("abilities")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetAbilities(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();

        var abilities = await _catalog.GetAbilitiesAsync(cancellationToken);
        return Ok(abilities.Select(a => a.DisplayName).ToList());
    }

    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        if (!_seedStatus.IsReady) return CatalogNotReady();

        var items = await _catalog.GetItemsAsync(cancellationToken);
        return Ok(items.Select(i => i.DisplayName).ToList());
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
