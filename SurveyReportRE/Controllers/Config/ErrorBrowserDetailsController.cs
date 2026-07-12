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
FROM dbo.ErrorBrowserDetails WITH (NOLOCK)
WHERE CreatedDate IS NOT NULL
GROUP BY {bucket}
ORDER BY [time] DESC;";
        return await _BaseRepository.ExecuteCustomQuery(query);
    }

}

