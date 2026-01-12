using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientLocationDetailController : BaseControllerApi<ClientLocationDetail>
{
    private readonly IBaseRepository<ClientLocationDetail> _BaseRepository;
	private readonly IConfiguration configuration;

	public ClientLocationDetailController(IBaseRepository<ClientLocationDetail> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

