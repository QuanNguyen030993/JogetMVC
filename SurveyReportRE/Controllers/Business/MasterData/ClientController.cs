using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;
using System.Dynamic;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientController : BaseControllerApi<Client>
{
    private readonly IBaseRepository<Client> _BaseRepository;
	private readonly IConfiguration configuration;

    public ClientController(IBaseRepository<Client> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
}

