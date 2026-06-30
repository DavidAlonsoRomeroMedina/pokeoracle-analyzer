using PokeOracle.Domain.Common;
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
}