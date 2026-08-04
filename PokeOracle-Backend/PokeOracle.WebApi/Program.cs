using System.Net.Http.Headers;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Data;
using PokeOracle.Infrastructure.PokeApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // El cliente trabaja con los enums en texto ("Fire", "Burn"). Sin esto el
    // modelo se rechaza con 400 al crear una batalla.
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("PokeOracleDb"));
builder.Services.AddScoped<IBattleRepository, BattleRepository>();
builder.Services.AddScoped<IDamageCalculator, DamageCalculator>();
builder.Services.AddScoped<ExpectiminimaxService>();
builder.Services.AddScoped<PokeOracleDataSeeder>();

// --- Catálogo externo de Generación 1 (PokéAPI) ---
var pokeApiOptions = builder.Configuration
    .GetSection(PokeApiOptions.SectionName)
    .Get<PokeApiOptions>() ?? new PokeApiOptions();

builder.Services.AddSingleton(pokeApiOptions);

builder.Services.AddHttpClient(PokeApiOptions.HttpClientName, client =>
{
    client.BaseAddress = new Uri(pokeApiOptions.BaseAddress);
    client.Timeout = TimeSpan.FromSeconds(pokeApiOptions.RequestTimeoutSeconds);
    // PokéAPI responde 403 a clientes que no se identifican.
    client.DefaultRequestHeaders.UserAgent.ParseAdd(pokeApiOptions.UserAgent);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

// Singleton: el catálogo de Kanto es inmutable y se cachea en memoria tras la primera descarga.
builder.Services.AddSingleton<IPokemonExternalService, PokeApiHttpClient>();

// Respaldo local para movimientos y para cuando PokéAPI no responde.
builder.Services.AddSingleton<ILocalDataCatalog, JsonLocalDataCatalog>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Invocar el Seeder al iniciar la WebApi
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<PokeOracleDataSeeder>();
    seeder.SeedData(app.Environment.ContentRootPath);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
// La web app React se sirve desde wwwroot (npm run build:dotnet).
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
// Cualquier ruta que no sea API cae en la SPA.
app.MapFallbackToFile("index.html");

app.Run();