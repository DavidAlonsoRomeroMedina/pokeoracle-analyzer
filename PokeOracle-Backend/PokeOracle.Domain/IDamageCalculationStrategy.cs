using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public interface IDamageCalculationStrategy
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
}