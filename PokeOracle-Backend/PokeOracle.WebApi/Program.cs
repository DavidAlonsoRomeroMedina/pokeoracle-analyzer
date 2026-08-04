using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Data;
using PokeOracle.Infrastructure.PokeApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
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
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();