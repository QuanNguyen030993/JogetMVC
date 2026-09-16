using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;
using Newtonsoft.Json;

public class PolicyIssuancePmChecklistUpdateRequest
{
    public bool PMCheck { get; set; }
}

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceChecklistController : BaseControllerApi<PolicyIssuanceChecklist>
{
    private readonly IBaseRepository<PolicyIssuanceChecklist> _BaseRepository;
	private readonly IConfiguration configuration;

    public PolicyIssuanceChecklistController(IBaseRepository<PolicyIssuanceChecklist> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    [HttpGet("{policyIssuanceId:long}")]
    public async Task<IActionResult> Completion(long policyIssuanceId)
    {
        var rows = await _BaseRepository.GetListObject(item =>
            item.PolicyIssuanceId == policyIssuanceId && !item.Deleted);

        var completed = rows.Count(item => item.PMCheck);

        return Ok(new
        {
            total = rows.Count,
            completed,
            incomplete = rows.Count - completed,
            isComplete = rows.Count > 0 && completed == rows.Count
        });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdatePmCheck(
        long id,
        [FromBody] PolicyIssuancePmChecklistUpdateRequest request)
    {
        var row = await _BaseRepository.GetObjectByIdAsync(id);
        if (row == null || row.Deleted)
        {
            return NotFound("PM checklist item was not found.");
        }

        var changes = new
        {
            request.PMCheck,
            Result = request.PMCheck ? "checked" : "review"
        };

        row.PMCheck = changes.PMCheck;
        row.Result = changes.Result;

        await _BaseRepository.UpdateData(
            row,
            JsonConvert.SerializeObject(changes),
            id,
            "Id");

        return Ok(new
        {
            id,
            pmCheck = row.PMCheck,
            result = row.Result
        });
    }

}

