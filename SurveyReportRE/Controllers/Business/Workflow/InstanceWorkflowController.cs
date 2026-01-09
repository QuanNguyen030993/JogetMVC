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
public class InstanceWorkflowController : BaseControllerApi<InstanceWorkflow>
{
    private readonly IBaseRepository<InstanceWorkflow> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;

    }
}

