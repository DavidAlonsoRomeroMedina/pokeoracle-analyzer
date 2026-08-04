using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using PokeOracle.Infrastructure.PokeApi;

namespace PokeOracle.Tests;

/// <summary>
/// Cubre el mapeo del JSON de PokéAPI y las restricciones de Generación 1 sin
/// tocar la red: las respuestas se sirven desde un handler falso.
/// </summary>
public class PokeApiHttpClientTests
{
    [Theory]
    [InlineData(1, true)]
    [InlineData(151, true)]
    [InlineData(75, true)]
    [InlineData(0, false)]
    [InlineData(-3, false)]
    [InlineData(152, false)]
    [InlineData(251, false)]
    public void IsGenerationOne_SoloAceptaKanto(int pokedexNumber, bool expected)
    {
        Assert.Equal(expected, PokeApiHttpClient.IsGenerationOne(pokedexNumber));
    }

    [Fact]
    public async Task GetPokemonAsync_FueraDeKanto_DevuelveNullSinLlamarALaApi()
    {
        var handler = new StubHandler();
        var client = CreateClient(handler);

        var result = await client.GetPokemonAsync(152);

        Assert.Null(result);
        Assert.Empty(handler.RequestedPaths);
    }

    [Fact]
    public async Task GetGenerationOnePokemonAsync_ExtraeSpritesYTipos()
    {
        var client = CreateClient(new StubHandler());

        var pokemon = await client.GetGenerationOnePokemonAsync();

        var bulbasaur = Assert.Single(pokemon, p => p.PokedexNumber == 1);
        Assert.Equal("bulbasaur", bulbasaur.Name);
        Assert.Equal("Bulbasaur", bulbasaur.DisplayName);
        Assert.Equal("https://sprites.test/1.png", bulbasaur.SpriteUrl);
        Assert.Equal("https://sprites.test/artwork/1.png", bulbasaur.ArtworkUrl);
        Assert.Equal(new[] { "Grass", "Poison" }, bulbasaur.Types);
    }

    [Fact]
    public async Task GetPokemonAsync_MapeaEstadisticasBaseYHabilidades()
    {
        var client = CreateClient(new StubHandler());

        var charmander = await client.GetPokemonAsync(4);

        Assert.NotNull(charmander);
        Assert.Equal("Charmander", charmander!.DisplayName);
        Assert.Equal("https://sprites.test/shiny/4.png", charmander.ShinySpriteUrl);

        Assert.Equal(39, charmander.BaseStats.Hp);
        Assert.Equal(52, charmander.BaseStats.Attack);
        Assert.Equal(60, charmander.BaseStats.SpecialAttack);
        Assert.Equal(65, charmander.BaseStats.Speed);

        Assert.Collection(charmander.Abilities,
            first =>
            {
                Assert.Equal("blaze", first.Name);
                Assert.False(first.IsHidden);
            },
            second =>
            {
                Assert.Equal("solar-power", second.Name);
                Assert.Equal("Solar Power", second.DisplayName);
                Assert.True(second.IsHidden);
            });
    }

    [Fact]
    public async Task GetGenerationOneAbilitiesAsync_AgrupaSinDuplicarYPrefiereNombreEnEspanol()
    {
        var client = CreateClient(new StubHandler());

        var abilities = await client.GetGenerationOneAbilitiesAsync();

        // "overgrow" y "blaze" comparten el patrón, pero cada habilidad debe aparecer una sola vez.
        Assert.Equal(abilities.Select(a => a.Name).Distinct().Count(), abilities.Count);

        var overgrow = Assert.Single(abilities, a => a.Name == "overgrow");
        Assert.Equal("Espesura", overgrow.DisplayName);
        Assert.Equal("Potencia los movimientos de tipo Planta.", overgrow.ShortEffect);
        Assert.Equal(new[] { "Bulbasaur" }, overgrow.PokemonNames);

        // Sin traducción al español se cae al slug legible en inglés.
        var solarPower = Assert.Single(abilities, a => a.Name == "solar-power");
        Assert.Equal("Solar Power", solarPower.DisplayName);
    }

