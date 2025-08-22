using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class MailTemplateController : BaseControllerApi<MailTemplate>
{
    private readonly IBaseRepository<MailTemplate> _BaseRepository;
	private readonly IConfiguration configuration;

	public MailTemplateController(IBaseRepository<MailTemplate> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

