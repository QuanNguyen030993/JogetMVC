using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class ProtectionDetailController : BaseControllerApi<ProtectionDetail>
{
    private readonly IBaseRepository<ProtectionDetail> _BaseRepository;
    private readonly IConfiguration configuration;

    public ProtectionDetailController(IBaseRepository<ProtectionDetail> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

