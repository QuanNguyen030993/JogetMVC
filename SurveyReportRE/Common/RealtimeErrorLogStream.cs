using System.Threading.Channels;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Serilog.Core;
using Serilog.Events;

public sealed record RealtimeErrorLogAlert(
    string Id,
    string Level,
    string Message,
    string Source,
    string TraceId,
    string ExceptionType,
    DateTimeOffset OccurredAt,
    RealtimeErrorLogDetail Detail);

public sealed record RealtimeErrorLogDetail(
    string Id,
    string Level,
    string Message,
    string MessageTemplate,
    string Source,
    string TraceId,
    string Exception,
    string Properties,
    DateTimeOffset OccurredAt);

/// <summary>
/// Non-blocking Serilog sink for the small IT-only SignalR error stream.
/// Detailed exception data remains in the normal Serilog sinks; this queue only
/// carries a short notice suitable for an on-screen alert.
/// </summary>
public sealed class RealtimeErrorLogSink : ILogEventSink
{
    private static readonly TimeSpan DetailLifetime = TimeSpan.FromMinutes(30);
    private static readonly ConcurrentDictionary<string, CachedErrorDetail> Details = new();
    private static readonly Channel<RealtimeErrorLogAlert> Alerts = Channel.CreateBounded<RealtimeErrorLogAlert>(
        new BoundedChannelOptions(200)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

    public void Emit(LogEvent logEvent)
    {
        if (logEvent.Level < LogEventLevel.Error) return;

        try
        {
            string id = Guid.NewGuid().ToString("N");
            string source = Limit(ReadProperty(logEvent, "SourceContext"), 160);
            string traceId = Limit(ReadFirstProperty(logEvent, "TraceId", "TraceIdentifier", "RequestId"), 120);
            var detail = new RealtimeErrorLogDetail(
                id,
                logEvent.Level.ToString(),
                Limit(logEvent.RenderMessage(), 4000),
                Limit(logEvent.MessageTemplate.Text, 4000),
                source,
                traceId,
                Limit(logEvent.Exception?.ToString() ?? "", 24000),
                Limit(string.Join(Environment.NewLine, logEvent.Properties.Select(item => $"{item.Key}: {item.Value}")), 12000),
                logEvent.Timestamp);
            Details[id] = new CachedErrorDetail(
                detail,
                DateTimeOffset.UtcNow.Add(DetailLifetime));
            RemoveExpiredDetails();

            Alerts.Writer.TryWrite(new RealtimeErrorLogAlert(
                id,
                logEvent.Level.ToString(),
                Limit(logEvent.RenderMessage(), 420),
                source,
                traceId,
                Limit(logEvent.Exception?.GetType().Name ?? "", 120),
                logEvent.Timestamp,
                detail));
        }
        catch
        {
            // A diagnostic sink must never interrupt the application or write a
            // Serilog event recursively from inside Emit.
        }
    }

    public static IAsyncEnumerable<RealtimeErrorLogAlert> ReadAllAsync(CancellationToken cancellationToken)
        => Alerts.Reader.ReadAllAsync(cancellationToken);

    public static bool TryGetDetail(string id, out RealtimeErrorLogDetail? detail)
    {
        detail = null;
        if (string.IsNullOrWhiteSpace(id) || !Details.TryGetValue(id, out CachedErrorDetail? cached)) return false;
        if (cached.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            Details.TryRemove(id, out _);
            return false;
        }

        detail = cached.Detail;
        return true;
    }

    private static void RemoveExpiredDetails()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        foreach ((string id, CachedErrorDetail cached) in Details)
        {
            if (cached.ExpiresAt <= now) Details.TryRemove(id, out _);
        }

        const int maxCachedDetails = 500;
        int overflow = Details.Count - maxCachedDetails;
        if (overflow <= 0) return;
        foreach (string id in Details
            .OrderBy(item => item.Value.ExpiresAt)
            .Take(overflow)
            .Select(item => item.Key))
        {
            Details.TryRemove(id, out _);
        }
    }

    private static string ReadFirstProperty(LogEvent logEvent, params string[] names)
    {
        foreach (string name in names)
        {
            string value = ReadProperty(logEvent, name);
            if (!string.IsNullOrWhiteSpace(value)) return value;
        }
        return "";
    }

    private static string ReadProperty(LogEvent logEvent, string name)
        => logEvent.Properties.TryGetValue(name, out LogEventPropertyValue? value)
            ? value.ToString().Trim('"')
            : "";

    private static string Limit(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength] + "…";

    private sealed record CachedErrorDetail(RealtimeErrorLogDetail Detail, DateTimeOffset ExpiresAt);
}

public sealed class RealtimeErrorLogBroadcastService : BackgroundService
{
    private readonly IHubContext<FileProcessingHub> _hubContext;

    public RealtimeErrorLogBroadcastService(IHubContext<FileProcessingHub> hubContext)
    {
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (RealtimeErrorLogAlert alert in RealtimeErrorLogSink.ReadAllAsync(stoppingToken))
        {
            try
            {
                await _hubContext.Clients
                    .Group(FileProcessingHub.ItExceptionMonitorGroup)
                    .SendAsync("R_ServerLogAlert", alert, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                // Do not log here: logging an Error from the broadcaster would feed
                // the same stream and could create an infinite notification loop.
            }
        }
    }
}
