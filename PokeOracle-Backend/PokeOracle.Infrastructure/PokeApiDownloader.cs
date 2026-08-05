using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace PokeOracle.Infrastructure.PokeApi;

/// <summary>
/// Cliente HTTP de bajo nivel para PokéAPI. Solo lo usa el seeding inicial.
/// </summary>
public sealed class PokeApiDownloader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly PokeApiOptions _options;
    private readonly ILogger<PokeApiDownloader> _logger;

    public PokeApiDownloader(
        IHttpClientFactory httpClientFactory,
        PokeApiOptions options,
        ILogger<PokeApiDownloader> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public Task<T?> GetJsonAsync<T>(string requestUri, CancellationToken cancellationToken)
        where T : class =>
        GetJsonInternalAsync<T>(requestUri, cancellationToken);

    public async Task<List<TResult>> MapWithConcurrencyAsync<TSource, TResult>(
        IReadOnlyList<TSource> sources,
        Func<TSource, CancellationToken, Task<TResult?>> selector,
        CancellationToken cancellationToken)
        where TResult : class
    {
        using var throttle = new SemaphoreSlim(Math.Max(1, _options.MaxConcurrentRequests));

        var tasks = sources.Select(async source =>
        {
            await throttle.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                return await selector(source, cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                throttle.Release();
            }
        });

        var results = await Task.WhenAll(tasks).ConfigureAwait(false);
        return results.Where(r => r is not null).Select(r => r!).ToList();
    }

    private async Task<T?> GetJsonInternalAsync<T>(string requestUri, CancellationToken cancellationToken)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(requestUri))
        {
            return null;
        }

        var maxAttempts = Math.Max(1, _options.MaxAttempts);

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                var client = _httpClientFactory.CreateClient(PokeApiOptions.HttpClientName);
                using var response = await client.GetAsync(requestUri, cancellationToken).ConfigureAwait(false);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                response.EnsureSuccessStatusCode();
                return await response.Content
                    .ReadFromJsonAsync<T>(JsonOptions, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (attempt < maxAttempts && IsTransient(ex) && !cancellationToken.IsCancellationRequested)
            {
                var delay = TimeSpan.FromMilliseconds(_options.RetryBaseDelayMilliseconds * Math.Pow(2, attempt - 1));
                _logger.LogWarning(
                    "PokéAPI: fallo al pedir {RequestUri} (intento {Attempt}/{MaxAttempts}): {Message}. Reintento en {Delay}ms.",
                    requestUri, attempt, maxAttempts, ex.Message, delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
            }
        }
    }

    private static bool IsTransient(Exception exception) =>
        exception is HttpRequestException or TaskCanceledException or JsonException;
}
