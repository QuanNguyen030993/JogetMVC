using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Serilog;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Request;
using ERPCore.Models.Migration.Business.Social;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientBrowserErrorController : BaseControllerApi<ClientBrowserError>
{
    private readonly IBaseRepository<ClientBrowserError> _BaseRepository;
    private readonly IBaseRepository<ErrorBrowserDetails> _errorBrowserDetailsRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public ClientBrowserErrorController(IBaseRepository<ClientBrowserError> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
        _errorBrowserDetailsRepository = new  BaseRepository<ErrorBrowserDetails>(configuration, _httpContextAccessor);
    }
    /// <summary>
    /// How to use ErrorBrowserDetails
    /// 1. js file will indicate line number in Source > js file
    /// 2. view file will indicate line number in Source > Index file
    /// </summary>
    /// <param name="model"></param>
    /// <returns></returns>
    [HttpPost]
    public async Task<IActionResult> LogClientError([FromBody] ClientBrowserError model)
    {
        try
        {
            //model.ErrorDetails = JsonConvert.SerializeObject(model.ErrorBrowserDetails);
           

            if (model?.ErrorBrowserDetails != null )
            {
                if (model?.ErrorBrowserDetails?.BreadcrumbTrails != null)
                    if (model?.ErrorBrowserDetails?.BreadcrumbTrails.Count > 0)
                    model.ErrorBrowserDetails.BreadcrumbTrail = JsonConvert.SerializeObject(model?.ErrorBrowserDetails?.BreadcrumbTrails);
            }
            if (model?.ErrorBrowserDetails?.FileName != null &&
                !(string.IsNullOrEmpty(model?.ErrorBrowserDetails?.ResponseText)))
            {
            await _errorBrowserDetailsRepository.InsertData(model?.ErrorBrowserDetails ?? new ErrorBrowserDetails());
                await _BaseRepository.InsertData(model);
            }

            return Ok();
        }
        catch (Exception ex)
        {
            Log.Error(ex,ex.Message);
            return Ok();
        }
    }
}

