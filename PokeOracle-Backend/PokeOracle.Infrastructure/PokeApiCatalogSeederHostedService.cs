using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Persistence.Entities;
using PokeOracle.Infrastructure.PokeApi;

namespace PokeOracle.Infrastructure.Catalog;

/// <summary>
/// En el primer arranque (SQLite vacío) descarga el catálogo nacional desde PokéAPI
/// en segundo plano. La API arranca de inmediato y responde 503 hasta que termine.
/// Reinicios posteriores reutilizan la base sin volver a llamar a PokéAPI.
/// </summary>
public sealed class PokeApiCatalogSeederHostedService : BackgroundService
{
    private const string SpanishLanguage = "es";
    private const string EnglishLanguage = "en";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly PokeApiDownloader _downloader;
    private readonly PokeApiOptions _options;
    private readonly CatalogSeedStatus _status;
    private readonly ILogger<PokeApiCatalogSeederHostedService> _logger;

    public PokeApiCatalogSeederHostedService(
        IServiceScopeFactory scopeFactory,
        PokeApiDownloader downloader,
        PokeApiOptions options,
        CatalogSeedStatus status,
        ILogger<PokeApiCatalogSeederHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _downloader = downloader;
        _options = options;
        _status = status;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Pequeña pausa para que Kestrel acepte conexiones antes del seeding pesado.
        await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken).ConfigureAwait(false);

        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Database.EnsureCreatedAsync(stoppingToken).ConfigureAwait(false);

