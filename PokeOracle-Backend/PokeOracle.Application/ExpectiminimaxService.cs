using PokeOracle.Application.DTOs;
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
}