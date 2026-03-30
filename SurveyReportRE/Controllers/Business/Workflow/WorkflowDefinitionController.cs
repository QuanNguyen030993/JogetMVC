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
using ERPCore.Models.Migration.Business.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class WorkflowDefinitionController : BaseControllerApi<WorkflowDefinition>
{
    private readonly IBaseRepository<WorkflowDefinition> _BaseRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepWorkflowRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public WorkflowDefinitionController(IBaseRepository<WorkflowDefinition> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _stepWorkflowRepository =  new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);

    }

    [HttpGet("{flowGuid}")]
    public async Task<IActionResult> GetStepsList(Guid flowGuid)
    {
        List<StepsWorkflow> stepsWorkflow = new List<StepsWorkflow>();
        stepsWorkflow = await _stepWorkflowRepository.GetListObject(l => l.WorkflowDefinitionId == flowGuid);
        return Ok(stepsWorkflow);
    }


}

