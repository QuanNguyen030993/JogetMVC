using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class ParticipantListController : BaseControllerApi<ParticipantList>
{
    private readonly IBaseRepository<ParticipantList> _BaseRepository;
    private readonly IConfiguration configuration;

    public ParticipantListController(IBaseRepository<ParticipantList> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
    [HttpGet]
    public override async Task<ActionResult<ParticipantList>> GetAll()
    {
        dynamic baseResult = await base.GetAll();

        if (baseResult.Result?.Value is IEnumerable<ParticipantList> participantList)
        {
            var orderedList = participantList.OrderBy(o => o.SideOrder).ThenBy(t => t.RowOrder).ToList();

            return Ok(orderedList);
        }
        return Ok();
    }
}

