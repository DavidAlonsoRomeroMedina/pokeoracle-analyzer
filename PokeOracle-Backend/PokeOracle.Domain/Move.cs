using PokeOracle.Domain.Common;

namespace PokeOracle.Domain.Entities;

public class Move
{
    public string Name { get; set; } = string.Empty;
    public PokemonType Type { get; set; }
    public MoveCategory Category { get; set; }
    public int Power { get; set; }
    public int Accuracy { get; set; }
    public int StatusChance { get; set; }
    public StatusEffect StatusEffect { get; set; }
    public bool IsFixedDamage { get; set; }
    public int FixedDamageValue { get; set; }
}