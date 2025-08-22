using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class LossHistoryDetailController : BaseControllerApi<LossHistoryDetail>
{
    private readonly IBaseRepository<LossHistoryDetail> _BaseRepository;
    private readonly IConfiguration configuration;

    public LossHistoryDetailController(IBaseRepository<LossHistoryDetail> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

