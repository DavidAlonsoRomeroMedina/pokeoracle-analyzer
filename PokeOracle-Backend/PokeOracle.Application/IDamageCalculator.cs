<<<<<<< HEAD
using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IDamageCalculator
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
    int CalculateResidualStatusDamage(Pokemon pokemon);
=======
using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IDamageCalculator
{
    int CalculateDamage(Pokemon attacker, Pokemon defender, Move move, bool isCritical, double randomRoll);
    int CalculateResidualStatusDamage(Pokemon pokemon);
>>>>>>> 063c35bd5ca941119c2db745bf84c16baf9ff108
}