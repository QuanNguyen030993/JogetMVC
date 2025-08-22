using Serilog.Core;
using Serilog.Events;
using Microsoft.AspNetCore.Http;

public class UserIdEnricher : ILogEventEnricher
{
    public readonly IHttpContextAccessor _httpContextAccessor;

    public UserIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var userId = _httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "anonymous";
        var userProp = propertyFactory.CreateProperty("UserId", userId);
        logEvent.AddOrUpdateProperty(userProp);
    }
}