using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Request;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Text.Json;

[ApiController]
[Route("api/[controller]/[action]")]
public class UsersCacheController : BaseControllerApi<UsersCache>
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> UserLocks =
        new(StringComparer.OrdinalIgnoreCase);

    public sealed class SaveUserPreferenceRequest
    {
        public string Key { get; set; } = "";
        public JsonElement Value { get; set; }
    }

    private readonly IBaseRepository<UsersCache> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public UsersCacheController(IBaseRepository<UsersCache> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpPost]
    public async Task<IActionResult> TrackUserCache([FromBody] string cacheData)
    {
        string userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name ?? "Anonymous";
        var userLock = UserLocks.GetOrAdd(userName, _ => new SemaphoreSlim(1, 1));
        await userLock.WaitAsync();
        try
        {
            UsersCache usersCache = await _BaseRepository.GetSingleObject(s => s.AccountName == userName);
            var incomingPayload = ParsePayload(cacheData);

            if (usersCache != null)
            {
                var existingPayload = ParsePayload(usersCache.UsersCachePayLoad);
                if (existingPayload["Preferences"] != null && incomingPayload["Preferences"] == null)
                {
                    incomingPayload["Preferences"] = existingPayload["Preferences"]!.DeepClone();
                }
                usersCache.AccountName = userName;
                usersCache.UsersCachePayLoad = incomingPayload.ToString(Formatting.None);
                await _BaseRepository.UpdateData(usersCache, JsonConvert.SerializeObject(usersCache), usersCache.Id, "Id");
            }
            else
            {
                usersCache = new UsersCache
                {
                    AccountName = userName,
                    UsersCachePayLoad = incomingPayload.ToString(Formatting.None)
                };
                await _BaseRepository.InsertData(usersCache);
            }
            return Ok(usersCache);
        }
        finally
        {
            userLock.Release();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetUserPreferences()
    {
        var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name ?? "Anonymous";
        var usersCache = await _BaseRepository.GetSingleObject(item => item.AccountName == userName);
        var payload = ParsePayload(usersCache?.UsersCachePayLoad);
        return Content(
            JsonConvert.SerializeObject(new
            {
                success = true,
                data = payload["Preferences"] as JObject ?? new JObject()
            }),
            "application/json");
    }

    [HttpPost]
    public async Task<IActionResult> SaveUserPreference([FromBody] SaveUserPreferenceRequest request)
    {
        var key = (request?.Key ?? "").Trim();
        if (string.IsNullOrWhiteSpace(key) || key.Length > 250)
        {
            return BadRequest(new { success = false, message = "A valid preference key is required." });
        }

        var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name ?? "Anonymous";
        var userLock = UserLocks.GetOrAdd(userName, _ => new SemaphoreSlim(1, 1));
        await userLock.WaitAsync();
        try
        {
            var usersCache = await _BaseRepository.GetSingleObject(item => item.AccountName == userName);
            var payload = ParsePayload(usersCache?.UsersCachePayLoad);
            var preferences = payload["Preferences"] as JObject ?? new JObject();
            payload["Preferences"] = preferences;
            preferences[key] = request.Value.ValueKind == JsonValueKind.Undefined
                ? JValue.CreateNull()
                : JToken.Parse(request.Value.GetRawText());

            if (usersCache == null)
            {
                usersCache = new UsersCache
                {
                    AccountName = userName,
                    UsersCachePayLoad = payload.ToString(Formatting.None)
                };
                await _BaseRepository.InsertData(usersCache);
            }
            else
            {
                usersCache.UsersCachePayLoad = payload.ToString(Formatting.None);
                await _BaseRepository.UpdateData(usersCache, JsonConvert.SerializeObject(usersCache), usersCache.Id, "Id");
            }

            return Ok(new { success = true, key });
        }
        finally
        {
            userLock.Release();
        }
    }

    private static JObject ParsePayload(string? rawPayload)
    {
        if (string.IsNullOrWhiteSpace(rawPayload)) return new JObject();
        try
        {
            JToken token = JToken.Parse(rawPayload);
            for (var index = 0; index < 2 && token.Type == JTokenType.String; index++)
            {
                var nested = token.Value<string>();
                if (string.IsNullOrWhiteSpace(nested)) break;
                token = JToken.Parse(nested);
            }
            return token as JObject ?? new JObject();
        }
        catch
        {
            return new JObject();
        }
    }

    [HttpPost]
    public async Task<IActionResult> ForceCacheUpdateFinish([FromBody] UsersCache usersCache)
    {
        usersCache.ForceReloadCache = false;
        usersCache.ReloadCacheTime = DateTime.Now;
        await _BaseRepository.UpdateData(usersCache, JsonConvert.SerializeObject(usersCache), usersCache.Id, "Id");
        return Ok();
    }
    [HttpPost]
    public async Task<IActionResult> ForcePageUpdateFinish([FromBody] UsersCache usersCache)
    {
        usersCache.ForceReloadPage = false;
        usersCache.ReloadPageTime = DateTime.Now;
        await _BaseRepository.UpdateData(usersCache, JsonConvert.SerializeObject(usersCache), usersCache.Id, "Id");
        return Ok();
    }
}

