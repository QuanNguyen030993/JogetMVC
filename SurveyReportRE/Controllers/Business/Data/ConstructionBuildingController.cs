using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class ConstructionBuildingController : BaseControllerApi<ConstructionBuilding>
{
    private readonly IBaseRepository<ConstructionBuilding> _BaseRepository;
    private readonly IConfiguration configuration;

    public ConstructionBuildingController(IBaseRepository<ConstructionBuilding> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

