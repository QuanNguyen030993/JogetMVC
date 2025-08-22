using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class AppendixController : BaseControllerApi<Appendix>
{
    private readonly IBaseRepository<Appendix> _BaseRepository;
    private readonly IConfiguration configuration;

    public AppendixController(IBaseRepository<Appendix> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

