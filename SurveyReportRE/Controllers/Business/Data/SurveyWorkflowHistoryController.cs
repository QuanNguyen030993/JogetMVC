using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyWorkflowHistoryController : BaseControllerApi<SurveyWorkflowHistory>
{
    private readonly IBaseRepository<SurveyWorkflowHistory> _BaseRepository;
	private readonly IConfiguration configuration;

	public SurveyWorkflowHistoryController(IBaseRepository<SurveyWorkflowHistory> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

