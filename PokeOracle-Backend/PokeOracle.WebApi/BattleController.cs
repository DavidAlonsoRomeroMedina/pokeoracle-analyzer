using Microsoft.AspNetCore.Mvc;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Domain.Entities;

namespace PokeOracle.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BattleController : ControllerBase
{
    private readonly IBattleRepository _repository;
    private readonly ExpectiminimaxService _aiService;

    public BattleController(IBattleRepository repository, ExpectiminimaxService aiService)
    {
        _repository = repository;
        _aiService = aiService;
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup([FromBody] BattleSetupDto dto)
    {
        if (dto == null || !dto.PlayerParty.Any() || !dto.RivalParty.Any())
        {
            return BadRequest("Los equipos son requeridos.");
        }

        var sessionId = Guid.NewGuid().ToString();
        var state = new BattleState
        {
            SessionId = sessionId,
            PlayerParty = dto.PlayerParty,
            RivalParty = dto.RivalParty,
            PlayerActiveIndex = 0,
            RivalActiveIndex = 0,
            TurnNumber = 1,
            IsSwitchRequired = false,
            History = new List<string> { "Inicio del combate registrado con estadísticas reales." }
        };

        await _repository.SaveAsync(state);
        return Ok(new { SessionId = sessionId });
    }

    [HttpGet("{sessionId}/predict-lead")]
    public async Task<IActionResult> PredictLead(string sessionId)
    {
        var state = await _repository.GetAsync(sessionId);
        if (state == null) return NotFound("Sesión de batalla no encontrada.");

        var bestLead = _aiService.PredictBestLead(state);
        return Ok(new { BestLead = bestLead });
    }

    [HttpPost("{sessionId}/switch")]
    public async Task<IActionResult> Switch(string sessionId, [FromQuery] int switchToIndex, [FromQuery] bool isRival)
    {
        var state = await _repository.GetAsync(sessionId);
        if (state == null) return NotFound();

        if (isRival)
        {
            state.RivalActiveIndex = switchToIndex;
            state.History.Add($"[Reemplazo Rival] El rival ingresa a {state.RivalParty[switchToIndex].Name}.");
        }
        else
        {
            state.PlayerActiveIndex = switchToIndex;
            state.History.Add($"[Reemplazo Jugador] Ingresas a {state.PlayerParty[switchToIndex].Name}.");
        }

        // Si ambos están sanos, apagar bandera
        if (state.ActivePlayerPokemon.HP > 0 && state.ActiveRivalPokemon.HP > 0)
        {
            state.IsSwitchRequired = false;
        }

        await _repository.SaveAsync(state);
        var nextRecommendation = _aiService.ComputeNextMove(state);
        return Ok(new { recommendation = nextRecommendation, sessionState = state, isSwitchRequired = state.IsSwitchRequired });
    }

    [HttpPost("{sessionId}/turn")]
    public async Task<IActionResult> Turn(string sessionId, [FromBody] TurnStateDto dto)
    {
        var state = await _repository.GetAsync(sessionId);
        if (state == null) return NotFound();

        if (state.IsSwitchRequired && (dto.PlayerMoveIndex >= 0 || dto.RivalMoveIndex >= 0))
        {
            return BadRequest("Se requiere un cambio de Pokémon debilitado antes de atacar.");
        }

        state.PlayerActiveIndex = dto.PlayerActiveIndex;
        state.RivalActiveIndex = dto.RivalActiveIndex;

        // Simulación de daño y orden de velocidad del turno real
        var player = state.ActivePlayerPokemon;
        var rival = state.ActiveRivalPokemon;

        // Procesa switches primero
        if (dto.PlayerSwitchToIndex >= 0)
        {
            state.PlayerActiveIndex = dto.PlayerSwitchToIndex;
            state.History.Add($"[Turno {state.TurnNumber}] Cambiaste a {state.PlayerParty[dto.PlayerSwitchToIndex].Name}.");
        }
        if (dto.RivalSwitchToIndex >= 0)
        {
            state.RivalActiveIndex = dto.RivalSwitchToIndex;
            state.History.Add($"[Turno {state.TurnNumber}] El rival cambió a {state.RivalParty[dto.RivalSwitchToIndex].Name}.");
        }

        // Sincronización Real de HP (Consola)
        if (!dto.PlayerSurvived)
        {
            player.HP = 0;
            state.History.Add($"[Turno {state.TurnNumber}] [Sincronización] Tu {player.Name} se debilitó.");
        }
        else if (dto.PlayerRealHP.HasValue && dto.PlayerRealHP.Value > 0)
        {
            player.HP = Math.Min(player.MaxHP, dto.PlayerRealHP.Value);
            state.History.Add($"[Turno {state.TurnNumber}] [Sincronización] HP de {player.Name} ajustado a {player.HP} HP reales.");
        }

        if (!dto.RivalSurvived)
        {
            rival.HP = 0;
            state.History.Add($"[Turno {state.TurnNumber}] [Sincronización] El {rival.Name} rival se debilitó.");
        }
        else if (dto.RivalRealHP.HasValue && dto.RivalRealHP.Value > 0)
        {
            rival.HP = Math.Min(rival.MaxHP, dto.RivalRealHP.Value);
            state.History.Add($"[Turno {state.TurnNumber}] [Sincronización] HP del {rival.Name} rival ajustado a {rival.HP} HP reales.");
        }

        // Incremento de turno
        state.TurnNumber++;

        // Chequear debilitamientos
        if (player.HP <= 0 || rival.HP <= 0)
        {
            state.IsSwitchRequired = true;
        }

        await _repository.SaveAsync(state);
        var aiRecommendation = _aiService.ComputeNextMove(state);
        return Ok(new { recommendation = aiRecommendation, sessionState = state, isSwitchRequired = state.IsSwitchRequired });
    }
}