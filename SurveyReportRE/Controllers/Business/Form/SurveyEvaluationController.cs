using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Config;
using System.Collections.Generic;
using System.Linq;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyEvaluationController : BaseControllerApi<SurveyEvaluation>
{
    private readonly IBaseRepository<SurveyEvaluation> _BaseRepository;
	private readonly IConfiguration configuration;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<Outline> _outlineRepository;

    public SurveyEvaluationController(IBaseRepository<SurveyEvaluation> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _outlineRepository = new BaseRepository<Outline>(configuration, _httpContextAccessor);
    }

    public async Task<IActionResult> GetCategories()
    {
        SurveyEvaluation surveyEvaluation = new SurveyEvaluation();
        List<EnumData> categories = await _enumDataRepository.EnumData(typeof(SurveyEvaluation).Name);
        //if (categories.Any(a => a.MappingField == nameof(surveyEvaluation.SurveyCategoryTypeId))) ;
        //categories = categories.Where(a => a.MappingField == nameof(surveyEvaluation.SurveyCategoryTypeId)).ToList();
        if (categories.Any(a => a.Name == "SurveyCategoryType")) ;
        categories = categories.Where(a => a.Name == "SurveyCategoryType").ToList();
        //List<Outline> outlines = new List<Outline>();
        //outlines = await _outlineRepository.GetListObject(l => l.SurveyTypeId == surveyTypeId && l.ParentId == null);
        return Ok(categories);
    }

    public async Task<IActionResult> GetGrades()
    {
        SurveyEvaluation surveyEvaluation = new SurveyEvaluation();
        List<EnumData> grades = await _enumDataRepository.EnumData(typeof(SurveyEvaluation).Name);
        if (grades.Any(a => a.Name == "SurveyStatus")) ;
        grades = grades.Where(a => a.Name == "SurveyStatus").ToList(); 
        return Ok(grades);
    }
}

