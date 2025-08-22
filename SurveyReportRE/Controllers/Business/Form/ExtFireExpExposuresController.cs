using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class ExtFireExpExposuresController : BaseControllerApi<ExtFireExpExposures>
{
    private readonly IBaseRepository<ExtFireExpExposures> _BaseRepository;
	private readonly IConfiguration configuration;
    private readonly IBaseRepository<EnumData> _enumDataRepository;

    public ExtFireExpExposuresController(IBaseRepository<ExtFireExpExposures> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAdditionalOutline(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        return Ok(Base.AdditionalOutline);
    }
}

