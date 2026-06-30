using PokeOracle.Domain.Common;

namespace PokeOracle.Domain.Entities;

public class Pokemon
{
    public string Name { get; set; } = string.Empty;
    public List<PokemonType> Types { get; set; } = new();
    public int HP { get; set; }
    public int MaxHP { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }
    public StatusEffect Status { get; set; } = StatusEffect.None;
    public List<Move> Moves { get; set; } = new();

    // Habilidad y Objeto Equipado (Gen 3)
    public string Ability { get; set; } = string.Empty;
    public string HeldItem { get; set; } = string.Empty;

    public bool IsFainted => HP <= 0;
}