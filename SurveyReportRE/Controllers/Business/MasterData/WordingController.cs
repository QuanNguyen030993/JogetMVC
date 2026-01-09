using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.MasterData;

[ApiController]
[Route("api/[controller]/[action]")]
public class WordingController : BaseControllerApi<Wording>
{
    private readonly IBaseRepository<Wording> _BaseRepository;
	private readonly IConfiguration configuration;

	public WordingController(IBaseRepository<Wording> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetDefaultByField(string fieldName)
    {
        Wording wording = new Wording();
        wording = await _BaseRepository.FindBy(f=> f.DefaultField == fieldName);
        return Ok(wording);
    }

}

