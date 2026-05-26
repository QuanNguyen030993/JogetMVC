using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceChecklistController : BaseControllerApi<PolicyIssuanceChecklist>
{
    private readonly IBaseRepository<PolicyIssuanceChecklist> _BaseRepository;
	private readonly IConfiguration configuration;

	public PolicyIssuanceChecklistController(IBaseRepository<PolicyIssuanceChecklist> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

