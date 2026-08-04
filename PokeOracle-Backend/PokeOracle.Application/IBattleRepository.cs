<<<<<<< HEAD
using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IBattleRepository
{
    Task<BattleState?> GetAsync(string sessionId);
    Task SaveAsync(BattleState state);
    Task DeleteAsync(string sessionId);
=======
using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IBattleRepository
{
    Task<BattleState?> GetAsync(string sessionId);
    Task SaveAsync(BattleState state);
    Task DeleteAsync(string sessionId);
>>>>>>> 063c35bd5ca941119c2db745bf84c16baf9ff108
}