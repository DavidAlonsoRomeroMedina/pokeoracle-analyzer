using PokeOracle.Domain.Entities;

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
}