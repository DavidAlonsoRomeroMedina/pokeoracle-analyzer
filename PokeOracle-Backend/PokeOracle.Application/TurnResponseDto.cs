using PokeOracle.Domain.Entities;

namespace PokeOracle.Application.DTOs;

/// <summary>
/// Respuesta de un turno o de un cambio de Pokémon.
/// </summary>
/// <remarks>
/// Hereda de <see cref="TurnResultDto"/> a propósito: el cliente lee la sugerencia
/// en la raíz del objeto (<c>data.confidence</c>, <c>data.recommendedAction</c>), no
/// anidada bajo otra propiedad.
/// </remarks>
public class TurnResponseDto : TurnResultDto
{
    public BattleState? SessionState { get; set; }
    public bool IsSwitchRequired { get; set; }

    public static TurnResponseDto From(TurnResultDto suggestion, BattleState state) => new()
    {
        RecommendedAction = suggestion.RecommendedAction,
        MoveIndex = suggestion.MoveIndex,
        MoveName = suggestion.MoveName,
        SwitchIndex = suggestion.SwitchIndex,
        SwitchPokemonName = suggestion.SwitchPokemonName,
        Confidence = suggestion.Confidence,
        Explanation = suggestion.Explanation,
        SimulatedPaths = suggestion.SimulatedPaths,
        SessionState = state,
        IsSwitchRequired = state.IsSwitchRequired
    };
}
