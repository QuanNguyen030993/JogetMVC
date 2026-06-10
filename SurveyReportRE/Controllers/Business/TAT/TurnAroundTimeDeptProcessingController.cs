using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.MasterData;

[ApiController]
[Route("api/[controller]/[action]")]
public class TurnAroundTimeDeptProcessingController : BaseControllerApi<TurnAroundTimeDeptProcessing>
{
    private readonly IBaseRepository<TurnAroundTimeDeptProcessing> _BaseRepository;
	private readonly IConfiguration configuration;

	public TurnAroundTimeDeptProcessingController(IBaseRepository<TurnAroundTimeDeptProcessing> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }



}

