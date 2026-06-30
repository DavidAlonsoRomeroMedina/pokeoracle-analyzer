export interface CSharpFile {
  path: string;
  project: string;
  content: string;
}

export const csharpCodebase: CSharpFile[] = [
  {
    project: "PokeOracle.Domain",
    path: "Common/PokemonType.cs",
    content: `namespace PokeOracle.Domain.Common;

public enum PokemonType
{
    Normal,
    Fire,
    Water,
    Grass,
    Electric,
    Ice,
    Fighting,
    Poison,
    Ground,
    Flying,
    Psychic,
    Bug,
    Rock,
    Ghost,
    Dragon,
    Dark,
    Steel,
    Fairy
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Common/StatusEffect.cs",
    content: `namespace PokeOracle.Domain.Common;

public enum StatusEffect
{
    None,
    Paralysis,
    Poison,
    Burn,
    Sleep,
    Freeze
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Common/MoveCategory.cs",
    content: `namespace PokeOracle.Domain.Common;

public enum MoveCategory
{
    Physical,
    Special,
    Status
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Entities/Move.cs",
    content: `using PokeOracle.Domain.Common;

namespace PokeOracle.Domain.Entities;

public class Move
{
    public string Name { get; set; } = string.Empty;
    public PokemonType Type { get; set; }
    public MoveCategory Category { get; set; }
    public int Power { get; set; }
    public int Accuracy { get; set; }
    public int StatusChance { get; set; }
    public StatusEffect StatusEffect { get; set; }
    public bool IsFixedDamage { get; set; }
    public int FixedDamageValue { get; set; }
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Entities/Pokemon.cs",
    content: `using PokeOracle.Domain.Common;

namespace PokeOracle.Domain.Entities;

public class Pokemon
{
    public string Name { get; set; } = string.Empty;
    public List<PokemonType> Types { get; set; } = new();
    public int HP { get; set; }
    public int MaxHP { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }
    public StatusEffect Status { get; set; } = StatusEffect.None;
    public List<Move> Moves { get; set; } = new();
    
    // Habilidad y Objeto Equipado (Gen 3)
    public string Ability { get; set; } = string.Empty;
    public string HeldItem { get; set; } = string.Empty;

    public bool IsFainted => HP <= 0;
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Entities/BattleState.cs",
    content: `namespace PokeOracle.Domain.Entities;

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
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Strategies/IDamageCalculationStrategy.cs",
    content: `using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public interface IDamageCalculationStrategy
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Strategies/StandardDamageStrategy.cs",
    content: `using PokeOracle.Domain.Common;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public class StandardDamageStrategy : IDamageCalculationStrategy
{
    public int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll)
    {
        if (move.Power <= 0 || move.IsFixedDamage) return 0;

        const int level = 50;
        double atk = move.Category == MoveCategory.Physical ? attacker.Attack : attacker.SpAttack;
        double def = move.Category == MoveCategory.Physical ? defender.Defense : defender.SpDefense;

        double baseDamage = (((2.0 * level / 5.0) + 2.0) * move.Power * (atk / def) / 50.0) + 2.0;
        double stab = attacker.Types.Contains(move.Type) ? 1.5 : 1.0;
        double effectiveness = GetEffectiveness(move.Type, defender.Types);
        double critMultiplier = isCritical ? 2.0 : 1.0;

        // Modificadores por objetos (Carbón, Imán, etc.)
        double itemMultiplier = 1.0;
        if (!string.IsNullOrEmpty(attacker.HeldItem))
        {
            var item = attacker.HeldItem.ToLower();
            if (item == "carbón" && move.Type == PokemonType.Fire) itemMultiplier = 1.1;
            if (item == "lente de agua" && move.Type == PokemonType.Water) itemMultiplier = 1.1;
            if (item == "semilla milagro" && move.Type == PokemonType.Grass) itemMultiplier = 1.1;
            if (item == "imán" && move.Type == PokemonType.Electric) itemMultiplier = 1.1;
        }

        double finalDamage = baseDamage * critMultiplier * stab * effectiveness * randomRoll * itemMultiplier;

        return (int)Math.Max(1, Math.Floor(finalDamage));
    }

    public static double GetEffectiveness(PokemonType attackType, List<PokemonType> defenderTypes)
    {
        double multiplier = 1.0;
        foreach (var defType in defenderTypes)
        {
            multiplier *= GetSingleTypeEffectiveness(attackType, defType);
        }
        return multiplier;
    }

    private static double GetSingleTypeEffectiveness(PokemonType atk, PokemonType def)
    {
        if (atk == PokemonType.Normal)
        {
            if (def == PokemonType.Rock || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Ghost) return 0.0;
        }
        if (atk == PokemonType.Fire)
        {
            if (def == PokemonType.Fire || def == PokemonType.Water || def == PokemonType.Rock || def == PokemonType.Dragon) return 0.5;
            if (def == PokemonType.Grass || def == PokemonType.Ice || def == PokemonType.Bug || def == PokemonType.Steel) return 2.0;
        }
        if (atk == PokemonType.Water)
        {
            if (def == PokemonType.Water || def == PokemonType.Grass || def == PokemonType.Dragon) return 0.5;
            if (def == PokemonType.Fire || def == PokemonType.Ground || def == PokemonType.Rock) return 2.0;
        }
        if (atk == PokemonType.Grass)
        {
            if (def == PokemonType.Fire || def == PokemonType.Grass || def == PokemonType.Poison || def == PokemonType.Flying || def == PokemonType.Bug || def == PokemonType.Dragon || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Water || def == PokemonType.Ground || def == PokemonType.Rock) return 2.0;
        }
        if (atk == PokemonType.Electric)
        {
            if (def == PokemonType.Grass || def == PokemonType.Electric || def == PokemonType.Dragon) return 0.5;
            if (def == PokemonType.Water || def == PokemonType.Flying) return 2.0;
            if (def == PokemonType.Ground) return 0.0;
        }
        if (atk == PokemonType.Ice)
        {
            if (def == PokemonType.Fire || def == PokemonType.Water || def == PokemonType.Ice || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Grass || def == PokemonType.Ground || def == PokemonType.Flying || def == PokemonType.Dragon) return 2.0;
        }
        if (atk == PokemonType.Fighting)
        {
            if (def == PokemonType.Poison || def == PokemonType.Flying || def == PokemonType.Psychic || def == PokemonType.Bug || def == PokemonType.Fairy) return 0.5;
            if (def == PokemonType.Normal || def == PokemonType.Ice || def == PokemonType.Rock || def == PokemonType.Dark || def == PokemonType.Steel) return 2.0;
            if (def == PokemonType.Ghost) return 0.0;
        }
        if (atk == PokemonType.Poison)
        {
            if (def == PokemonType.Poison || def == PokemonType.Ground || def == PokemonType.Rock || def == PokemonType.Ghost) return 0.5;
            if (def == PokemonType.Grass || def == PokemonType.Fairy) return 2.0;
            if (def == PokemonType.Steel) return 0.0;
        }
        if (atk == PokemonType.Ground)
        {
            if (def == PokemonType.Grass || def == PokemonType.Bug) return 0.5;
            if (def == PokemonType.Fire || def == PokemonType.Electric || def == PokemonType.Poison || def == PokemonType.Rock || def == PokemonType.Steel) return 2.0;
            if (def == PokemonType.Flying) return 0.0;
        }
        if (atk == PokemonType.Flying)
        {
            if (def == PokemonType.Electric || def == PokemonType.Rock || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Grass || def == PokemonType.Fighting || def == PokemonType.Bug) return 2.0;
        }
        if (atk == PokemonType.Psychic)
        {
            if (def == PokemonType.Psychic || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Fighting || def == PokemonType.Poison) return 2.0;
            if (def == PokemonType.Dark) return 0.0;
        }
        if (atk == PokemonType.Bug)
        {
            if (def == PokemonType.Fire || def == PokemonType.Fighting || def == PokemonType.Poison || def == PokemonType.Flying || def == PokemonType.Ghost || def == PokemonType.Steel || def == PokemonType.Fairy) return 0.5;
            if (def == PokemonType.Grass || def == PokemonType.Psychic || def == PokemonType.Dark) return 2.0;
        }
        if (atk == PokemonType.Rock)
        {
            if (def == PokemonType.Fighting || def == PokemonType.Ground || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Fire || def == PokemonType.Ice || def == PokemonType.Flying || def == PokemonType.Bug) return 2.0;
        }
        if (atk == PokemonType.Ghost)
        {
            if (def == PokemonType.Dark) return 0.5;
            if (def == PokemonType.Ghost || def == PokemonType.Psychic) return 2.0;
            if (def == PokemonType.Normal) return 0.0;
        }
        if (atk == PokemonType.Dragon)
        {
            if (def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Dragon) return 2.0;
            if (def == PokemonType.Fairy) return 0.0;
        }
        if (atk == PokemonType.Dark)
        {
            if (def == PokemonType.Fighting || def == PokemonType.Dark || def == PokemonType.Fairy) return 0.5;
            if (def == PokemonType.Psychic || def == PokemonType.Ghost) return 2.0;
        }
        if (atk == PokemonType.Steel)
        {
            if (def == PokemonType.Fire || def == PokemonType.Water || def == PokemonType.Electric || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Ice || def == PokemonType.Rock || def == PokemonType.Fairy) return 2.0;
        }
        if (atk == PokemonType.Fairy)
        {
            if (def == PokemonType.Fire || def == PokemonType.Poison || def == PokemonType.Steel) return 0.5;
            if (def == PokemonType.Fighting || def == PokemonType.Dragon || def == PokemonType.Dark) return 2.0;
        }
        return 1.0;
    }
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Strategies/FixedDamageStrategy.cs",
    content: `using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public class FixedDamageStrategy : IDamageCalculationStrategy
{
    public int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll)
    {
        if (move.IsFixedDamage)
        {
            return move.FixedDamageValue;
        }
        return 0;
    }
}`
  },
  {
    project: "PokeOracle.Domain",
    path: "Strategies/StatusDamageStrategy.cs",
    content: `using PokeOracle.Domain.Common;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public class StatusDamageStrategy : IDamageCalculationStrategy
{
    public int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll)
    {
        int dmg = 0;
        if (defender.Status == StatusEffect.Poison)
        {
            dmg = defender.MaxHP / 8;
        }
        else if (defender.Status == StatusEffect.Burn)
        {
            dmg = defender.MaxHP / 16;
        }
        return Math.Max(1, dmg);
    }
}`
  },
  {
    project: "PokeOracle.Application",
    path: "DTOs/BattleSetupDto.cs",
    content: `using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.DTOs;

public class BattleSetupDto
{
    public List<Pokemon> PlayerParty { get; set; } = new();
    public List<Pokemon> RivalParty { get; set; } = new();
}`
  },
  {
    project: "PokeOracle.Application",
    path: "DTOs/TurnStateDto.cs",
    content: `using PokeOracle.Domain.Common;

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
}`
  },
  {
    project: "PokeOracle.Application",
    path: "DTOs/TurnResultDto.cs",
    content: `namespace PokeOracle.Application.DTOs;

public class TurnResultDto
{
    public string RecommendedAction { get; set; } = string.Empty; // "Move" o "Switch"
    public int? MoveIndex { get; set; }
    public string? MoveName { get; set; }
    public int? SwitchIndex { get; set; }
    public string? SwitchPokemonName { get; set; }
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> SimulatedPaths { get; set; } = new();
}`
  },
  {
    project: "PokeOracle.Application",
    path: "Interfaces/IBattleRepository.cs",
    content: `using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IBattleRepository
{
    Task<BattleState?> GetAsync(string sessionId);
    Task SaveAsync(BattleState state);
    Task DeleteAsync(string sessionId);
}`
  },
  {
    project: "PokeOracle.Application",
    path: "Interfaces/IDamageCalculator.cs",
    content: `using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IDamageCalculator
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
    int CalculateResidualStatusDamage(Pokemon pokemon);
}`
  },
  {
    project: "PokeOracle.Application",
    path: "Services/DamageCalculator.cs",
    content: `using PokeOracle.Application.Interfaces;
using PokeOracle.Domain.Entities;
using PokeOracle.Domain.Strategies;

namespace PokeOracle.Application.Services;

public class DamageCalculator : IDamageCalculator
{
    private readonly StandardDamageStrategy _standardStrategy = new();
    private readonly FixedDamageStrategy _fixedStrategy = new();
    private readonly StatusDamageStrategy _statusStrategy = new();

    public int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll)
    {
        if (move.IsFixedDamage)
        {
            return _fixedStrategy.CalculateDamage(attacker, defender, move, isCritical, randomRoll);
        }
        return _standardStrategy.CalculateDamage(attacker, defender, move, isCritical, randomRoll);
    }

    public int CalculateResidualStatusDamage(Pokemon pokemon)
    {
        return _statusStrategy.CalculateDamage(pokemon, pokemon, new Move(), false, 1.0);
    }
}`
  },
  {
    project: "PokeOracle.Application",
    path: "Services/ExpectiminimaxService.cs",
    content: `using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;
using PokeOracle.Domain.Common;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Services;

public class ExpectiminimaxService
{
    private readonly IDamageCalculator _damageCalculator;
    private const int MaxDepth = 3;

    public ExpectiminimaxService(IDamageCalculator damageCalculator)
    {
        _damageCalculator = damageCalculator;
    }

    public string PredictBestLead(BattleState state)
    {
        double bestScore = double.MinValue;
        Pokemon bestLead = state.PlayerParty[0];

        foreach (var p in state.PlayerParty)
        {
            double matchScore = 0;
            foreach (var r in state.RivalParty)
            {
                double speedAdvantage = p.Speed > r.Speed ? 1.5 : 0.8;
                double maxDmgToRival = p.Moves.Any() ? p.Moves.Max(m => _damageCalculator.CalculateDamage(p, r, m, false, 0.92)) : 0;
                double maxDmgToSelf = r.Moves.Any() ? r.Moves.Max(m => _damageCalculator.CalculateDamage(r, p, m, false, 0.92)) : 1;

                matchScore += (maxDmgToRival / (double)r.MaxHP) * speedAdvantage - (maxDmgToSelf / (double)p.MaxHP);
            }

            if (matchScore > bestScore)
            {
                bestScore = matchScore;
                bestLead = p;
            }
        }

        return bestLead.Name;
    }

    public TurnResultDto ComputeNextMove(BattleState state)
    {
        var player = state.ActivePlayerPokemon;
        var rival = state.ActiveRivalPokemon;

        // Si hay KO requerido, sugerir el mejor cambio automáticamente
        if (state.IsSwitchRequired || player.HP <= 0)
        {
            var switchPaths = new List<string>();
            double bestSwitchScore = double.MinValue;
            int bestSwitchIndex = -1;

            for (int i = 0; i < state.PlayerParty.Count; i++)
            {
                if (i == state.PlayerActiveIndex || state.PlayerParty[i].IsFainted) continue;
                var cand = state.PlayerParty[i];

                double maxRivalDmg = rival.Moves.Any() ? rival.Moves.Max(m => _damageCalculator.CalculateDamage(rival, cand, m, false, 0.925)) : 0;
                double maxDmgToRival = cand.Moves.Any() ? cand.Moves.Max(m => _damageCalculator.CalculateDamage(cand, rival, m, false, 0.925)) : 0;
                double switchScore = (maxDmgToRival / (double)rival.HP) - (maxRivalDmg / (double)cand.HP);

                switchPaths.Add($"Cambiar a {cand.Name} -> Score: {switchScore:F2}");
                if (switchScore > bestSwitchScore)
                {
                    bestSwitchScore = switchScore;
                    bestSwitchIndex = i;
                }
            }

            if (bestSwitchIndex >= 0)
            {
                return new TurnResultDto
                {
                    RecommendedAction = "Switch",
                    SwitchIndex = bestSwitchIndex,
                    SwitchPokemonName = state.PlayerParty[bestSwitchIndex].Name,
                    Confidence = 95,
                    Explanation = $"[CAMBIO OBLIGATORIO] ¡Tu Pokémon se ha debilitado! El motor Expectiminimax sugiere enviar a {state.PlayerParty[bestSwitchIndex].Name} como el mejor counter disponible.",
                    SimulatedPaths = switchPaths
                };
            }
        }

        var paths = new List<string>();
        double bestVal = double.MinValue;
        int bestMoveIdx = 0;
        string bestAction = "Move";
        int? bestSwitchIdx = null;

        // Evaluar movimientos del jugador
        for (int i = 0; i < player.Moves.Count; i++)
        {
            var m = player.Moves[i];
            double moveValue = EvaluateMoveExpectation(player, rival, m, 1, paths);
            paths.Add($"Simulado: Usar {m.Name} -> Score Esperado: {moveValue:F2}");

            if (moveValue > bestVal)
            {
                bestVal = moveValue;
                bestMoveIdx = i;
                bestAction = "Move";
                bestSwitchIdx = null;
            }
        }

        // Evaluar cambios tácticos
        for (int i = 0; i < state.PlayerParty.Count; i++)
        {
            if (i == state.PlayerActiveIndex) continue;
            var switchCandidate = state.PlayerParty[i];
            if (switchCandidate.IsFainted) continue;

            double switchValue = EvaluateSwitchExpectation(switchCandidate, rival, 1, paths) - 20.0;
            paths.Add($"Simulado: Cambiar a {switchCandidate.Name} -> Score Esperado: {switchValue:F2}");

            if (switchValue > bestVal)
            {
                bestVal = switchValue;
                bestAction = "Switch";
                bestSwitchIdx = i;
            }
        }

        double confidence = Math.Clamp((bestVal + 100.0) / 200.0 * 100.0, 10.0, 99.0);

        if (bestAction == "Move")
        {
            return new TurnResultDto
            {
                RecommendedAction = "Move",
                MoveIndex = bestMoveIdx,
                MoveName = player.Moves[bestMoveIdx].Name,
                Confidence = confidence,
                Explanation = $"Usar {player.Moves[bestMoveIdx].Name} maximiza las probabilidades de infligir daño crítico o KO al rival.",
                SimulatedPaths = paths.Take(8).ToList()
            };
        }
        else
        {
            return new TurnResultDto
            {
                RecommendedAction = "Switch",
                SwitchIndex = bestSwitchIdx,
                SwitchPokemonName = state.PlayerParty[bestSwitchIdx!.Value].Name,
                Confidence = confidence,
                Explanation = $"La mejor opción defensiva es cambiar a {state.PlayerParty[bestSwitchIdx.Value].Name} para resistir el próximo ataque del rival.",
                SimulatedPaths = paths.Take(8).ToList()
            };
        }
    }

    private double EvaluateMoveExpectation(Pokemon attacker, Pokemon defender, Move move, int depth, List<string> paths)
    {
        if (depth > MaxDepth || attacker.IsFainted || defender.IsFainted)
        {
            return CalculateHeuristicScore(attacker, defender);
        }

        double acc = move.Accuracy / 100.0;
        double missProb = 1.0 - acc;

        double critProb = 0.0625;
        double normalProb = 0.9375;

        int normalDmg = _damageCalculator.CalculateDamage(attacker, defender, move, false, 0.925);
        var defAfterNormal = ClonePokemon(defender);
        defAfterNormal.HP = Math.Max(0, defAfterNormal.HP - normalDmg);
        double normalHitScore = CalculateHeuristicScore(attacker, defAfterNormal);

        int critDmg = _damageCalculator.CalculateDamage(attacker, defender, move, true, 0.925);
        var defAfterCrit = ClonePokemon(defender);
        defAfterCrit.HP = Math.Max(0, defAfterCrit.HP - critDmg);
        double critHitScore = CalculateHeuristicScore(attacker, defAfterCrit);

        double hitScore = (normalHitScore * normalProb) + (critHitScore * critProb);
        double missScore = CalculateHeuristicScore(attacker, defender) - 20.0;

        return (hitScore * acc) + (missScore * missProb);
    }

    private double EvaluateSwitchExpectation(Pokemon incoming, Pokemon defender, int depth, List<string> paths)
    {
        var bestRivalMove = defender.Moves.OrderByDescending(m => _damageCalculator.CalculateDamage(defender, incoming, m, false, 1.0)).FirstOrDefault();
        var incomingAfterHit = ClonePokemon(incoming);
        if (bestRivalMove != null)
        {
            int damageTaken = _damageCalculator.CalculateDamage(defender, incoming, bestRivalMove, false, 0.925);
            incomingAfterHit.HP = Math.Max(0, incomingAfterHit.HP - damageTaken);
        }

        return CalculateHeuristicScore(incomingAfterHit, defender);
    }

    private double CalculateHeuristicScore(Pokemon player, Pokemon rival)
    {
        if (player.IsFainted) return -200.0;
        if (rival.IsFainted) return 200.0;

        double playerHpRatio = (double)player.HP / player.MaxHP;
        double rivalHpRatio = (double)rival.HP / rival.MaxHP;

        double speedWeight = player.Speed > rival.Speed ? 20.0 : -10.0;
        double statusWeight = 0;
        if (rival.Status != StatusEffect.None) statusWeight += 15.0;
        if (player.Status != StatusEffect.None) statusWeight -= 15.0;

        return (playerHpRatio * 50.0) - (rivalHpRatio * 100.0) + speedWeight + statusWeight;
    }

    private Pokemon ClonePokemon(Pokemon source)
    {
        return new Pokemon
        {
            Name = source.Name,
            Types = source.Types.ToList(),
            HP = source.HP,
            MaxHP = source.MaxHP,
            Attack = source.Attack,
            Defense = source.Defense,
            SpAttack = source.SpAttack,
            SpDefense = source.SpDefense,
            Speed = source.Speed,
            Status = source.Status,
            Ability = source.Ability,
            HeldItem = source.HeldItem,
            Moves = source.Moves.Select(m => new Move
            {
                Name = m.Name,
                Type = m.Type,
                Category = m.Category,
                Power = m.Power,
                Accuracy = m.Accuracy,
                StatusChance = m.StatusChance,
                StatusEffect = m.StatusEffect,
                IsFixedDamage = m.IsFixedDamage,
                FixedDamageValue = m.FixedDamageValue
            }).ToList()
        };
    }
}`
  },
  {
    project: "PokeOracle.Infrastructure",
    path: "Persistence/AppDbContext.cs",
    content: `using Microsoft.EntityFrameworkCore;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<BattleState> BattleStates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BattleState>().HasKey(b => b.SessionId);
        modelBuilder.Entity<BattleState>().Ignore(b => b.PlayerParty);
        modelBuilder.Entity<BattleState>().Ignore(b => b.RivalParty);
        
        base.OnModelCreating(modelBuilder);
    }
}`
  },
  {
    project: "PokeOracle.Infrastructure",
    path: "Persistence/BattleRepository.cs",
    content: `using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class BattleRepository : IBattleRepository
{
    private readonly AppDbContext _context;
    private static readonly Dictionary<string, BattleState> _sessionDb = new();

    public BattleRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<BattleState?> GetAsync(string sessionId)
    {
        if (_sessionDb.TryGetValue(sessionId, out var state))
        {
            return Task.FromResult<BattleState?>(state);
        }
        return Task.FromResult<BattleState?>(null);
    }

    public Task SaveAsync(BattleState state)
    {
        _sessionDb[state.SessionId] = state;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string sessionId)
    {
        _sessionDb.Remove(sessionId);
        return Task.CompletedTask;
    }
}`
  },
  {
    project: "PokeOracle.Infrastructure",
    path: "Data/PokeOracleDataSeeder.cs",
    content: `using System.Text.Json;
using PokeOracle.Domain.Entities;
using PokeOracle.Infrastructure.Persistence;

namespace PokeOracle.Infrastructure.Data;

public class PokeOracleDataSeeder
{
    private readonly AppDbContext _context;

    public PokeOracleDataSeeder(AppDbContext context)
    {
        _context = context;
    }

    public void SeedData(string contentRootPath)
    {
        try
        {
            var pokemonJsonPath = Path.Combine(contentRootPath, "pokemon_data.json");
            var movesJsonPath = Path.Combine(contentRootPath, "moves_data.json");

            if (File.Exists(pokemonJsonPath))
            {
                var pokemonData = File.ReadAllText(pokemonJsonPath);
                var species = JsonSerializer.Deserialize<List<PokemonSeedDto>>(pokemonData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                Console.WriteLine($"Seeder: Creado catálogo dinámico de {species?.Count} Pokémon de Kanto.");
            }

            if (File.Exists(movesJsonPath))
            {
                var movesData = File.ReadAllText(movesJsonPath);
                var moves = JsonSerializer.Deserialize<List<Move>>(movesData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                Console.WriteLine($"Seeder: Creado catálogo dinámico de {moves?.Count} Movimientos.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error seeding data: {ex.Message}");
        }
    }
}

public class PokemonSeedDto
{
    public string Name { get; set; } = string.Empty;
    public List<string> Types { get; set; } = new();
    public int HP { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }
}`
  },
  {
    project: "PokeOracle.WebApi",
    path: "Controllers/BattleController.cs",
    content: `using Microsoft.AspNetCore.Mvc;
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
}`
  },
  {
    project: "PokeOracle.WebApi",
    path: "Program.cs",
    content: `using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("PokeOracleDb"));
builder.Services.AddScoped<IBattleRepository, BattleRepository>();
builder.Services.AddScoped<IDamageCalculator, DamageCalculator>();
builder.Services.AddScoped<ExpectiminimaxService>();
builder.Services.AddScoped<PokeOracleDataSeeder>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Invocar el Seeder al iniciar la WebApi
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<PokeOracleDataSeeder>();
    seeder.SeedData(app.Environment.ContentRootPath);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();`
  }
];
