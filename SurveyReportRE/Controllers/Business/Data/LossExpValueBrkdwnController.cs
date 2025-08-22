using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class LossExpValueBrkdwnController : BaseControllerApi<LossExpValueBrkdwn>
{
    private readonly IBaseRepository<LossExpValueBrkdwn> _BaseRepository;
    private readonly IConfiguration configuration;

    public LossExpValueBrkdwnController(IBaseRepository<LossExpValueBrkdwn> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

