using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class OutlineDynamicController : BaseControllerApi<OutlineDynamic>
{
    private readonly IBaseRepository<OutlineDynamic> _BaseRepository;
    private readonly IConfiguration configuration;

    public OutlineDynamicController(IBaseRepository<OutlineDynamic> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

