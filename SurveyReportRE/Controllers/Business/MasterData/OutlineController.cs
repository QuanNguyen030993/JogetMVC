using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class OutlineController : BaseControllerApi<Outline>
{
    private readonly IBaseRepository<Outline> _BaseRepository;
	private readonly IConfiguration configuration;

	public OutlineController(IBaseRepository<Outline> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

