using Dapper;
using Microsoft.Data.SqlClient;

namespace ERPCore.Common;

public sealed record SystemWriteSettings(bool HttpAuditRequest, bool ErrorClientLog, bool SignalR);

public static class SystemWriteControl
{
    public const string HttpAuditRequestKey = "HttpAuditRequest";
    public const string ErrorClientLogKey = "ErrorClientLog";
    public const string SignalRKey = "SignalR";

    private static readonly SemaphoreSlim RefreshLock = new(1, 1);
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(10);
    private static SystemWriteSettings _cached = new(false, true, true);
    private static DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public static async Task<SystemWriteSettings> GetAsync(string connectionString)
    {
        if (DateTimeOffset.UtcNow < _expiresAt) return _cached;

        await RefreshLock.WaitAsync();
        try
        {
            if (DateTimeOffset.UtcNow < _expiresAt) return _cached;

            await using var connection = new SqlConnection(connectionString);
            var rows = await connection.QueryAsync<ControlRow>(@"
                SELECT ParameterName, [Value]
                FROM dbo.Constant WITH (NOLOCK)
                WHERE Deleted = 0
                  AND ParameterName IN
                  (
                      N'HttpAuditRequest', N'HttpRequestAuditLog',
                      N'ErrorClientLog', N'SignalR'
                  )
                ORDER BY Id DESC");

            var values = rows
                .GroupBy(row => row.ParameterName, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First().Value, StringComparer.OrdinalIgnoreCase);

            var legacyAuditDefault = ReadBoolean(values, "HttpRequestAuditLog", false);
            _cached = new SystemWriteSettings(
                ReadBoolean(values, HttpAuditRequestKey, legacyAuditDefault),
                ReadBoolean(values, ErrorClientLogKey, true),
                ReadBoolean(values, SignalRKey, true));
            _expiresAt = DateTimeOffset.UtcNow.Add(CacheDuration);
            return _cached;
        }
        catch
        {
            _expiresAt = DateTimeOffset.UtcNow.Add(CacheDuration);
            return _cached;
        }
        finally
        {
            RefreshLock.Release();
        }
    }

    public static void Invalidate() => _expiresAt = DateTimeOffset.MinValue;

    private static bool ReadBoolean(IReadOnlyDictionary<string, string> values, string key, bool defaultValue)
    {
        if (!values.TryGetValue(key, out var rawValue)) return defaultValue;
        if (bool.TryParse(rawValue, out var value)) return value;
        return rawValue.Trim().ToLowerInvariant() switch
        {
            "1" or "yes" or "on" or "enabled" => true,
            "0" or "no" or "off" or "disabled" => false,
            _ => defaultValue
        };
    }

    private sealed class ControlRow
    {
        public string ParameterName { get; init; } = "";
        public string Value { get; init; } = "";
    }
}
