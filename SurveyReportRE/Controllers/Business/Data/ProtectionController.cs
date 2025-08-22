using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class ProtectionController : BaseControllerApi<Protection>
{
    private readonly IBaseRepository<Protection> _BaseRepository;
    private readonly IConfiguration configuration;

    public ProtectionController(IBaseRepository<Protection> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAdditionalOutline(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        return Ok(Base.AdditionalOutline);
    }
}

