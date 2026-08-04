<<<<<<< HEAD
namespace PokeOracle.Domain.Entities;

public class BattleState
{
    public string SessionId { get; set; } = string.Empty;
    public List<Pokemon> PlayerParty { get; set; } = new();
    public List<Pokemon> RivalParty { get; set; } = new();
    public int PlayerActiveIndex { get; set; } = 0;
    public int RivalActiveIndex { get; set; } = 0;
    public int TurnNumber { get; set; } = 1;
    public List<string> History { get; set; } = new();

    // Bandera de reemplazo obligatorio por debilitamiento
    public bool IsSwitchRequired { get; set; } = false;

    public Pokemon ActivePlayerPokemon => PlayerParty[PlayerActiveIndex];
    public Pokemon ActiveRivalPokemon => RivalParty[RivalActiveIndex];
=======
namespace PokeOracle.Domain.Entities;

public class BattleState
{
    public string SessionId { get; set; } = string.Empty;
    public List<Pokemon> PlayerParty { get; set; } = new();
    public List<Pokemon> RivalParty { get; set; } = new();
    public int PlayerActiveIndex { get; set; } = 0;
    public int RivalActiveIndex { get; set; } = 0;
    public int TurnNumber { get; set; } = 1;
    public List<string> History { get; set; } = new();

    // Bandera de reemplazo obligatorio por debilitamiento
    public bool IsSwitchRequired { get; set; } = false;

    public Pokemon ActivePlayerPokemon => PlayerParty[PlayerActiveIndex];
    public Pokemon ActiveRivalPokemon => RivalParty[RivalActiveIndex];
>>>>>>> 063c35bd5ca941119c2db745bf84c16baf9ff108
}