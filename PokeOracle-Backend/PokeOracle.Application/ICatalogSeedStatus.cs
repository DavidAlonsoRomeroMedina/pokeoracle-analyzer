namespace PokeOracle.Application.Interfaces;

/// <summary>
/// Estado del seeding en segundo plano. La API consulta esto para saber si
/// ya puede servir el catálogo desde SQLite.
/// </summary>
public interface ICatalogSeedStatus
{
    bool IsReady { get; }
    bool IsRunning { get; }
    bool HasFailed { get; }
    string Message { get; }
    int PokemonLoaded { get; }
    int PokemonTarget { get; }
    double ProgressPercent { get; }
}

public sealed class CatalogSeedStatus : ICatalogSeedStatus
{
    private readonly object _gate = new();
    private bool _isReady;
    private bool _isRunning;
    private bool _hasFailed;
    private string _message = "Pendiente de inicialización.";
    private int _pokemonLoaded;
    private int _pokemonTarget = 1025;

    public bool IsReady
    {
        get { lock (_gate) return _isReady; }
    }

    public bool IsRunning
    {
        get { lock (_gate) return _isRunning; }
    }

    public bool HasFailed
    {
        get { lock (_gate) return _hasFailed; }
    }

    public string Message
    {
        get { lock (_gate) return _message; }
    }

    public int PokemonLoaded
    {
        get { lock (_gate) return _pokemonLoaded; }
    }

    public int PokemonTarget
    {
        get { lock (_gate) return _pokemonTarget; }
    }

    public double ProgressPercent
    {
        get
        {
            lock (_gate)
            {
                if (_pokemonTarget <= 0) return 0;
                return Math.Clamp(100.0 * _pokemonLoaded / _pokemonTarget, 0, 100);
            }
        }
    }

    public void MarkRunning(int target, string message)
    {
        lock (_gate)
        {
            _isRunning = true;
            _hasFailed = false;
            _isReady = false;
            _pokemonTarget = target;
            _message = message;
        }
    }

    public void ReportProgress(int loaded, string message)
    {
        lock (_gate)
        {
            _pokemonLoaded = loaded;
            _message = message;
        }
    }

    public void MarkReady(int loaded, string message)
    {
        lock (_gate)
        {
            _isRunning = false;
            _hasFailed = false;
            _isReady = true;
            _pokemonLoaded = loaded;
            _message = message;
        }
    }

    public void MarkFailed(string message)
    {
        lock (_gate)
        {
            _isRunning = false;
            _hasFailed = true;
            _isReady = false;
            _message = message;
        }
    }
}
