namespace PokeOracle.Application.DTOs;

/// <summary>
/// Movimiento del catálogo, tal como está en el archivo de datos del proyecto.
/// </summary>
/// <remarks>
/// <see cref="StatusEffect"/> es texto y no el enum del dominio a propósito. El
/// archivo de movimientos usa 54 efectos distintos (<c>AtkDown</c>, <c>Flinch</c>,
/// <c>Recoil</c>, <c>OHKO</c>...) mientras que
/// <see cref="Domain.Common.StatusEffect"/> solo modela los seis estados alterados
/// clásicos. Tipar el catálogo contra el enum haría fallar la lectura de casi todos
/// los movimientos, así que se respeta el dato de origen.
/// </remarks>
public class MoveCatalogEntryDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Power { get; set; }
    public int Accuracy { get; set; }
    public int StatusChance { get; set; }
    public string StatusEffect { get; set; } = "None";
    public bool IsFixedDamage { get; set; }
    public int FixedDamageValue { get; set; }
}
