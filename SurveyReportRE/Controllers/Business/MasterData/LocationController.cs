using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class LocationController : BaseControllerApi<Location>
{
    private readonly IBaseRepository<Location> _BaseRepository;
	private readonly IConfiguration configuration;

	public LocationController(IBaseRepository<Location> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

