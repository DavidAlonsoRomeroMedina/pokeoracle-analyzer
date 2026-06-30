using PokeOracle.Domain.Common;
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
}