    [Fact]
    public async Task GetGenerationOneItemsAsync_FiltraPorGameIndicesNoPorRangoDeId()
    {
        var handler = new StubHandler();
        var client = CreateClient(handler, options => options.ItemScanLimit = 3);

        var items = await client.GetGenerationOneItemsAsync();

        // El id 2 es de Generación 3 aunque esté entre dos objetos de Generación 1:
        // filtrar por rango de id daría un resultado incorrecto.
        Assert.Equal(new[] { 1, 3 }, items.Select(i => i.Id));

        var masterBall = items.First();
        Assert.Equal("Master Ball", masterBall.DisplayName);
        Assert.Equal("https://sprites.test/items/master-ball.png", masterBall.SpriteUrl);
        Assert.Equal("standard-balls", masterBall.Category);

        // PokéAPI omite "cost" en algunos objetos, así que debe quedar nulo y no en cero.
        var potion = items.Last();
        Assert.Equal("Poción", potion.DisplayName);
        Assert.Null(potion.Cost);
    }

    [Fact]
    public async Task GetGenerationOnePokemonAsync_DescargaUnaSolaVez()
    {
        var handler = new StubHandler();
        var client = CreateClient(handler);

        await client.GetGenerationOnePokemonAsync();
        var afterFirstCall = handler.RequestedPaths.Count;

        await client.GetGenerationOnePokemonAsync();
        await client.GetPokemonAsync(1);

        Assert.Equal(afterFirstCall, handler.RequestedPaths.Count);
    }

    private static PokeApiHttpClient CreateClient(StubHandler handler, Action<PokeApiOptions>? configure = null)
    {
        var options = new PokeApiOptions { BaseAddress = "https://pokeapi.test/api/v2/" };
        configure?.Invoke(options);

        return new PokeApiHttpClient(
            new StubHttpClientFactory(handler, options.BaseAddress),
            options,
            NullLogger<PokeApiHttpClient>.Instance);
    }

    private sealed class StubHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;
        private readonly string _baseAddress;

        public StubHttpClientFactory(HttpMessageHandler handler, string baseAddress)
        {
            _handler = handler;
            _baseAddress = baseAddress;
        }

