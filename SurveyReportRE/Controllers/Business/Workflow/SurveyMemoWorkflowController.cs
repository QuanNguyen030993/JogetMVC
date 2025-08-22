using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.Workflow;
using Syncfusion.Pdf.Graphics;
using System.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyMemoWorkflowController : BaseControllerApi<SurveyMemoWorkflow>
{
    private readonly IBaseRepository<SurveyMemoWorkflow> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public SurveyMemoWorkflowController(IBaseRepository<SurveyMemoWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;

    }
}

