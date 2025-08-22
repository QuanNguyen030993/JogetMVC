using DocumentFormat.OpenXml.Wordprocessing;
using ExCSS;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class UrlCallController : BaseControllerApi<UrlCall>
{
    private readonly IBaseRepository<UrlCall> _BaseRepository;
    private readonly IConfiguration configuration;

    public UrlCallController(IBaseRepository<UrlCall> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
    [HttpGet]
    public async Task<IActionResult> ReturnView(Guid? guid)
    {
        UrlCall urlCall = new UrlCall();
        urlCall = await _BaseRepository.GetSingleObject(x => x.Guid == guid);
        if (urlCall != null)
        {
            return Redirect($"/Management?loadParams={JsonConvert.SerializeObject(urlCall.Params)}");
        }
        else
            return Redirect("/Management#");
    }
}

