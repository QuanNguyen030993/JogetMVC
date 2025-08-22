using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models;

[Route("api/[controller]")]
[ApiController]
public class SurveyResultStatusController : BaseControllerApi<SurveyResultStatus>
{
    private readonly IBaseRepository<SurveyResultStatus> _BaseRepository;

    public SurveyResultStatusController(IBaseRepository<SurveyResultStatus> BaseRepository) : base(BaseRepository)
    {
        _BaseRepository = BaseRepository;
    }
}