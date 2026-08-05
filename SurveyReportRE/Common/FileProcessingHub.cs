using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using ERPCore.Models.Migration.Config;
using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Business.HumanResource;
using Dapper;
using Microsoft.Data.SqlClient;

public class FileProcessingHub : Hub
{
    public const string ItExceptionMonitorGroup = "IT-ExceptionMonitor";
    // Kept as initialized compatibility accessors because existing controllers use
    // them to push events outside a Hub instance.
    public static MemoryPresenceStore _store { get; private set; } = new();
    public static IHubContext<FileProcessingHub>? _hubContext { get; private set; }

    private readonly IConfiguration _configuration;
    private readonly IBaseRepository<UsersSession> _userSessionRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly ILogger<FileProcessingHub> _logger;

    public FileProcessingHub(
        IConfiguration configuration,
        IBaseRepository<UsersSession> userSessionRepository,
        IBaseRepository<Employee> employeeRepository,
        MemoryPresenceStore presenceStore,
        IHubContext<FileProcessingHub> hubContext,
        ILogger<FileProcessingHub> logger)
    {
        _configuration = configuration;
        _userSessionRepository = userSessionRepository;
        _employeeRepository = employeeRepository;
        _logger = logger;
        _store = presenceStore;
        _hubContext = hubContext;
    }

    public static void Configure(
        MemoryPresenceStore presenceStore,
        IHubContext<FileProcessingHub> hubContext)
    {
        _store = presenceStore;
        _hubContext = hubContext;
    }

    public override async Task OnConnectedAsync()
    {
        var user = ResolveCurrentUser();
        var authType = Context.User?.Identity?.AuthenticationType ?? "None";
        _store.AddOrUpdate(user, authType, Context.ConnectionId);

        await TryOpenUserSessionAsync(user);
        await TryJoinItExceptionMonitorAsync(user);
        await base.OnConnectedAsync();
        await Clients.All.SendAsync("onlineUsersChanged", _store.GetOnlineUsers());
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _store.Remove(Context.ConnectionId);
        await TryCloseUserSessionAsync();
        await Clients.All.SendAsync("onlineUsersChanged", _store.GetOnlineUsers());
        await base.OnDisconnectedAsync(exception);
    }

    public async Task<List<OnlineUserDto>> GetOnlineUsers()
    {
        var snapshot = _store.GetOnlineUsers().ToList();
        await Clients.Caller.SendAsync("onlineUsersChanged", snapshot);
        return snapshot;
    }

    public Task<string> GetConnectionId()
        => Task.FromResult(Context.ConnectionId);

