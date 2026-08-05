using Microsoft.EntityFrameworkCore;
using PokeOracle.Domain.Entities;
using PokeOracle.Infrastructure.Persistence.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<BattleState> BattleStates => Set<BattleState>();
    public DbSet<PokemonEntity> Pokemon => Set<PokemonEntity>();
    public DbSet<AbilityEntity> Abilities => Set<AbilityEntity>();
    public DbSet<PokemonAbilityLink> PokemonAbilities => Set<PokemonAbilityLink>();
    public DbSet<MoveEntity> Moves => Set<MoveEntity>();
    public DbSet<ItemEntity> Items => Set<ItemEntity>();
    public DbSet<CatalogMetaEntity> CatalogMeta => Set<CatalogMetaEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BattleState>().HasKey(b => b.SessionId);
        modelBuilder.Entity<BattleState>().Ignore(b => b.PlayerParty);
        modelBuilder.Entity<BattleState>().Ignore(b => b.RivalParty);

        modelBuilder.Entity<PokemonEntity>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).HasMaxLength(64).IsRequired();
            e.Property(p => p.DisplayName).HasMaxLength(128).IsRequired();
            e.HasIndex(p => p.Name);
        });

        modelBuilder.Entity<AbilityEntity>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Name).HasMaxLength(64).IsRequired();
            e.HasIndex(a => a.Name).IsUnique();
        });

        modelBuilder.Entity<PokemonAbilityLink>(e =>
        {
            e.HasKey(x => new { x.PokemonId, x.AbilityId, x.Slot });
            e.HasOne(x => x.Pokemon).WithMany(p => p.AbilityLinks).HasForeignKey(x => x.PokemonId);
            e.HasOne(x => x.Ability).WithMany(a => a.PokemonLinks).HasForeignKey(x => x.AbilityId);
        });

        modelBuilder.Entity<MoveEntity>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Name).HasMaxLength(64).IsRequired();
            e.HasIndex(m => m.Name);
        });

        modelBuilder.Entity<ItemEntity>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Name).HasMaxLength(64).IsRequired();
            e.HasIndex(i => i.Name);
        });

        modelBuilder.Entity<CatalogMetaEntity>().HasKey(m => m.Id);

        base.OnModelCreating(modelBuilder);
    }
}
