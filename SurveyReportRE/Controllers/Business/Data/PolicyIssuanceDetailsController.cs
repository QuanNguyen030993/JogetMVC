using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceDetailsController : BaseControllerApi<PolicyIssuanceDetails>
{
    private readonly IBaseRepository<PolicyIssuanceDetails> _BaseRepository;
	private readonly IConfiguration configuration;

	public PolicyIssuanceDetailsController(IBaseRepository<PolicyIssuanceDetails> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

