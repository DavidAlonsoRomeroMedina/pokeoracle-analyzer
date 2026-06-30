using PokeOracle.Application.Interfaces;
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
}