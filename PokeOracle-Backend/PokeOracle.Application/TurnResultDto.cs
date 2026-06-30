namespace PokeOracle.Application.DTOs;

public class TurnResultDto
{
    public string RecommendedAction { get; set; } = string.Empty; // "Move" o "Switch"
    public int? MoveIndex { get; set; }
    public string? MoveName { get; set; }
    public int? SwitchIndex { get; set; }
    public string? SwitchPokemonName { get; set; }
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> SimulatedPaths { get; set; } = new();
}