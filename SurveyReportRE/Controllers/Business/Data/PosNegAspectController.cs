using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class PosNegAspectController : BaseControllerApi<PosNegAspect>
{
    private readonly IBaseRepository<PosNegAspect> _BaseRepository;
    private readonly IConfiguration configuration;

    public PosNegAspectController(IBaseRepository<PosNegAspect> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

