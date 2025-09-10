using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class MailQueueController : BaseControllerApi<MailQueue>
{
    private readonly IBaseRepository<MailQueue> _BaseRepository;
	private readonly IConfiguration configuration;

	public MailQueueController(IBaseRepository<MailQueue> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

