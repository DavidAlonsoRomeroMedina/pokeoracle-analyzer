using PokeOracle.Application.Interfaces;

namespace PokeOracle.Tests;

public class CatalogSeedStatusTests
{
    [Fact]
    public void ProgressPercent_CalculaSobreElObjetivo()
    {
        var status = new CatalogSeedStatus();
        status.MarkRunning(1025, "start");
        status.ReportProgress(205, "mid");

        Assert.False(status.IsReady);
        Assert.True(status.IsRunning);
        Assert.Equal(205, status.PokemonLoaded);
        Assert.InRange(status.ProgressPercent, 19.9, 20.1);
    }

    [Fact]
    public void MarkReady_MarcaElCatalogoComoServible()
    {
        var status = new CatalogSeedStatus();
        status.MarkRunning(1025, "start");
        status.MarkReady(1025, "done");

        Assert.True(status.IsReady);
        Assert.False(status.IsRunning);
        Assert.False(status.HasFailed);
        Assert.Equal("done", status.Message);
    }

    [Fact]
    public void MarkFailed_NoDejaElCatalogoListo()
    {
        var status = new CatalogSeedStatus();
        status.MarkRunning(10, "start");
        status.MarkFailed("boom");

        Assert.False(status.IsReady);
        Assert.True(status.HasFailed);
        Assert.Contains("boom", status.Message);
    }
}
