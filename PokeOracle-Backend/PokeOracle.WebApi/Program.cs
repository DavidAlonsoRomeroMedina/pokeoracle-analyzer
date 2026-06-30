using Microsoft.EntityFrameworkCore;
using PokeOracle.Application.Interfaces;
using PokeOracle.Application.Services;
using PokeOracle.Infrastructure.Persistence;
using PokeOracle.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("PokeOracleDb"));
builder.Services.AddScoped<IBattleRepository, BattleRepository>();
builder.Services.AddScoped<IDamageCalculator, DamageCalculator>();
builder.Services.AddScoped<ExpectiminimaxService>();
builder.Services.AddScoped<PokeOracleDataSeeder>();

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