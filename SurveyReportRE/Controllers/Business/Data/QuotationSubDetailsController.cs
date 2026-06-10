using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationSubDetailsController : BaseControllerApi<QuotationSubDetails>
{
    private readonly IBaseRepository<QuotationSubDetails> _BaseRepository;
	private readonly IConfiguration configuration;

	public QuotationSubDetailsController(IBaseRepository<QuotationSubDetails> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

