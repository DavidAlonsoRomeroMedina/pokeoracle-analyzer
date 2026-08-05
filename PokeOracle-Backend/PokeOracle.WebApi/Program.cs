using System.Net.Http.Headers;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Infrastructure.Catalog;
using PokeOracle.Infrastructure.Data;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.PokeApi;

var builder = WebApplication.CreateBuilder(args);

// Contenedores (Render/Docker) suelen agotar el límite de inotify; desactivar
// FileSystemWatcher en fuentes JSON evita IOException / exit 139 al arrancar.
foreach (var source in builder.Configuration.Sources.OfType<Microsoft.Extensions.Configuration.Json.JsonConfigurationSource>())
{
    source.ReloadOnChange = false;
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // El cliente trabaja con los enums en texto ("Fire", "Burn").
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SQLite: ruta configurable (en Docker conviene /data/pokeoracle.db con volumen).
var connectionString = builder.Configuration.GetConnectionString("PokeOracle")
    ?? "Data Source=Data/pokeoracle.db";

var sqlitePath = connectionString.Replace("Data Source=", string.Empty, StringComparison.OrdinalIgnoreCase).Trim();
if (!string.IsNullOrWhiteSpace(sqlitePath) && !sqlitePath.StartsWith(':'))
{
    var directory = Path.GetDirectoryName(Path.GetFullPath(sqlitePath));
    if (!string.IsNullOrWhiteSpace(directory))
    {
        Directory.CreateDirectory(directory);
    }
}

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite(connectionString));
builder.Services.AddScoped<IBattleRepository, BattleRepository>();
builder.Services.AddScoped<IDamageCalculator, DamageCalculator>();
builder.Services.AddScoped<ExpectiminimaxService>();

var pokeApiOptions = builder.Configuration
    .GetSection(PokeApiOptions.SectionName)
    .Get<PokeApiOptions>() ?? new PokeApiOptions();

builder.Services.AddSingleton(pokeApiOptions);
builder.Services.AddSingleton<CatalogSeedStatus>();
builder.Services.AddSingleton<ICatalogSeedStatus>(sp => sp.GetRequiredService<CatalogSeedStatus>());

builder.Services.AddHttpClient(PokeApiOptions.HttpClientName, client =>
{
    client.BaseAddress = new Uri(pokeApiOptions.BaseAddress);
    client.Timeout = TimeSpan.FromSeconds(Math.Max(30, pokeApiOptions.RequestTimeoutSeconds));
    client.DefaultRequestHeaders.UserAgent.ParseAdd(pokeApiOptions.UserAgent);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

builder.Services.AddSingleton<PokeApiDownloader>();
// Catálogo runtime: solo SQLite (PokéAPI solo en el HostedService de seeding).
builder.Services.AddSingleton<IPokemonExternalService, SqlitePokemonCatalogService>();
// Respaldo local de movimientos mientras el seeding no ha terminado / para combate.
builder.Services.AddSingleton<ILocalDataCatalog, JsonLocalDataCatalog>();
builder.Services.AddHostedService<PokeApiCatalogSeederHostedService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
