using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.Interfaces;

public interface IBattleRepository
{
    Task<BattleState?> GetAsync(string sessionId);
    Task SaveAsync(BattleState state);
    Task DeleteAsync(string sessionId);
}