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
    [RequestSizeLimit(64 * 1024)]
    public async Task<IActionResult> LogClientError([FromBody] ClientBrowserError model)
    {
        if (model == null)
            return BadRequest(new { success = false, message = "Error payload is required." });

        try
        {
            var details = model.ErrorBrowserDetails ?? new ErrorBrowserDetails();
            details.ResponseText = Limit(details.ResponseText, 8000);
            details.Stack = Limit(details.Stack, 16000);
            details.FileName = Limit(details.FileName, 2048);
            details.FunctionName = Limit(details.FunctionName, 512);
            details.ErrorType = Limit(details.ErrorType, 64);
            details.Context = Limit(details.Context, 8000);

            if (details.BreadcrumbTrails?.Count > 0)
            {
                details.BreadcrumbTrails = details.BreadcrumbTrails.Take(20).ToList();
                details.BreadcrumbTrail = Limit(JsonConvert.SerializeObject(details.BreadcrumbTrails), 8000);
            }
            else
            {
                details.BreadcrumbTrails = new List<object>();
                details.BreadcrumbTrail = "[]";
            }

            model.Message = Limit(
                string.IsNullOrWhiteSpace(model.Message) ? details.ResponseText : model.Message,
                2000);
            model.Url = Limit(model.Url, 2048);
            model.UserAgent = Limit(model.UserAgent, 1024);
            model.Time = Limit(model.Time, 64);
            model.ErrorDetails = Limit(JsonConvert.SerializeObject(details), 32000);

            // ClientBrowserError is the primary record. The detail table currently
            // has no FK and must not prevent the main error from being persisted.
            model.ErrorBrowserDetails = null;
            await _BaseRepository.InsertData(model);

            try
            {
                await _errorBrowserDetailsRepository.InsertData(details);
            }
            catch (Exception detailException)
            {
                Log.Warning(detailException, "Client error was stored but its detail row could not be inserted.");
            }

            return Ok(new { success = true, id = model.Id });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to persist a client browser error.");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                message = "Unable to persist client error."
            });
        }
    }

    private static string Limit(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return "";
        return value.Length <= maxLength ? value : value[..maxLength];
    }

    [HttpGet]
    public async Task<object> CountTrend(string interval = "day", int take = 30)
    {
        take = Math.Clamp(take, 1, 366);
        string bucket = interval?.ToLowerInvariant() switch
        {
            "hour" => "DATEADD(hour, DATEDIFF(hour, 0, CreatedDate), 0)",
            "month" => "DATEFROMPARTS(YEAR(CreatedDate), MONTH(CreatedDate), 1)",
            "year" => "DATEFROMPARTS(YEAR(CreatedDate), 1, 1)",
            _ => "CAST(CreatedDate AS date)"
        };
        string query = $@"
SELECT TOP ({take}) {bucket} AS [time], COUNT_BIG(1) AS [count]
FROM dbo.ClientBrowserError WITH (NOLOCK)
WHERE CreatedDate IS NOT NULL
GROUP BY {bucket}
ORDER BY [time] DESC;";
        return await _BaseRepository.ExecuteCustomQuery(query);
    }
}

