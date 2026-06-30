using PokeOracle.Domain.Common;

namespace PokeOracle.Application.DTOs;

public class TurnStateDto
{
    public int PlayerActiveIndex { get; set; }
    public int RivalActiveIndex { get; set; }
    public int PlayerMoveIndex { get; set; }
    public int PlayerSwitchToIndex { get; set; }
    public int RivalMoveIndex { get; set; }
    public int RivalSwitchToIndex { get; set; }
    public bool IsPlayerCritical { get; set; }
    public bool IsRivalCritical { get; set; }
    public bool IsPlayerMissed { get; set; }
    public bool IsRivalMissed { get; set; }
    public StatusEffect PlayerStatusApplied { get; set; } = StatusEffect.None;
    public StatusEffect RivalStatusApplied { get; set; } = StatusEffect.None;

    // Sincronización Real de Consola
    public bool PlayerSurvived { get; set; } = true;
    public int? PlayerRealHP { get; set; }
    public bool RivalSurvived { get; set; } = true;
    public int? RivalRealHP { get; set; }
}