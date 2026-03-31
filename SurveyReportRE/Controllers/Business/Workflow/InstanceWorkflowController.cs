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

[ApiController]
[Route("api/[controller]/[action]")]
public class InstanceWorkflowController : BaseControllerApi<InstanceWorkflow>
{
    private readonly IBaseRepository<InstanceWorkflow> _BaseRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
    }

    [HttpPost]
    public async Task<IActionResult> SubmitNextStep([FromBody] SubmitRequest submitRequest)
    {
        submitRequest.InstanceWorkflow.CurrentStep = UpStep(submitRequest.InstanceWorkflow);
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");
        return Ok();
    }
    public static int UpStep(InstanceWorkflow instanceWorkflow)
    {
        if (instanceWorkflow != null)
            return (instanceWorkflow?.CurrentStep ?? 0) + 1;
        else return 1;
    }
    public static int DownStep(InstanceWorkflow instanceWorkflow)
    {
        if (instanceWorkflow != null)
            return ((instanceWorkflow?.CurrentStep ?? 0) - 1) < 1 ? 1 : (instanceWorkflow?.CurrentStep ?? 0) - 1;
        else return 1;
    }
}

