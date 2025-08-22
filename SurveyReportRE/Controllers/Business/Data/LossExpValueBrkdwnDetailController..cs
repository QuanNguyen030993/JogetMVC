using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class LossExpValueBrkdwnDetailController : BaseControllerApi<LossExpValueBrkdwnDetail>
{
    private readonly IBaseRepository<LossExpValueBrkdwnDetail> _BaseRepository;
    private readonly IConfiguration configuration;

    public LossExpValueBrkdwnDetailController(IBaseRepository<LossExpValueBrkdwnDetail> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

