using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.MasterData;

[ApiController]
[Route("api/[controller]/[action]")]
public class TurnAroundTimeConfigController : BaseControllerApi<TurnAroundTimeConfig>
{
    private readonly IBaseRepository<TurnAroundTimeConfig> _BaseRepository;
	private readonly IConfiguration configuration;

	public TurnAroundTimeConfigController(IBaseRepository<TurnAroundTimeConfig> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }



}

