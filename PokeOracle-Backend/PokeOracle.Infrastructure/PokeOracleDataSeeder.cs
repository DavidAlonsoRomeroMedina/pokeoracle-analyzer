using System.Text.Json;
using PokeOracle.Domain.Entities;
using PokeOracle.Infrastructure.Persistence;

namespace PokeOracle.Infrastructure.Data;

public class PokeOracleDataSeeder
{
    private readonly AppDbContext _context;

    public PokeOracleDataSeeder(AppDbContext context)
    {
        _context = context;
    }

    public void SeedData(string contentRootPath)
    {
        try
        {
            var pokemonJsonPath = Path.Combine(contentRootPath, "pokemon_data.json");
            var movesJsonPath = Path.Combine(contentRootPath, "moves_data.json");

            if (File.Exists(pokemonJsonPath))
            {
                var pokemonData = File.ReadAllText(pokemonJsonPath);
                var species = JsonSerializer.Deserialize<List<PokemonSeedDto>>(pokemonData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                Console.WriteLine($"Seeder: Creado catálogo dinámico de {species?.Count} Pokémon de Kanto.");
            }

            if (File.Exists(movesJsonPath))
            {
                var movesData = File.ReadAllText(movesJsonPath);
                var moves = JsonSerializer.Deserialize<List<Move>>(movesData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                Console.WriteLine($"Seeder: Creado catálogo dinámico de {moves?.Count} Movimientos.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error seeding data: {ex.Message}");
        }
    }
}

public class PokemonSeedDto
{
    public string Name { get; set; } = string.Empty;
    public List<string> Types { get; set; } = new();
    public int HP { get; set; }
    public int Attack { get; set; }
    public int Defense { get; set; }
    public int SpAttack { get; set; }
    public int SpDefense { get; set; }
    public int Speed { get; set; }
}