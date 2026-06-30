using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class BattleRepository : IBattleRepository
{
    private readonly AppDbContext _context;
    private static readonly Dictionary<string, BattleState> _sessionDb = new();

    public BattleRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<BattleState?> GetAsync(string sessionId)
    {
        if (_sessionDb.TryGetValue(sessionId, out var state))
        {
            return Task.FromResult<BattleState?>(state);
        }
        return Task.FromResult<BattleState?>(null);
    }

    public Task SaveAsync(BattleState state)
    {
        _sessionDb[state.SessionId] = state;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string sessionId)
    {
        _sessionDb.Remove(sessionId);
        return Task.CompletedTask;
    }
}