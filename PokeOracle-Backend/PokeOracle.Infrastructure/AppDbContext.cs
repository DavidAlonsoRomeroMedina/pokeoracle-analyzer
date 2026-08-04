<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<BattleState> BattleStates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BattleState>().HasKey(b => b.SessionId);
        modelBuilder.Entity<BattleState>().Ignore(b => b.PlayerParty);
        modelBuilder.Entity<BattleState>().Ignore(b => b.RivalParty);

        base.OnModelCreating(modelBuilder);
    }
=======
using Microsoft.EntityFrameworkCore;
using PokeOracle.Domain.Entities;

namespace PokeOracle.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<BattleState> BattleStates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BattleState>().HasKey(b => b.SessionId);
        modelBuilder.Entity<BattleState>().Ignore(b => b.PlayerParty);
        modelBuilder.Entity<BattleState>().Ignore(b => b.RivalParty);

        base.OnModelCreating(modelBuilder);
    }
>>>>>>> 063c35bd5ca941119c2db745bf84c16baf9ff108
}