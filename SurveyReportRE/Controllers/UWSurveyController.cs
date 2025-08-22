using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models;

[Route("api/[controller]")]
[ApiController]
public class UWSurveyController : BaseControllerApi<UWSurvey>
{
    private readonly IBaseRepository<UWSurvey> _BaseRepository;

    public UWSurveyController(IBaseRepository<UWSurvey> BaseRepository) : base(BaseRepository)
    {
        _BaseRepository = BaseRepository;
    }
}