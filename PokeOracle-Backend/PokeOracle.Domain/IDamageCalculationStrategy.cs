<<<<<<< HEAD
using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public interface IDamageCalculationStrategy
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
=======
using PokeOracle.Domain.Entities;

namespace PokeOracle.Domain.Strategies;

public interface IDamageCalculationStrategy
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
>>>>>>> 063c35bd5ca941119c2db745bf84c16baf9ff108
}