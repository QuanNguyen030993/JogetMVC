using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class OccupancyDetailController : BaseControllerApi<OccupancyDetail>
{
    private readonly IBaseRepository<OccupancyDetail> _BaseRepository;
    private readonly IConfiguration configuration;

    public OccupancyDetailController(IBaseRepository<OccupancyDetail> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