        public HttpClient CreateClient(string name) =>
            new(_handler, disposeHandler: false) { BaseAddress = new Uri(_baseAddress) };
    }

    /// <summary>Sirve un recorte del catálogo real de PokéAPI y registra lo que se pide.</summary>
    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Lock _sync = new();

        public List<string> RequestedPaths { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.AbsolutePath.TrimEnd('/');
            var query = request.RequestUri.Query;

            lock (_sync)
            {
                RequestedPaths.Add(path + query);
            }

            var json = Payloads.TryGetValue(path, out var body) ? body : null;

            var response = json is null
                ? new HttpResponseMessage(HttpStatusCode.NotFound)
                : new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };

            return Task.FromResult(response);
        }

        private static readonly Dictionary<string, string> Payloads = new()
        {
            ["/api/v2/pokemon"] = """
            {
              "count": 2,
              "results": [
                { "name": "bulbasaur",  "url": "https://pokeapi.test/api/v2/pokemon/1/" },
                { "name": "charmander", "url": "https://pokeapi.test/api/v2/pokemon/4/" }
              ]
            }
            """,

            ["/api/v2/pokemon/1"] = """
            {
              "id": 1,
              "name": "bulbasaur",
              "height": 7,
              "weight": 69,
              "sprites": {
                "front_default": "https://sprites.test/1.png",
                "front_shiny": "https://sprites.test/shiny/1.png",
                "back_default": "https://sprites.test/back/1.png",
                "other": { "official-artwork": { "front_default": "https://sprites.test/artwork/1.png" } }
              },
              "types": [
                { "slot": 2, "type": { "name": "poison" } },
                { "slot": 1, "type": { "name": "grass" } }
              ],
              "abilities": [
                { "slot": 1, "is_hidden": false, "ability": { "name": "overgrow" } }
              ],
              "stats": [
                { "base_stat": 45, "stat": { "name": "hp" } },
                { "base_stat": 49, "stat": { "name": "attack" } },
                { "base_stat": 49, "stat": { "name": "defense" } },
                { "base_stat": 65, "stat": { "name": "special-attack" } },
                { "base_stat": 65, "stat": { "name": "special-defense" } },
                { "base_stat": 45, "stat": { "name": "speed" } }
              ]
            }
            """,

            ["/api/v2/pokemon/4"] = """
            {
              "id": 4,
              "name": "charmander",
              "height": 6,
              "weight": 85,
              "sprites": {
                "front_default": "https://sprites.test/4.png",
                "front_shiny": "https://sprites.test/shiny/4.png",
                "other": { "official-artwork": { "front_default": "https://sprites.test/artwork/4.png" } }
              },
              "types": [ { "slot": 1, "type": { "name": "fire" } } ],
              "abilities": [
                { "slot": 1, "is_hidden": false, "ability": { "name": "blaze" } },
                { "slot": 3, "is_hidden": true,  "ability": { "name": "solar-power" } }
              ],
              "stats": [
                { "base_stat": 39, "stat": { "name": "hp" } },
                { "base_stat": 52, "stat": { "name": "attack" } },
                { "base_stat": 43, "stat": { "name": "defense" } },
                { "base_stat": 60, "stat": { "name": "special-attack" } },
                { "base_stat": 50, "stat": { "name": "special-defense" } },
                { "base_stat": 65, "stat": { "name": "speed" } }
              ]
            }
            """,

            ["/api/v2/ability/overgrow"] = """
            {
              "id": 65,
              "name": "overgrow",
              "names": [
                { "name": "Espesura", "language": { "name": "es" } },
                { "name": "Overgrow", "language": { "name": "en" } }
              ],
              "effect_entries": [
                { "short_effect": "Potencia los movimientos de tipo Planta.", "language": { "name": "en" } }
              ]
            }
            """,

            ["/api/v2/ability/blaze"] = """
            {
              "id": 66,
              "name": "blaze",
              "names": [ { "name": "Mar Llamas", "language": { "name": "es" } } ],
              "effect_entries": [ { "short_effect": "Potencia los movimientos de tipo Fuego.", "language": { "name": "en" } } ]
            }
            """,

            // Sin entrada en español: debe caer al nombre legible derivado del slug.
            ["/api/v2/ability/solar-power"] = """
            {
              "id": 94,
              "name": "solar-power",
              "names": [ { "name": "Poder Solar", "language": { "name": "fr" } } ],
              "effect_entries": [ { "short_effect": "Sube el ataque especial con sol.", "language": { "name": "en" } } ]
            }
            """,

            ["/api/v2/item/1"] = """
            {
              "id": 1,
              "name": "master-ball",
              "cost": 0,
              "category": { "name": "standard-balls" },
              "sprites": { "default": "https://sprites.test/items/master-ball.png" },
              "names": [ { "name": "Master Ball", "language": { "name": "es" } } ],
              "effect_entries": [ { "short_effect": "Atrapa siempre.", "language": { "name": "en" } } ],
              "game_indices": [ { "generation": { "name": "generation-i" } } ]
            }
            """,

            // Generación 3 intercalada entre dos objetos de Generación 1.
            ["/api/v2/item/2"] = """
            {
              "id": 2,
              "name": "dive-ball",
              "cost": 1000,
              "category": { "name": "standard-balls" },
              "sprites": { "default": "https://sprites.test/items/dive-ball.png" },
              "names": [ { "name": "Buceo Ball", "language": { "name": "es" } } ],
              "game_indices": [ { "generation": { "name": "generation-iii" } } ]
            }
            """,

            // Sin "cost": PokéAPI lo omite en algunos objetos.
            ["/api/v2/item/3"] = """
            {
              "id": 3,
              "name": "potion",
              "category": { "name": "healing" },
              "sprites": { "default": "https://sprites.test/items/potion.png" },
              "names": [ { "name": "Poción", "language": { "name": "es" } } ],
              "effect_entries": [ { "short_effect": "Restores 20 HP.", "language": { "name": "en" } } ],
              "game_indices": [ { "generation": { "name": "generation-i" } }, { "generation": { "name": "generation-ii" } } ]
            }
            """
        };
    }
}
