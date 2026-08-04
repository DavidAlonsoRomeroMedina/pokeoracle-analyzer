namespace PokeOracle.Infrastructure.PokeApi;

/// <summary>
/// Configuración del cliente de PokéAPI. Se puede sobrescribir desde
/// appsettings.json en la sección "PokeApi".
/// </summary>
public sealed class PokeApiOptions
{
    public const string SectionName = "PokeApi";

    /// <summary>Nombre del <c>HttpClient</c> registrado en el contenedor.</summary>
    public const string HttpClientName = "PokeApi";

    /// <summary>Kanto va del 1 al 151. PokeOracle no simula fuera de ese rango.</summary>
    public const int FirstGenerationPokemonCount = 151;

    public string BaseAddress { get; set; } = "https://pokeapi.co/api/v2/";

    /// <summary>
    /// PokéAPI responde 403 a clientes sin <c>User-Agent</c>, así que siempre se envía uno.
    /// </summary>
    public string UserAgent { get; set; } = "PokeOracle/1.0 (+https://github.com/DavidAlonsoRomeroMedina/pokeoracle-analyzer)";

    public int RequestTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Peticiones simultáneas contra PokéAPI. Es una API pública y gratuita, así que
    /// conviene no subirlo en exceso.
    /// </summary>
    public int MaxConcurrentRequests { get; set; } = 8;

    /// <summary>Intentos totales por petición, incluyendo el primero.</summary>
    public int MaxAttempts { get; set; } = 3;

    /// <summary>Retardo base del reintento exponencial.</summary>
    public int RetryBaseDelayMilliseconds { get; set; } = 400;

    /// <summary>
    /// Id máximo de objeto que se inspecciona al construir el catálogo de Generación 1.
    /// </summary>
    /// <remarks>
    /// PokéAPI no expone objetos por generación: <c>/generation/1</c> devuelve especies,
    /// movimientos y tipos, pero no objetos. La única fuente fiable es el campo
    /// <c>game_indices</c> de cada objeto, lo que obliga a inspeccionarlos uno a uno.
    /// <para>
    /// Los ids tampoco son contiguos: los objetos de Generación 1 aparecen mezclados con
    /// los de generaciones posteriores (por ejemplo <c>dive-ball</c> es Generación 3 y
    /// ocupa el id 7). Un escaneo completo del catálogo son 2223 peticiones. Recorriendo
    /// todo el catálogo se comprueba que los 130 objetos de Generación 1 ocupan ids entre
    /// 1 y 548, por lo que 600 cubre el conjunto completo con margen y reduce el trabajo
    /// a una cuarta parte.
    /// </para>
    /// Usa 0 para escanear el catálogo entero si en el futuro PokéAPI reordena los ids.
    /// </remarks>
    public int ItemScanLimit { get; set; } = 600;
}
