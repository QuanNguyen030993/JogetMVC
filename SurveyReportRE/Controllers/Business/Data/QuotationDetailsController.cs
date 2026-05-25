using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationDetailsController : BaseControllerApi<QuotationDetails>
{
    private readonly IBaseRepository<QuotationDetails> _BaseRepository;
	private readonly IConfiguration configuration;

	public QuotationDetailsController(IBaseRepository<QuotationDetails> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

