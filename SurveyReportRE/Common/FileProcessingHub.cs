using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using ERPCore.Models.Migration.Config;

public class FileProcessingHub : Hub
{
    public static MemoryPresenceStore _store;

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly IBaseRepository<UsersSession> _userSessionRepository;

    public FileProcessingHub(
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        IBaseRepository<UsersSession> userSessionRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _userSessionRepository = userSessionRepository;
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_store == null)
            _store = new MemoryPresenceStore();
        if (_store != null)
            _store.Remove(Context.ConnectionId);
        await Clients.All.SendAsync("onlineUsersChanged", _store.GetOnlineUsers());
        await base.OnDisconnectedAsync(exception);
    }

    // Client có thể gọi để lấy snapshot ngay khi vào trang
    public Task<List<OnlineUserDto>> GetOnlineUsers()
    {
        if (_store == null)
            _store = new MemoryPresenceStore();
        Clients.All.SendAsync("onlineUsersChanged", _store.GetOnlineUsers().ToList());
        return Task.FromResult(_store.GetOnlineUsers().ToList());
    }
    public async Task NotifyFileProcessingCompleted(int surveyId)
    {
        await Clients.Caller.SendAsync("FileProcessingCompleted", surveyId);
    }
    public string GetConnectionId()
    {
        if (_store == null)
            _store = new MemoryPresenceStore();
        var user = Context.User?.Identity?.Name ?? "Anonymous";
        var authType = Context.User?.Identity?.AuthenticationType ?? "None";

        _store.AddOrUpdate(user, authType, Context.ConnectionId);

        // push list online cho tất cả client
        Clients.All.SendAsync("onlineUsersChanged", _store.GetOnlineUsers());

        IBaseRepository<UsersSession> _userSessionRepository = new BaseRepository<UsersSession>(_configuration, _httpContextAccessor);
        UsersSession usersSession = new UsersSession();
        usersSession.UserName = user;
        usersSession.IPAddress = "";
        usersSession.UserAgent = "";
        usersSession.DeviceInfo = "";
        usersSession.Token = "";
        usersSession.LoginTime = DateTime.Now;
        usersSession.IsActive = true;
        usersSession.SignalRConnectionId = Context.ConnectionId.ToString();
        _userSessionRepository.InsertData(usersSession);

        return Context.ConnectionId;
    }
}

public record OnlineUserDto(string User, string AuthType, int Connections, DateTimeOffset LastSeen, string ConnectionId);

public class MemoryPresenceStore //: IPresenceStore
{
    private readonly ConcurrentDictionary<string, (string User, string AuthType, DateTimeOffset LastSeen, string ConnectionId)> _byConn = new();

    public void AddOrUpdate(string user, string authType, string connId)
        => _byConn[connId] = (user, authType, DateTimeOffset.Now, connId);

    public void Remove(string connId)
        => _byConn.TryRemove(connId, out _);

    public IReadOnlyList<OnlineUserDto> GetOnlineUsers()
    {
        return _byConn.Values
            .GroupBy(x => (x.User, x.AuthType, x.ConnectionId))
            .Select(g => new OnlineUserDto(
                g.Key.User,
                g.Key.AuthType,
                g.Count(),
                g.Max(x => x.LastSeen),
                g.Key.ConnectionId)
            )
            .OrderBy(x => x.User)
            .ToList();
    }
}
