using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.DTOs;

public class BattleSetupDto
{
    public List<Pokemon> PlayerParty { get; set; } = new();
    public List<Pokemon> RivalParty { get; set; } = new();
}