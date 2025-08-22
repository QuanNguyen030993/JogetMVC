using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models;

[Route("api/[controller]")]
[ApiController]
public class RiskEvaluationController : BaseControllerApi<RiskEvaluation>
{
    private readonly IBaseRepository<RiskEvaluation> _BaseRepository;

    public RiskEvaluationController(IBaseRepository<RiskEvaluation> BaseRepository) : base(BaseRepository)  
    {
        _BaseRepository = BaseRepository;
    }

}