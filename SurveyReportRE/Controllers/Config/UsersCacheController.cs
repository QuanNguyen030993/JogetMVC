using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Config;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class UsersCacheController : BaseControllerApi<UsersCache>
{
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
        UsersCache usersCache = new UsersCache();
        string userName = _httpContextAccessor.HttpContext.User.Identity.Name;
        usersCache = await _BaseRepository.GetSingleObject(s => s.AccountName == userName);
        dynamic cacheObject = JsonConvert.DeserializeObject<dynamic>(cacheData);

        if (usersCache != null)
        {
            usersCache.AccountName = userName;
            usersCache.UsersCachePayLoad = cacheData;
            await _BaseRepository.UpdateData(usersCache, JsonConvert.SerializeObject(usersCache), usersCache.Id, "Id");
        }
        else
        {
            usersCache = new UsersCache();
            usersCache.AccountName = userName;
            usersCache.UsersCachePayLoad = cacheData;
            await _BaseRepository.InsertData(usersCache);
        }
        return Ok(usersCache);
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

