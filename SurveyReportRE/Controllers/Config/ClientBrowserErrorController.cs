using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Serilog;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientBrowserErrorController : BaseControllerApi<ClientBrowserError>
{
    private readonly IBaseRepository<ClientBrowserError> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public ClientBrowserErrorController(IBaseRepository<ClientBrowserError> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpPost]
    public async Task<IActionResult> LogClientError([FromBody] ClientBrowserError model)
    {
        try
        {
            model.ErrorDetails = JsonConvert.SerializeObject(model.ErrorBrowserDetails);
            await _BaseRepository.InsertData(model);
            //var errorLog = new ClientBrowserError
            //{
            //    Message = model.Message,
            //    Url = model.Url,
            //    UserAgent = model.UserAgent,
            //    Status = model.ErrorDetails?.Status?.ToString(),
            //    ResponseText = model.ErrorDetails?.ResponseText,
            //    StackTrace = model.ErrorDetails?.Stack,
            //    CreatedAt = DateTime.UtcNow
            //};

            //_context.ClientErrorLogs.Add(errorLog);
            //_context.SaveChanges();

            //_logger.LogError($"Client Error at {model.Url}: {model.Message}");

            return Ok();
        }
        catch (Exception ex)
        {
            Log.Error(ex,ex.Message);
            return StatusCode(500, "Error saving client log");
        }
    }
}