            var meta = await db.CatalogMeta.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == 1, stoppingToken)
                .ConfigureAwait(false);

            var pokemonCount = await db.Pokemon.CountAsync(stoppingToken).ConfigureAwait(false);

            if (meta?.SeedCompleted == true && pokemonCount >= _options.PokemonCount)
            {
                _status.MarkReady(pokemonCount, $"Catálogo listo ({pokemonCount} Pokémon en SQLite).");
                _logger.LogInformation("SQLite ya tiene el catálogo completo ({Count} Pokémon). No se llama a PokéAPI.", pokemonCount);
                return;
            }

            _status.MarkRunning(_options.PokemonCount, "Descargando catálogo desde PokéAPI…");
            _logger.LogInformation(
                "Iniciando seeding: objetivo {Target} Pokémon (concurrencia {Concurrency}). Esto puede tardar varios minutos la primera vez.",
                _options.PokemonCount, _options.MaxConcurrentRequests);

            await SeedLocalBattleMovesAsync(db, stoppingToken).ConfigureAwait(false);
            await SeedPokemonAsync(db, stoppingToken).ConfigureAwait(false);
            await SeedAbilitiesAsync(db, stoppingToken).ConfigureAwait(false);
            await SeedMovesFromApiAsync(db, stoppingToken).ConfigureAwait(false);
            await SeedItemsAsync(db, stoppingToken).ConfigureAwait(false);

            pokemonCount = await db.Pokemon.CountAsync(stoppingToken).ConfigureAwait(false);
            var abilityCount = await db.Abilities.CountAsync(stoppingToken).ConfigureAwait(false);
            var moveCount = await db.Moves.CountAsync(stoppingToken).ConfigureAwait(false);
            var itemCount = await db.Items.CountAsync(stoppingToken).ConfigureAwait(false);

            var completed = new CatalogMetaEntity
            {
                Id = 1,
                SeedCompleted = pokemonCount >= _options.PokemonCount,
                SeedCompletedAt = DateTimeOffset.UtcNow,
                PokemonCount = pokemonCount,
                AbilityCount = abilityCount,
                MoveCount = moveCount,
                ItemCount = itemCount,
                LastError = null
            };

            var existingMeta = await db.CatalogMeta.FindAsync([1], stoppingToken).ConfigureAwait(false);
            if (existingMeta is null)
            {
                db.CatalogMeta.Add(completed);
            }
            else
            {
                existingMeta.SeedCompleted = completed.SeedCompleted;
                existingMeta.SeedCompletedAt = completed.SeedCompletedAt;
                existingMeta.PokemonCount = completed.PokemonCount;
                existingMeta.AbilityCount = completed.AbilityCount;
                existingMeta.MoveCount = completed.MoveCount;
                existingMeta.ItemCount = completed.ItemCount;
                existingMeta.LastError = null;
            }

            await db.SaveChangesAsync(stoppingToken).ConfigureAwait(false);

            if (completed.SeedCompleted)
            {
                _status.MarkReady(pokemonCount,
                    $"Catálogo listo: {pokemonCount} Pokémon, {abilityCount} habilidades, {moveCount} movimientos, {itemCount} objetos.");
                _logger.LogInformation(
                    "Seeding completado: {Pokemon} Pokémon, {Abilities} habilidades, {Moves} movimientos, {Items} objetos.",
                    pokemonCount, abilityCount, moveCount, itemCount);
            }
            else
            {
                var msg = $"Seeding incompleto: solo {pokemonCount}/{_options.PokemonCount} Pokémon. Reinicia la app para reintentar.";
                _status.MarkFailed(msg);
                _logger.LogWarning(msg);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _status.MarkFailed("Seeding cancelado al apagar la aplicación.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo el seeding del catálogo.");
            _status.MarkFailed($"Error de seeding: {ex.Message}");

            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var meta = await db.CatalogMeta.FindAsync([1], CancellationToken.None).ConfigureAwait(false);
                if (meta is null)
                {
                    db.CatalogMeta.Add(new CatalogMetaEntity { Id = 1, SeedCompleted = false, LastError = ex.Message });
                }
                else
                {
                    meta.LastError = ex.Message;
                    meta.SeedCompleted = false;
                }

                await db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception persistEx)
            {
                _logger.LogError(persistEx, "No se pudo guardar el error de seeding en SQLite.");
            }
        }
    }

    private async Task SeedPokemonAsync(AppDbContext db, CancellationToken ct)
    {
        var target = Math.Max(1, _options.PokemonCount);
        var existingIds = (await db.Pokemon.Select(p => p.Id).ToListAsync(ct).ConfigureAwait(false)).ToHashSet();

        if (existingIds.Count >= target)
        {
            _status.ReportProgress(existingIds.Count, "Pokémon ya presentes en SQLite.");
            return;
        }

        _logger.LogInformation("PokéAPI: listando índice de {Count} Pokémon…", target);
        var index = await _downloader.GetJsonAsync<ResourceListResponse>($"pokemon?limit={target}", ct).ConfigureAwait(false);
        var entries = (index?.Results ?? new List<NamedApiResource>())
            .Where(e => !string.IsNullOrWhiteSpace(e.Url))
            .ToList();

        // Continuar desde donde se quedó si el proceso murió a mitad.
        var pending = new List<(int ApproximateId, string Url)>();
        for (var i = 0; i < entries.Count; i++)
        {
            var approxId = i + 1;
            if (!existingIds.Contains(approxId))
            {
                pending.Add((approxId, entries[i].Url!));
            }
        }

        // Si hay huecos por ids reales distintos al orden del índice, también rellenar ids faltantes 1..target
        var missingIds = Enumerable.Range(1, target).Where(id => !existingIds.Contains(id)).ToHashSet();

        _status.ReportProgress(existingIds.Count, $"Descargando Pokémon faltantes ({missingIds.Count})…");

        var batchSize = Math.Max(5, _options.PokemonSaveBatchSize);
        var loaded = existingIds.Count;
        var nextAbilityId = await db.Abilities.AnyAsync(ct).ConfigureAwait(false)
            ? await db.Abilities.MaxAsync(a => a.Id, ct).ConfigureAwait(false) + 1
            : 1;

        for (var offset = 0; offset < pending.Count; offset += batchSize)
        {
            ct.ThrowIfCancellationRequested();
            var chunk = pending.Skip(offset).Take(batchSize).ToList();

            var responses = await _downloader.MapWithConcurrencyAsync(
                chunk,
                async (entry, token) =>
                {
                    var pokemon = await _downloader.GetJsonAsync<PokemonResponse>(entry.Url, token).ConfigureAwait(false);
                    if (pokemon is null || pokemon.Id < 1 || pokemon.Id > target) return null;
                    if (existingIds.Contains(pokemon.Id)) return null;
                    return pokemon;
                },
                ct).ConfigureAwait(false);

            foreach (var response in responses)
            {
                if (existingIds.Contains(response.Id)) continue;

                var entity = MapPokemon(response);
                db.Pokemon.Add(entity);

                foreach (var slot in (response.Abilities ?? new List<PokemonAbilitySlot>()).OrderBy(a => a.Slot))
                {
                    var slug = slot.Ability?.Name;
                    if (string.IsNullOrWhiteSpace(slug)) continue;

                    var ability = db.Abilities.Local.FirstOrDefault(a => a.Name == slug)
                        ?? await db.Abilities.FirstOrDefaultAsync(a => a.Name == slug, ct).ConfigureAwait(false);

                    if (ability is null)
                    {
                        ability = new AbilityEntity
                        {
                            Id = nextAbilityId++,
                            Name = slug,
                            DisplayName = Humanize(slug)
                        };
                        db.Abilities.Add(ability);
                    }

                    db.PokemonAbilities.Add(new PokemonAbilityLink
                    {
                        PokemonId = entity.Id,
                        AbilityId = ability.Id,
                        Slot = slot.Slot,
                        IsHidden = slot.IsHidden
                    });
                }

                existingIds.Add(response.Id);
                loaded++;
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            db.ChangeTracker.Clear();

            _status.ReportProgress(loaded, $"Pokémon descargados: {loaded}/{target}");
            _logger.LogInformation("Seeding Pokémon: {Loaded}/{Target}", loaded, target);
        }
    }

    private async Task SeedAbilitiesAsync(AppDbContext db, CancellationToken ct)
    {
        var stubs = await db.Abilities.AsNoTracking()
            .Where(a => a.ShortEffect == null || a.ShortEffect == string.Empty)
            .Select(a => new { a.Id, a.Name })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (stubs.Count == 0)
        {
            _logger.LogInformation("Habilidades ya enriquecidas.");
            return;
        }

        _status.ReportProgress(_status.PokemonLoaded, $"Enriqueciendo {stubs.Count} habilidades…");
        _logger.LogInformation("PokéAPI: enriqueciendo {Count} habilidades…", stubs.Count);

        var batchSize = Math.Max(5, _options.PokemonSaveBatchSize);
        for (var offset = 0; offset < stubs.Count; offset += batchSize)
        {
            ct.ThrowIfCancellationRequested();
            var chunk = stubs.Skip(offset).Take(batchSize).ToList();

            var responses = await _downloader.MapWithConcurrencyAsync(
                chunk,
                (stub, token) => _downloader.GetJsonAsync<AbilityResponse>($"ability/{stub.Name}", token),
                ct).ConfigureAwait(false);

            foreach (var response in responses)
            {
                var entity = await db.Abilities.FirstOrDefaultAsync(a => a.Name == response.Name, ct).ConfigureAwait(false);
                if (entity is null) continue;

                // Si PokéAPI trae un id real distinto del temporal, migrar FK es costoso;
                // mantenemos el id local y solo actualizamos textos.
                entity.DisplayName = PickLocalizedName(response.Names, response.Name);
                entity.ShortEffect = PickEnglishShortEffect(response.EffectEntries);
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            db.ChangeTracker.Clear();
        }
    }

    private async Task SeedMovesFromApiAsync(AppDbContext db, CancellationToken ct)
    {
        var index = await _downloader.GetJsonAsync<ResourceListResponse>("move?limit=1", ct).ConfigureAwait(false);
        var total = index?.Count ?? 0;
        if (total <= 0) return;

        var limit = _options.MoveScanLimit > 0 ? Math.Min(_options.MoveScanLimit, total) : total;
        // Los movimientos locales de combate usan ids >= 10000; los de PokéAPI van por debajo.
        var existing = (await db.Moves.Select(m => m.Id).ToListAsync(ct).ConfigureAwait(false)).ToHashSet();
        var apiMoveCount = existing.Count(id => id < 10_000);

        if (apiMoveCount >= limit)
        {
            _logger.LogInformation("Movimientos de PokéAPI ya presentes ({Count}).", apiMoveCount);
            return;
        }

        _status.ReportProgress(_status.PokemonLoaded, $"Descargando movimientos ({limit})…");
        _logger.LogInformation("PokéAPI: descargando hasta {Count} movimientos…", limit);

        var list = await _downloader.GetJsonAsync<ResourceListResponse>($"move?limit={limit}", ct).ConfigureAwait(false);
        var entries = (list?.Results ?? new List<NamedApiResource>())
            .Where(e => !string.IsNullOrWhiteSpace(e.Url))
            .ToList();

        var batchSize = Math.Max(5, _options.PokemonSaveBatchSize);
        for (var offset = 0; offset < entries.Count; offset += batchSize)
        {
            ct.ThrowIfCancellationRequested();
            var chunk = entries.Skip(offset).Take(batchSize).ToList();

            var responses = await _downloader.MapWithConcurrencyAsync(
                chunk,
                (entry, token) => _downloader.GetJsonAsync<MoveResponse>(entry.Url!, token),
                ct).ConfigureAwait(false);

            foreach (var move in responses)
            {
                if (existing.Contains(move.Id)) continue;

                // Preferir datos locales de combate si ya existen (id distinto: por nombre).
                var byName = await db.Moves.FirstOrDefaultAsync(m => m.Name == move.Name, ct).ConfigureAwait(false);
                if (byName is not null)
                {
                    byName.DisplayName = PickLocalizedName(move.Names, move.Name);
                    byName.ShortEffect = PickEnglishShortEffect(move.EffectEntries) ?? byName.ShortEffect;
                    byName.Pp = move.Pp ?? byName.Pp;
                    if (byName.Power == 0 && move.Power is int p) byName.Power = p;
                    if (byName.Accuracy == 0 && move.Accuracy is int a) byName.Accuracy = a;
                    continue;
                }

                db.Moves.Add(new MoveEntity
                {
                    Id = move.Id,
                    Name = move.Name ?? $"move-{move.Id}",
                    DisplayName = PickLocalizedName(move.Names, move.Name),
                    Type = Humanize(move.Type?.Name),
                    Category = Humanize(move.DamageClass?.Name) switch
                    {
                        "Physical" => "Physical",
                        "Special" => "Special",
                        "Status" => "Status",
                        _ => "Physical"
                    },
                    Power = move.Power ?? 0,
                    Accuracy = move.Accuracy ?? 100,
                    Pp = move.Pp ?? 0,
                    ShortEffect = PickEnglishShortEffect(move.EffectEntries),
                    StatusEffect = "None"
                });
                existing.Add(move.Id);
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            db.ChangeTracker.Clear();
            _logger.LogInformation("Seeding movimientos: {Count}/{Limit}", existing.Count, limit);
        }
    }

    private async Task SeedItemsAsync(AppDbContext db, CancellationToken ct)
    {
        var scanLimit = _options.ItemScanLimit;
        if (scanLimit <= 0)
        {
            var index = await _downloader.GetJsonAsync<ResourceListResponse>("item?limit=1", ct).ConfigureAwait(false);
            scanLimit = index?.Count ?? 0;
        }

        var existing = (await db.Items.Select(i => i.Id).ToListAsync(ct).ConfigureAwait(false)).ToHashSet();
        if (existing.Count >= scanLimit)
        {
            _logger.LogInformation("Objetos ya presentes ({Count}).", existing.Count);
            return;
        }

        _status.ReportProgress(_status.PokemonLoaded, $"Descargando objetos (hasta {scanLimit})…");
        _logger.LogInformation("PokéAPI: inspeccionando {Count} objetos…", scanLimit);

        var ids = Enumerable.Range(1, scanLimit).Where(id => !existing.Contains(id)).ToList();
        var batchSize = Math.Max(5, _options.PokemonSaveBatchSize);

        for (var offset = 0; offset < ids.Count; offset += batchSize)
        {
            ct.ThrowIfCancellationRequested();
            var chunk = ids.Skip(offset).Take(batchSize).ToList();

            var responses = await _downloader.MapWithConcurrencyAsync(
                chunk,
                (id, token) => _downloader.GetJsonAsync<ItemResponse>($"item/{id}", token),
                ct).ConfigureAwait(false);

            foreach (var item in responses)
            {
                if (existing.Contains(item.Id)) continue;
                db.Items.Add(new ItemEntity
                {
                    Id = item.Id,
                    Name = item.Name ?? $"item-{item.Id}",
                    DisplayName = PickLocalizedName(item.Names, item.Name),
                    SpriteUrl = item.Sprites?.Default,
                    Category = item.Category?.Name ?? string.Empty,
                    Cost = item.Cost ?? 0,
                    ShortEffect = PickEnglishShortEffect(item.EffectEntries)
                });
                existing.Add(item.Id);
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            db.ChangeTracker.Clear();
            _logger.LogInformation("Seeding objetos: {Count}", existing.Count);
        }
    }

    /// <summary>
    /// Importa movimientos de combate locales (JSON) para que la UI de batalla
    /// siga teniendo los mismos valores aunque el seeding de PokéAPI sea lento.
    /// </summary>
    private async Task SeedLocalBattleMovesAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Moves.AnyAsync(ct).ConfigureAwait(false))
        {
            return;
        }

        var path = Path.Combine(AppContext.BaseDirectory, "Data", "moves_data.json");
        if (!File.Exists(path))
        {
            _logger.LogWarning("No se encontró {Path}; los movimientos saldrán solo de PokéAPI.", path);
            return;
        }

        try
        {
            var local = JsonSerializer.Deserialize<List<MoveCatalogEntryDto>>(
                await File.ReadAllTextAsync(path, ct).ConfigureAwait(false),
                JsonOptions) ?? new List<MoveCatalogEntryDto>();

            var id = 10_000; // rango reservado para no chocar con ids de PokéAPI
            foreach (var move in local)
            {
                db.Moves.Add(new MoveEntity
                {
                    Id = id++,
                    Name = Slugify(move.Name),
                    DisplayName = move.Name,
                    Type = move.Type,
                    Category = move.Category,
                    Power = move.Power,
                    Accuracy = move.Accuracy,
                    StatusChance = move.StatusChance,
                    StatusEffect = move.StatusEffect,
                    IsFixedDamage = move.IsFixedDamage,
                    FixedDamageValue = move.FixedDamageValue
                });
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            db.ChangeTracker.Clear();
            _logger.LogInformation("Importados {Count} movimientos locales de combate.", local.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudieron importar movimientos locales.");
        }
    }

    private static PokemonEntity MapPokemon(PokemonResponse response)
    {
        var stats = response.Stats ?? new List<PokemonStatSlot>();
        var types = (response.Types ?? new List<PokemonTypeSlot>())
            .OrderBy(t => t.Slot)
            .Select(t => Humanize(t.Type?.Name))
            .Where(t => t.Length > 0)
            .ToList();

        return new PokemonEntity
        {
            Id = response.Id,
            Name = response.Name ?? $"pokemon-{response.Id}",
            DisplayName = Humanize(response.Name),
            TypesJson = JsonSerializer.Serialize(types, JsonOptions),
            Hp = FindStat(stats, "hp"),
            Attack = FindStat(stats, "attack"),
            Defense = FindStat(stats, "defense"),
            SpAttack = FindStat(stats, "special-attack"),
            SpDefense = FindStat(stats, "special-defense"),
            Speed = FindStat(stats, "speed"),
            SpriteUrl = response.Sprites?.FrontDefault,
            ShinySpriteUrl = response.Sprites?.FrontShiny,
            BackSpriteUrl = response.Sprites?.BackDefault,
            ArtworkUrl = response.Sprites?.Other?.OfficialArtwork?.FrontDefault,
            Height = response.Height,
            Weight = response.Weight
        };
    }

    private static int FindStat(List<PokemonStatSlot> stats, string statName) =>
        stats.FirstOrDefault(s => string.Equals(s.Stat?.Name, statName, StringComparison.OrdinalIgnoreCase))?.BaseStat ?? 0;

    private static string PickLocalizedName(List<LocalizedName>? names, string? fallbackSlug)
    {
        var spanish = names?.FirstOrDefault(n =>
            string.Equals(n.Language?.Name, SpanishLanguage, StringComparison.OrdinalIgnoreCase))?.Name;
        return !string.IsNullOrWhiteSpace(spanish) ? spanish : Humanize(fallbackSlug);
    }

    private static string? PickEnglishShortEffect(List<EffectEntry>? entries) =>
        entries?.FirstOrDefault(e =>
            string.Equals(e.Language?.Name, EnglishLanguage, StringComparison.OrdinalIgnoreCase))?.ShortEffect;

    private static string Humanize(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return string.Empty;
        var words = slug.Split('-', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => char.ToUpperInvariant(word[0]) + word[1..]);
        return string.Join(' ', words);
    }

    private static string Slugify(string name) =>
        string.Join('-', name.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}
