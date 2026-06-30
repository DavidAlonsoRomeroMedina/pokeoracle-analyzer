using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IDamageCalculator
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
    int CalculateResidualStatusDamage(Pokemon pokemon);
}