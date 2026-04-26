using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Serilog;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class ErrorBrowserDetailsController : BaseControllerApi<ErrorBrowserDetails>
{
    private readonly IBaseRepository<ErrorBrowserDetails> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public ErrorBrowserDetailsController(IBaseRepository<ErrorBrowserDetails> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
    }

}

