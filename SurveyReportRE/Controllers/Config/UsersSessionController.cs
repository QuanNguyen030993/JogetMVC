using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class UsersSessionController : BaseControllerApi<UsersSession>
{
    private readonly IBaseRepository<UsersSession> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public UsersSessionController(IBaseRepository<UsersSession> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
    }
}

