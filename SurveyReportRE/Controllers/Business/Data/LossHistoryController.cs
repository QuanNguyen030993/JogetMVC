using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class LossHistoryController : BaseControllerApi<LossHistory>
{
    private readonly IBaseRepository<LossHistory> _BaseRepository;
    private readonly IConfiguration configuration;

    public LossHistoryController(IBaseRepository<LossHistory> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

