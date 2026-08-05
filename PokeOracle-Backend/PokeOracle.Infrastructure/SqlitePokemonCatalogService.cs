using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PokeOracle.Application.DTOs;
using PokeOracle.Application.Interfaces;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Persistence.Entities;

namespace PokeOracle.Infrastructure.Catalog;

/// <summary>
/// Sirve el catálogo exclusivamente desde SQLite. No llama a PokéAPI.
/// </summary>
public sealed class SqlitePokemonCatalogService : IPokemonExternalService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ICatalogSeedStatus _seedStatus;

    public SqlitePokemonCatalogService(IServiceScopeFactory scopeFactory, ICatalogSeedStatus seedStatus)
    {
        _scopeFactory = scopeFactory;
        _seedStatus = seedStatus;
    }

    public Task<IReadOnlyList<PokemonSummaryDto>> GetAllPokemonAsync(CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var rows = await db.Pokemon.AsNoTracking().OrderBy(p => p.Id).ToListAsync(cancellationToken).ConfigureAwait(false);
            return (IReadOnlyList<PokemonSummaryDto>)rows.Select(p => new PokemonSummaryDto
            {
                PokedexNumber = p.Id,
                Name = p.Name,
                DisplayName = p.DisplayName,
                SpriteUrl = p.SpriteUrl,
                ArtworkUrl = p.ArtworkUrl,
                Types = DeserializeTypes(p.TypesJson)
            }).ToList();
        });

    public Task<IReadOnlyList<PokemonCatalogEntryDto>> GetPokemonWithStatsAsync(CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var rows = await db.Pokemon.AsNoTracking().OrderBy(p => p.Id).ToListAsync(cancellationToken).ConfigureAwait(false);
            return (IReadOnlyList<PokemonCatalogEntryDto>)rows.Select(p => new PokemonCatalogEntryDto
            {
                PokedexNumber = p.Id,
                Name = p.DisplayName,
                Types = DeserializeTypes(p.TypesJson),
                Hp = p.Hp,
                Attack = p.Attack,
                Defense = p.Defense,
                SpAttack = p.SpAttack,
                SpDefense = p.SpDefense,
                Speed = p.Speed,
                SpriteUrl = p.SpriteUrl,
                ArtworkUrl = p.ArtworkUrl
            }).ToList();
        });

    public Task<PokemonDetailDto?> GetPokemonAsync(int pokedexNumber, CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var p = await db.Pokemon.AsNoTracking()
                .Include(x => x.AbilityLinks).ThenInclude(l => l.Ability)
                .FirstOrDefaultAsync(x => x.Id == pokedexNumber, cancellationToken)
                .ConfigureAwait(false);

            if (p is null) return null;

            return new PokemonDetailDto
            {
                PokedexNumber = p.Id,
                Name = p.Name,
                DisplayName = p.DisplayName,
                SpriteUrl = p.SpriteUrl,
                ShinySpriteUrl = p.ShinySpriteUrl,
                BackSpriteUrl = p.BackSpriteUrl,
                ArtworkUrl = p.ArtworkUrl,
                Height = p.Height,
                Weight = p.Weight,
                Types = DeserializeTypes(p.TypesJson),
                Abilities = p.AbilityLinks
                    .OrderBy(l => l.Slot)
                    .Select(l => new PokemonAbilityDto
                    {
                        Name = l.Ability.Name,
                        DisplayName = l.Ability.DisplayName,
                        IsHidden = l.IsHidden,
                        Slot = l.Slot
                    }).ToList(),
                BaseStats = new PokemonBaseStatsDto
                {
                    Hp = p.Hp,
                    Attack = p.Attack,
                    Defense = p.Defense,
                    SpecialAttack = p.SpAttack,
                    SpecialDefense = p.SpDefense,
                    Speed = p.Speed
                }
            };
        });

    public Task<IReadOnlyList<AbilityDto>> GetAbilitiesAsync(CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var abilities = await db.Abilities.AsNoTracking()
                .Include(a => a.PokemonLinks).ThenInclude(l => l.Pokemon)
                .OrderBy(a => a.DisplayName)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            return (IReadOnlyList<AbilityDto>)abilities.Select(a => new AbilityDto
            {
                Id = a.Id,
                Name = a.Name,
                DisplayName = a.DisplayName,
                ShortEffect = a.ShortEffect,
                PokemonNames = a.PokemonLinks
                    .Select(l => l.Pokemon.DisplayName)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
                    .ToList()
            }).ToList();
        });

    public Task<IReadOnlyList<GameItemDto>> GetItemsAsync(CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var items = await db.Items.AsNoTracking().OrderBy(i => i.Id).ToListAsync(cancellationToken).ConfigureAwait(false);
            return (IReadOnlyList<GameItemDto>)items.Select(i => new GameItemDto
            {
                Id = i.Id,
                Name = i.Name,
                DisplayName = i.DisplayName,
                SpriteUrl = i.SpriteUrl,
                Category = i.Category,
                Cost = i.Cost,
                ShortEffect = i.ShortEffect
            }).ToList();
        });

    public Task<IReadOnlyList<MoveCatalogEntryDto>> GetMovesAsync(CancellationToken cancellationToken = default) =>
        WithDbAsync(async db =>
        {
            EnsureReady();
            var moves = await db.Moves.AsNoTracking().OrderBy(m => m.DisplayName).ToListAsync(cancellationToken).ConfigureAwait(false);
            return (IReadOnlyList<MoveCatalogEntryDto>)moves.Select(ToMoveDto).ToList();
        });

    private void EnsureReady()
    {
        if (_seedStatus.IsReady) return;
        throw new InvalidOperationException(
            _seedStatus.HasFailed
                ? $"Catálogo no disponible: {_seedStatus.Message}"
                : $"Catálogo aún sembrándose ({_seedStatus.ProgressPercent:0}%): {_seedStatus.Message}");
    }

    private async Task<T> WithDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await action(db).ConfigureAwait(false);
    }

    private static List<string> DeserializeTypes(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static MoveCatalogEntryDto ToMoveDto(MoveEntity m) => new()
    {
        Name = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
        Type = m.Type,
        Category = m.Category,
        Power = m.Power,
        Accuracy = m.Accuracy,
        StatusChance = m.StatusChance,
        StatusEffect = m.StatusEffect,
        IsFixedDamage = m.IsFixedDamage,
        FixedDamageValue = m.FixedDamageValue
    };
}
