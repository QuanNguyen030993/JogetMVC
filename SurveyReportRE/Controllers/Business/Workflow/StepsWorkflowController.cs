using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.Workflow;
using Syncfusion.Pdf.Graphics;
using System.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class StepsWorkflowController : BaseControllerApi<StepsWorkflow>
{
    private readonly IBaseRepository<StepsWorkflow> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public StepsWorkflowController(IBaseRepository<StepsWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;

    }
}

