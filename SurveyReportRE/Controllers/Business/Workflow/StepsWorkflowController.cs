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
using ERPCore.Models.Request;
using Microsoft.SharePoint.WorkflowActions;
using ERPCore.Models.Migration.Config;
using static WorkflowDefinition_FormModel;

[ApiController]
[Route("api/[controller]/[action]")]
public class StepsWorkflowController : BaseControllerApi<StepsWorkflow>
{
    private readonly IBaseRepository<StepsWorkflow> _BaseRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<WorkflowInstanceNode> _workflowInstanceNodeRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public StepsWorkflowController(IBaseRepository<StepsWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _workflowInstanceNodeRepository = new BaseRepository<WorkflowInstanceNode>(configuration, _httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);

    }

    [HttpGet("{flowGuid}/{currentStepNo}")]
    public async Task<IActionResult> GetNextStep(Guid flowGuid, string currentStepNo)
    {//current is next at currnt 
        List<StepsWorkflow> stepsWorkflow = new List<StepsWorkflow>();
        stepsWorkflow = await _BaseRepository.GetListObject(l => l.WorkflowDefinitionId == flowGuid);
        if (Util.GetLastSegment(currentStepNo) < stepsWorkflow.Count)
            stepsWorkflow = stepsWorkflow.Skip((Util.GetLastSegment(currentStepNo) - 2)).Take(stepsWorkflow.Count > 3 ? stepsWorkflow.Count : 3 ).ToList();
        return Ok(stepsWorkflow);
    }

    [HttpPost]
    public async Task<IActionResult> BuildSteps([FromBody] WorkflowSavePayload workflowDefinition)
    {//current is next at currnt 
        List<StepsWorkflow> stepsWorkflows = await _BaseRepository.GetListObject(l => l.WorkflowDefinitionId == workflowDefinition.WorkflowDefinitionId);

        if (stepsWorkflows.Count > 0)
        {
            stepsWorkflows.ForEach(async f =>
            {
                await _BaseRepository.DeleteData(f, f.Id, "Id", true);
            });
        }
        List<EnumData> enumDatas = await _enumDataRepository.EnumData("OverallStatus");
        foreach (StepsWorkflow f in workflowDefinition.Steps)
        {
            StepsWorkflow stepsWorkflow = new StepsWorkflow();

            JsonConvert.PopulateObject(JsonConvert.SerializeObject(f), stepsWorkflow);

            string fromNodeId = workflowDefinition.Nodes.FirstOrDefault(fi => fi.NodeId == f.FromNodeId).NodeName ?? "";
            string toNodeId = workflowDefinition.Nodes.FirstOrDefault(fi => fi.NodeId == f.ToNodeId).NodeName ?? "";
            stepsWorkflow.FromNodeId = fromNodeId;
            stepsWorkflow.ToNodeId = toNodeId;
            stepsWorkflow.StatusCode = enumDatas.FirstOrDefault(x => x.Id == f.StatusId)?.Code ?? "";
            stepsWorkflow.StatusName = enumDatas.FirstOrDefault(x => x.Id == f.StatusId)?.Value ?? "";
            stepsWorkflow.Command = f.Command ?? "";
            await _BaseRepository.InsertData(stepsWorkflow);


           
        }
        foreach (var f in workflowDefinition.Nodes)
        {
            List<WorkflowInstanceNode> workflowInstanceNodes = await _workflowInstanceNodeRepository.GetListObject(l => l.Code == f.NodeId);

            if (workflowInstanceNodes.Count > 0)
            {
                workflowInstanceNodes.ForEach(async f =>
                {
                    await _workflowInstanceNodeRepository.DeleteData(f, f.Id, "Id", true);
                });
            }
            WorkflowInstanceNode workflowInstanceNode = new WorkflowInstanceNode();
            workflowInstanceNode.Code = f.NodeId ?? "";
            JsonConvert.PopulateObject(JsonConvert.SerializeObject(f), workflowInstanceNode);

            await _workflowInstanceNodeRepository.InsertData(workflowInstanceNode);
        }


        return Ok();
    }

}