    private async Task TryJoinItExceptionMonitorAsync(string user)
    {
        try
        {
            bool isSuperUser = ControllerUtil.IsSuperUser(_configuration, user);
            Employee? employee = await _employeeRepository.GetSingleObjectFullInclude(
                item => item.AccountName == user,
                null,
                item => item.SystemRolesFK);
            bool isItRole = string.Equals(
                employee?.SystemRolesFK?.RoleName?.Trim(),
                "IT",
                StringComparison.OrdinalIgnoreCase);

            if (isSuperUser || isItRole)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, ItExceptionMonitorGroup);
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Unable to determine IT error-stream access for {User}.", user);
        }
    }

    public Task NotifyFileProcessingCompleted(int surveyId)
        => Clients.Caller.SendAsync("FileProcessingCompleted", surveyId);

    private string ResolveCurrentUser()
    {
        var user = Context.UserIdentifier ?? Context.User?.Identity?.Name ?? "";
        var domain = _configuration.GetValue<string>("Domain:DCServer") ?? "";
        if (!string.IsNullOrWhiteSpace(domain))
            user = user.Replace(domain, "", StringComparison.OrdinalIgnoreCase);

        return string.IsNullOrWhiteSpace(user) ? "Anonymous" : user.Trim();
    }

    private async Task TryOpenUserSessionAsync(string user)
    {
        if (string.Equals(user, "Anonymous", StringComparison.OrdinalIgnoreCase)) return;

        try
        {
            var httpContext = Context.GetHttpContext();
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString() ?? "";
            var token = "";
            try { token = httpContext?.Session.Id ?? ""; } catch { }

            await _userSessionRepository.InsertData(new UsersSession
            {
                UserName = user,
                IPAddress = httpContext?.Connection.RemoteIpAddress?.ToString() ?? "",
                UserAgent = Limit(userAgent, 1024),
                DeviceInfo = Limit(userAgent, 1024),
                Token = Limit(token, 512),
                LoginTime = DateTime.Now,
                IsActive = true,
                SignalRConnectionId = Context.ConnectionId
            });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Unable to open user session for SignalR connection {ConnectionId}.", Context.ConnectionId);
        }
    }

    private async Task TryCloseUserSessionAsync()
    {
        try
        {
            var session = await _userSessionRepository.GetSingleObject(item =>
                item.SignalRConnectionId == Context.ConnectionId );
            if (session == null) return;

            var logoutTime = DateTime.Now;

            await using var connection = new SqlConnection(_userSessionRepository._connectionString);
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();
            try
            {
                var affected = await connection.ExecuteAsync(@"
                    UPDATE dbo.UsersSession
                    SET IsActive = 0, LogoutTime = @LogoutTime, ModifiedDate = GETDATE()
                    WHERE Id = @Id AND IsActive = 1",
                    new { LogoutTime = logoutTime, session.Id }, transaction);

                if (affected > 0)
                {
                    //await connection.ExecuteAsync(@"
                    //    IF COL_LENGTH(N'dbo.Employee', N'TotalLoginHours') IS NOT NULL
                    //    BEGIN
                    //        ;WITH ValidSessions AS
                    //        (
                    //            SELECT
                    //                Id,
                    //                LoginTime AS SessionStart,
                    //                CASE
                    //                    WHEN COALESCE(LogoutTime, @Now) < LoginTime THEN LoginTime
                    //                    ELSE COALESCE(LogoutTime, @Now)
                    //                END AS SessionEnd
                    //            FROM dbo.UsersSession
                    //            WHERE UserName = @UserName
                    //              AND LoginTime IS NOT NULL
                    //              AND Deleted = 0
                    //        ),
                    //        RunningSessions AS
                    //        (
                    //            SELECT *,
                    //                MAX(SessionEnd) OVER
                    //                (
                    //                    ORDER BY SessionStart, Id
                    //                    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                    //                ) AS PreviousMaxEnd
                    //            FROM ValidSessions
                    //        ),
                    //        SessionGroups AS
                    //        (
                    //            SELECT *,
                    //                SUM(CASE WHEN PreviousMaxEnd IS NULL OR SessionStart > PreviousMaxEnd THEN 1 ELSE 0 END)
                    //                OVER (ORDER BY SessionStart, Id) AS SessionGroup
                    //            FROM RunningSessions
                    //        ),
                    //        MergedSessions AS
                    //        (
                    //            SELECT MIN(SessionStart) AS SessionStart, MAX(SessionEnd) AS SessionEnd
                    //            FROM SessionGroups
                    //            GROUP BY SessionGroup
                    //        ),
                    //        LoginUsage AS
                    //        (
                    //            SELECT CAST(COALESCE(SUM(DATEDIFF_BIG(MILLISECOND, SessionStart, SessionEnd)), 0)
                    //                / 3600000.0 AS DECIMAL(18,4)) AS TotalHours
                    //            FROM MergedSessions
                    //        )
                    //        UPDATE employee
                    //        SET TotalLoginHours = usage.TotalHours,
                    //            ModifiedDate = GETDATE()
                    //        FROM dbo.Employee employee
                    //        CROSS JOIN LoginUsage usage
                    //        WHERE employee.AccountName = @UserName AND employee.Deleted = 0
                    //    END",
                    //    new { Now = logoutTime, session.UserName }, transaction);
                    double totalLoginHours = ((TimeSpan)(logoutTime - session.LoginTime)).TotalHours;
                    await connection.ExecuteAsync(@"UPDATE UsersCache SET TotalLoginHours = @TotalLoginHours WHERE AccountName = @AccountName", new { TotalLoginHours = totalLoginHours, AccountName = session.UserName }, transaction);
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Unable to close user session for SignalR connection {ConnectionId}.", Context.ConnectionId);
        }
    }

    private static string Limit(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}

public record OnlineUserDto(
    string User,
    string AuthType,
    int Connections,
    DateTimeOffset LastSeen,
    string ConnectionId);

public class MemoryPresenceStore
{
    private readonly ConcurrentDictionary<string, PresenceEntry> _byConnection = new();

    public void AddOrUpdate(string user, string authType, string connectionId)
        => _byConnection[connectionId] = new PresenceEntry(
            user,
            authType,
            DateTimeOffset.Now,
            connectionId);

    public void Remove(string connectionId)
        => _byConnection.TryRemove(connectionId, out _);

    public IReadOnlyList<OnlineUserDto> GetOnlineUsers()
    {
        var snapshot = _byConnection.Values.ToList();
        var counts = snapshot
            .GroupBy(item => (item.User, item.AuthType))
            .ToDictionary(group => group.Key, group => group.Count());

        // Return one row per connection so existing notification senders still
        // reach every browser tab, while Connections reflects the true user count.
        return snapshot
            .Select(item => new OnlineUserDto(
                item.User,
                item.AuthType,
                counts[(item.User, item.AuthType)],
                item.LastSeen,
                item.ConnectionId))
            .OrderBy(item => item.User)
            .ThenBy(item => item.ConnectionId)
            .ToList();
    }

    private sealed record PresenceEntry(
        string User,
        string AuthType,
        DateTimeOffset LastSeen,
        string ConnectionId);
}
